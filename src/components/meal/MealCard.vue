<script setup lang="ts">
import { ref } from 'vue'
import { useMealStore } from '@/stores/meal.store'
import { useRecipeStore } from '@/stores/recipe.store'
import type { Recipe, Meal } from '@/types/app.types'

const props = defineProps<{ meal: Meal }>()
const emit = defineEmits<{ open: [] }>()

const mealStore = useMealStore()
const recipeStore = useRecipeStore()

const transferring = ref<'prev' | 'next' | null>(null)
const lightboxRecipe = ref<Recipe | null>(null)

function getImageUrl(path: string) {
  return recipeStore.getImageUrl(path)
}

async function transfer(direction: 'prev' | 'next') {
  transferring.value = direction
  try {
    await mealStore.transferMeal(props.meal.id, direction)
  } finally {
    transferring.value = null
  }
}
</script>

<template>
  <div
    class="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all"
    :class="{ 'opacity-60': meal.is_done }"
    @click="mealStore.toggleDone(meal.id)"
  >
    <!-- Header row -->
    <div class="px-3 pt-3 pb-2 flex items-start gap-2">
      <!-- Done indicator -->
      <div
        class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5"
        :class="meal.is_done ? 'bg-primary-600 border-primary-600' : 'border-gray-300'"
      >
        <svg v-if="meal.is_done" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <!-- Title -->
      <p
        class="flex-1 text-sm font-medium text-gray-900 leading-snug min-w-0"
        :class="{ 'line-through text-gray-400': meal.is_done }"
      >
        {{ meal.title }}
      </p>

      <!-- Action buttons -->
      <div class="flex items-center gap-0.5 flex-shrink-0 -mr-1" @click.stop>
        <button
          type="button"
          class="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
          :disabled="transferring !== null"
          title="Previous week"
          @click="transfer('prev')"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          class="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
          :disabled="transferring !== null"
          title="Next week"
          @click="transfer('next')"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          type="button"
          class="p-1.5 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          title="Edit meal"
          @click.stop="emit('open')"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Recipe list -->
    <div
      v-if="meal.recipes?.length"
      class="border-t border-gray-100"
      @click.stop
    >
      <div
        v-for="recipe in meal.recipes"
        :key="recipe.id"
        class="flex items-center gap-2.5 px-3 py-2 border-b border-gray-50 last:border-b-0"
      >
        <!-- Image thumbnail -->
        <button
          v-if="recipe.kind === 'image' && recipe.image_path"
          type="button"
          class="flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-200 hover:ring-primary-400 transition-all"
          @click="lightboxRecipe = recipe"
        >
          <img :src="getImageUrl(recipe.image_path)" :alt="recipe.title" class="w-full h-full object-cover" />
        </button>

        <!-- Recipe name: link if URL, plain text otherwise -->
        <a
          v-if="recipe.kind === 'url' && recipe.url"
          :href="recipe.url"
          target="_blank"
          rel="noopener"
          class="flex-1 text-xs text-blue-600 hover:underline truncate leading-snug"
        >
          {{ recipe.title }}
        </a>
        <span v-else class="flex-1 text-xs text-gray-700 truncate leading-snug">
          {{ recipe.title }}
        </span>
      </div>
    </div>
  </div>

  <!-- Lightbox -->
  <Teleport to="body">
    <div
      v-if="lightboxRecipe"
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      @click="lightboxRecipe = null"
    >
      <img
        :src="getImageUrl(lightboxRecipe.image_path!)"
        :alt="lightboxRecipe.title"
        class="max-w-full max-h-full rounded-xl object-contain"
        @click.stop
      />
      <button
        type="button"
        class="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
        @click="lightboxRecipe = null"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Teleport>
</template>
