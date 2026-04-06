<script setup lang="ts">
import MealDoneToggle from './MealDoneToggle.vue'
import RecipeChip from '@/components/recipe/RecipeChip.vue'
import type { Meal } from '@/types/app.types'
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
        <p
          class="text-sm font-medium text-gray-900 leading-snug"
          :class="{ 'line-through text-gray-400': meal.is_done }"
        >
          {{ meal.title }}
        </p>
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
