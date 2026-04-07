<script setup lang="ts">
import { ref } from 'vue'
import MealCard from '@/components/meal/MealCard.vue'
import MealDetailModal from '@/components/meal/MealDetailModal.vue'
import AddMealButton from './AddMealButton.vue'
import type { Meal } from '@/types/app.types'
import { isToday, formatDayLabel } from '@/lib/utils'

const props = defineProps<{
  dayOfWeek: number  // 1-7
  dayName: string
  date: Date
  meals: Meal[]
  planId: string
}>()

const activeMeal = ref<Meal | null>(null)
</script>

<template>
  <div class="flex flex-col h-full min-w-[140px] sm:min-w-0">
    <!-- Day header -->
    <div
      class="sticky top-[57px] z-10 bg-gray-50 px-2 py-2 border-b border-gray-100 flex-shrink-0"
    >
      <div
        class="text-center"
        :class="isToday(date) ? 'text-primary-600' : 'text-gray-600'"
      >
        <div class="text-xs font-semibold uppercase tracking-wide">{{ dayName }}</div>
        <div
          class="text-sm font-medium mt-0.5"
          :class="isToday(date) ? 'bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto' : ''"
        >
          {{ date.getUTCDate() }}
        </div>
      </div>
    </div>

    <!-- Meal list -->
    <div class="p-2 space-y-2 min-h-[80px]">
      <MealCard
        v-for="meal in meals"
        :key="meal.id"
        :meal="meal"
        @open="activeMeal = meal"
      />

      <AddMealButton :plan-id="planId" :day-of-week="dayOfWeek" />
    </div>
  </div>

  <!-- Meal detail modal -->
  <MealDetailModal
    v-if="activeMeal"
    :meal="activeMeal"
    :plan-id="planId"
    @close="activeMeal = null"
  />
</template>
