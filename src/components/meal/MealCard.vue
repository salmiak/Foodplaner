<script setup lang="ts">
import MealDoneToggle from './MealDoneToggle.vue'
import RecipeChip from '@/components/recipe/RecipeChip.vue'
import type { Meal, DayOfWeek } from '@/types/app.types'
import { DAY_NAMES } from '@/types/app.types'
import { useMealStore } from '@/stores/meal.store'

const props = defineProps<{ meal: Meal }>()
const emit = defineEmits<{ open: [] }>()

const mealStore = useMealStore()

function toggle() {
  mealStore.toggleDone(props.meal.id)
}
</script>

<template>
  <div
    class="group bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all min-h-[44px]"
    :class="{ 'opacity-60': meal.is_done }"
    @click="emit('open')"
  >
    <div class="flex items-start gap-2">
      <MealDoneToggle :is-done="meal.is_done" @toggle="toggle" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <p
            class="text-sm font-medium text-gray-900 leading-snug"
            :class="{ 'line-through text-gray-400': meal.is_done }"
          >
            {{ meal.title }}
          </p>
          <span
            v-if="meal.day_of_week"
            class="text-[10px] font-semibold uppercase tracking-wide text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full"
          >
            {{ DAY_NAMES[meal.day_of_week as DayOfWeek] }}
          </span>
        </div>
        <div v-if="meal.recipes?.length" class="flex flex-wrap gap-1 mt-1.5">
          <RecipeChip
            v-for="recipe in meal.recipes"
            :key="recipe.id"
            :recipe="recipe"
          />
        </div>
      </div>
    </div>
  </div>
</template>
