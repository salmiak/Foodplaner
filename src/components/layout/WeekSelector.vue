<script setup lang="ts">
import { useWeekStore } from '@/stores/week.store'
import { useWeekNavigation } from '@/composables/useWeekNavigation'
import { getCurrentISOWeek } from '@/lib/utils'

const weekStore = useWeekStore()
const { goToPreviousWeek, goToNextWeek, navigateToWeek } = useWeekNavigation()

function goToToday() {
  const { year, weekNumber } = getCurrentISOWeek()
  navigateToWeek(year, weekNumber)
}
</script>

<template>
  <div class="flex items-center gap-1">
    <button
      class="p-2 rounded-full hover:bg-gray-100 text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
      @click="goToPreviousWeek"
      title="Previous week"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <button
      class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors text-center min-w-[130px]"
      @click="goToToday"
      :title="weekStore.isCurrentWeek ? 'Current week' : 'Go to current week'"
    >
      <div class="flex flex-col items-center leading-tight">
        <span class="text-xs text-gray-400">Week {{ weekStore.currentWeekNumber }}, {{ weekStore.currentYear }}</span>
        <span class="text-sm font-semibold text-gray-800 truncate max-w-[160px]">{{ weekStore.weekLabel }}</span>
      </div>
    </button>

    <button
      class="p-2 rounded-full hover:bg-gray-100 text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
      @click="goToNextWeek"
      title="Next week"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</template>
