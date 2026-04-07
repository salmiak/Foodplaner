<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import WeekSelector from '@/components/layout/WeekSelector.vue'
import WeekGrid from '@/components/week/WeekGrid.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { usePlanStore } from '@/stores/plan.store'
import { useWeekStore } from '@/stores/week.store'
import { useMealStore } from '@/stores/meal.store'
import { useRecipeStore } from '@/stores/recipe.store'
import { useRealtime } from '@/composables/useRealtime'
import { getCurrentISOWeek } from '@/lib/utils'
import type { PresenceUser } from '@/types/app.types'

const route = useRoute()
const router = useRouter()
const planStore = usePlanStore()
const weekStore = useWeekStore()
const mealStore = useMealStore()
const recipeStore = useRecipeStore()

const loading = ref(true)
const initError = ref<string | null>(null)
const presentUsers = ref<PresenceUser[]>([])

async function initialize() {
  loading.value = true
  initError.value = null
  try {
    await planStore.fetchUserPlans()

    let planId = route.params.planId as string

    if (!planId) {
      if (planStore.userPlans.length === 0) {
        const plan = await planStore.createPlan('Min matplan')
        planId = plan.id
      } else {
        planId = planStore.userPlans[0].id
      }
    }

    if (!planStore.currentPlan || planStore.currentPlan.id !== planId) {
      await planStore.fetchPlan(planId)
    }

    const year = route.params.year
      ? parseInt(route.params.year as string)
      : getCurrentISOWeek().year
    const weekNumber = route.params.week
      ? parseInt(route.params.week as string)
      : getCurrentISOWeek().weekNumber

    if (!route.params.year) {
      router.replace({
        name: 'week',
        params: { planId, year, week: weekNumber },
      })
    }

    await weekStore.loadWeek(planId, year, weekNumber)

    await Promise.all([
      mealStore.fetchMeals(weekStore.weekId!),
      recipeStore.fetchRecipes(planId),
    ])

    const realtime = useRealtime(planId)
    realtime.subscribe()

    watch(realtime.presentUsers, (users) => {
      presentUsers.value = users as PresenceUser[]
    })
  } catch (err) {
    console.error('WeekView init error:', err)
    initError.value = err instanceof Error ? err.message : 'Något gick fel vid inläsning.'
  } finally {
    loading.value = false
  }
}

watch(
  () => [route.params.year, route.params.week],
  async ([year, week]) => {
    if (!year || !week || !planStore.currentPlan) return
    mealStore.clear()
    await weekStore.loadWeek(
      planStore.currentPlan.id,
      parseInt(year as string),
      parseInt(week as string),
    )
    await mealStore.fetchMeals(weekStore.weekId!)
  },
)

onMounted(initialize)
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <AppHeader :present-users="presentUsers">
      <template #center>
        <WeekSelector />
      </template>
    </AppHeader>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <BaseSpinner size="lg" />
    </div>

    <!-- Error -->
    <div v-else-if="initError" class="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
      <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
        <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <div>
        <p class="font-semibold text-gray-900 mb-1">Kunde inte ladda planen</p>
        <p class="text-sm text-gray-500 mb-1">{{ initError }}</p>
        <p class="text-xs text-gray-400">Kontrollera att Supabase-miljövariablerna är konfigurerade och att databasmigrationerna har körts.</p>
      </div>
      <BaseButton @click="initialize">Försök igen</BaseButton>
    </div>

    <!-- Week grid -->
    <WeekGrid
      v-else-if="planStore.currentPlan"
      :plan-id="planStore.currentPlan.id"
      class="flex-1 min-h-0"
    />

    <!-- Spacer for bottom nav -->
    <div class="h-[calc(56px+env(safe-area-inset-bottom))] flex-shrink-0" />
    <BottomNav />
  </div>
</template>
