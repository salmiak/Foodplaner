<script setup lang="ts">
import { computed, ref } from 'vue'
import MealCard from '@/components/meal/MealCard.vue'
import MealDetailModal from '@/components/meal/MealDetailModal.vue'
import AddMealButton from './AddMealButton.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useMealStore } from '@/stores/meal.store'
import type { Meal } from '@/types/app.types'

const props = defineProps<{ planId: string }>()

const mealStore = useMealStore()
const activeMeal = ref<Meal | null>(null)

// All meals sorted by assigned day (unassigned last), then sort_order
const sortedMeals = computed(() =>
  [...mealStore.meals].sort((a, b) => {
    const dayA = a.day_of_week ?? 8
    const dayB = b.day_of_week ?? 8
    if (dayA !== dayB) return dayA - dayB
    return a.sort_order - b.sort_order
  }),
)
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0">
    <div v-if="mealStore.loading" class="flex-1 flex items-center justify-center">
      <BaseSpinner size="lg" />
    </div>

    <div v-else class="flex-1 overflow-y-auto">
      <div class="max-w-lg mx-auto p-4 space-y-3">
        <MealCard
          v-for="meal in sortedMeals"
          :key="meal.id"
          :meal="meal"
          @open="activeMeal = meal"
        />

        <AddMealButton :plan-id="planId" :day-of-week="null" />
      </div>
    </div>
  </div>

  <MealDetailModal
    v-if="activeMeal"
    :meal="activeMeal"
    :plan-id="planId"
    @close="activeMeal = null"
  />
</template>
