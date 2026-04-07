<script setup lang="ts">
import { computed, ref } from 'vue'
import DayColumn from './DayColumn.vue'
import MealCard from '@/components/meal/MealCard.vue'
import MealDetailModal from '@/components/meal/MealDetailModal.vue'
import AddMealButton from './AddMealButton.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useMealStore } from '@/stores/meal.store'
import { useWeekStore } from '@/stores/week.store'
import { DAY_NAMES_SHORT } from '@/types/app.types'
import type { Meal } from '@/types/app.types'

const props = defineProps<{ planId: string }>()

const mealStore = useMealStore()
const weekStore = useWeekStore()

const activeMeal = ref<Meal | null>(null)

const days = computed(() =>
  weekStore.weekDates.map((date, i) => ({
    dayOfWeek: i + 1,
    dayName: DAY_NAMES_SHORT[(i + 1) as keyof typeof DAY_NAMES_SHORT],
    date,
    meals: mealStore.mealsByDay[String(i + 1)] ?? [],
  })),
)

const unassignedMeals = computed(() => mealStore.mealsByDay['null'] ?? [])
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0 overflow-hidden">

    <!-- Loading -->
    <div v-if="mealStore.loading" class="flex-1 flex items-center justify-center">
      <BaseSpinner size="lg" />
    </div>

    <template v-else>
      <!-- Day columns — horizontal scroll on mobile -->
      <div class="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
        <div class="flex" style="min-width: max-content; min-height: max(100%, 300px);">
          <DayColumn
            v-for="day in days"
            :key="day.dayOfWeek"
            v-bind="day"
            :plan-id="planId"
            class="w-[130px] sm:w-40 border-r border-gray-100 last:border-r-0 flex-shrink-0"
          />
        </div>
      </div>

      <!-- Unscheduled meals -->
      <div v-if="unassignedMeals.length" class="flex-shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-2">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ej schemalagda</p>
        <div class="flex gap-2 flex-wrap">
          <MealCard
            v-for="meal in unassignedMeals"
            :key="meal.id"
            :meal="meal"
            class="w-full sm:w-auto sm:min-w-[180px] sm:max-w-[240px]"
            @open="activeMeal = meal"
          />
        </div>
      </div>
    </template>
  </div>

  <MealDetailModal
    v-if="activeMeal"
    :meal="activeMeal"
    :plan-id="planId"
    @close="activeMeal = null"
  />
</template>
