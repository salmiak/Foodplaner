<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import WeekSelector from '@/components/layout/WeekSelector.vue'
import WeekGrid from '@/components/week/WeekGrid.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
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
const presentUsers = ref<PresenceUser[]>([])
let realtimeCleanup: (() => void) | null = null

async function initialize() {
  loading.value = true
  try {
    // Get or create user's plan
    await planStore.fetchUserPlans()

    let planId = route.params.planId as string

    if (!planId) {
      if (planStore.userPlans.length === 0) {
        const plan = await planStore.createPlan('My Meal Plan')
        planId = plan.id
      } else {
        planId = planStore.userPlans[0].id
      }
    }

    if (!planStore.currentPlan || planStore.currentPlan.id !== planId) {
      await planStore.fetchPlan(planId)
    }

    // Determine year/week from route or current
    const year = route.params.year
      ? parseInt(route.params.year as string)
      : getCurrentISOWeek().year
    const weekNumber = route.params.week
      ? parseInt(route.params.week as string)
      : getCurrentISOWeek().weekNumber

    // Redirect to canonical URL if needed
    if (!route.params.year) {
      router.replace({
        name: 'week',
        params: { planId, year, week: weekNumber },
      })
    }

    await weekStore.loadWeek(planId, year, weekNumber)

    // Load data in parallel
    await Promise.all([
      mealStore.fetchMeals(weekStore.weekId!),
      recipeStore.fetchRecipes(planId),
    ])

    // Set up realtime
    const realtime = useRealtime(planId)
    realtime.subscribe()
    presentUsers.value = realtime.presentUsers.value as PresenceUser[]

    // Watch present users
    const stopWatch = watch(realtime.presentUsers, (users) => {
      presentUsers.value = users as PresenceUser[]
    })

    realtimeCleanup = () => {
      stopWatch()
      realtime.unsubscribe()
    }
  } finally {
    loading.value = false
  }
}

// Re-load when route params change (week navigation)
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

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <BaseSpinner size="lg" />
    </div>

    <WeekGrid
      v-else-if="planStore.currentPlan"
      :plan-id="planStore.currentPlan.id"
      class="flex-1 overflow-hidden"
    />

    <!-- Bottom nav spacer -->
    <div class="h-[calc(56px+env(safe-area-inset-bottom))]" />
    <BottomNav />
  </div>
</template>
