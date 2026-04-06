import { useRouter, useRoute } from 'vue-router'
import { useWeekStore } from '@/stores/week.store'
import { usePlanStore } from '@/stores/plan.store'
import { getCurrentISOWeek } from '@/lib/utils'

export function useWeekNavigation() {
  const router = useRouter()
  const route = useRoute()
  const weekStore = useWeekStore()
  const planStore = usePlanStore()

  function navigateToWeek(year: number, weekNumber: number) {
    const planId = route.params.planId || planStore.currentPlan?.id
    if (!planId) return
    router.push({
      name: 'week',
      params: { planId, year, week: weekNumber },
    })
  }

  function goToPreviousWeek() {
    const { year, weekNumber } = weekStore.goToAdjacentWeek('prev')
    navigateToWeek(year, weekNumber)
  }

  function goToNextWeek() {
    const { year, weekNumber } = weekStore.goToAdjacentWeek('next')
    navigateToWeek(year, weekNumber)
  }

  function goToCurrentWeek() {
    const { year, weekNumber } = getCurrentISOWeek()
    navigateToWeek(year, weekNumber)
  }

  return { navigateToWeek, goToPreviousWeek, goToNextWeek, goToCurrentWeek }
}
