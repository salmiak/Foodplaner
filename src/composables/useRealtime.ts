import { onUnmounted, ref } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useMealStore } from '@/stores/meal.store'
import { useRecipeStore } from '@/stores/recipe.store'
import { useAuthStore } from '@/stores/auth.store'
import { stringToColor, getInitials } from '@/lib/utils'
import type { PresenceUser } from '@/types/app.types'

export function useRealtime() {
  const channel = ref<RealtimeChannel | null>(null)
  const presentUsers = ref<PresenceUser[]>([])
  const mealStore = useMealStore()
  const recipeStore = useRecipeStore()
  const authStore = useAuthStore()

  function subscribe(planId: string) {
    // Unsubscribe from any existing channel first (e.g. re-init or plan change)
    if (channel.value) {
      channel.value.unsubscribe()
      channel.value = null
    }

    channel.value = supabase
      .channel(`plan:${planId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meals', filter: `plan_id=eq.${planId}` },
        (payload) => mealStore.applyRealtimeEvent(payload as Parameters<typeof mealStore.applyRealtimeEvent>[0]),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recipes', filter: `plan_id=eq.${planId}` },
        (payload) => recipeStore.applyRealtimeEvent(payload as Parameters<typeof recipeStore.applyRealtimeEvent>[0]),
      )
      .on('presence', { event: 'sync' }, () => {
        if (!channel.value) return
        const state = channel.value.presenceState()
        presentUsers.value = (Object.values(state).flat() as unknown[]) as PresenceUser[]
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        for (const p of (newPresences as unknown[]) as PresenceUser[]) {
          if (!presentUsers.value.some((u) => u.user_id === p.user_id)) {
            presentUsers.value.push(p)
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftIds = ((leftPresences as unknown[]) as PresenceUser[]).map((p) => p.user_id)
        presentUsers.value = presentUsers.value.filter((u) => !leftIds.includes(u.user_id))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && authStore.userId) {
          await channel.value?.track({
            user_id: authStore.userId,
            email: authStore.userEmail ?? '',
            display_name: authStore.userEmail ?? '',
            color: stringToColor(authStore.userId),
            initials: getInitials(authStore.userEmail ?? authStore.userId ?? ''),
          })
        }
      })
  }

  function unsubscribe() {
    if (channel.value) {
      channel.value.unsubscribe()
      channel.value = null
    }
    presentUsers.value = []
  }

  onUnmounted(unsubscribe)

  return { subscribe, unsubscribe, presentUsers }
}
