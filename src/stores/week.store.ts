import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import {
  getCurrentISOWeek,
  getAdjacentWeek,
  formatWeekLabel,
  getWeekDates,
} from '@/lib/utils'
import type { Week } from '@/types/app.types'

export const useWeekStore = defineStore('week', () => {
  const { year: initYear, weekNumber: initWeek } = getCurrentISOWeek()

  const currentYear = ref(initYear)
  const currentWeekNumber = ref(initWeek)
  const weekId = ref<string | null>(null)
  const loading = ref(false)

  const weekLabel = computed(() =>
    formatWeekLabel(currentYear.value, currentWeekNumber.value),
  )

  const weekDates = computed(() =>
    getWeekDates(currentYear.value, currentWeekNumber.value),
  )

  const isCurrentWeek = computed(() => {
    const { year, weekNumber } = getCurrentISOWeek()
    return currentYear.value === year && currentWeekNumber.value === weekNumber
  })

  async function loadWeek(planId: string, year: number, weekNumber: number): Promise<string> {
    loading.value = true
    currentYear.value = year
    currentWeekNumber.value = weekNumber

    try {
      // Try to find existing week
      const { data: existing } = await supabase
        .from('weeks')
        .select('id')
        .eq('plan_id', planId)
        .eq('year', year)
        .eq('week_number', weekNumber)
        .single()

      if (existing) {
        weekId.value = existing.id
        return existing.id
      }

      // Create on demand
      const { data: created, error } = await supabase
        .from('weeks')
        .insert({ plan_id: planId, year, week_number: weekNumber })
        .select('id')
        .single()

      if (error) throw error
      weekId.value = created.id
      return created.id
    } finally {
      loading.value = false
    }
  }

  function setWeek(year: number, weekNumber: number) {
    currentYear.value = year
    currentWeekNumber.value = weekNumber
    weekId.value = null
  }

  function goToAdjacentWeek(direction: 'prev' | 'next') {
    const { year, weekNumber } = getAdjacentWeek(
      currentYear.value,
      currentWeekNumber.value,
      direction,
    )
    setWeek(year, weekNumber)
    return { year, weekNumber }
  }

  async function fetchWeekList(planId: string): Promise<Week[]> {
    const { data, error } = await supabase
      .from('weeks')
      .select('*')
      .eq('plan_id', planId)
      .order('year', { ascending: false })
      .order('week_number', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  return {
    currentYear,
    currentWeekNumber,
    weekId,
    loading,
    weekLabel,
    weekDates,
    isCurrentWeek,
    loadWeek,
    setWeek,
    goToAdjacentWeek,
    fetchWeekList,
  }
})
