<script setup lang="ts">
import { ref, computed } from 'vue'
import RecipeForm from './RecipeForm.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useRecipeStore } from '@/stores/recipe.store'
import type { Recipe } from '@/types/app.types'

const props = defineProps<{
  planId: string
  selectedIds: string[]
}>()

const emit = defineEmits<{
  add: [recipeId: string]
  remove: [recipeId: string]
}>()

const recipeStore = useRecipeStore()
const search = ref('')
const showForm = ref(false)

// Only show results when there's a search query
const searchResults = computed(() => {
  if (!search.value.trim()) return []
  return recipeStore.searchRecipes(search.value).filter((r) => !props.selectedIds.includes(r.id))
})

function onSaved(recipe: Recipe) {
  showForm.value = false
  emit('add', recipe.id)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Already-added recipes -->
    <div v-if="selectedIds.length" class="space-y-1">
      <div
        v-for="id in selectedIds"
        :key="id"
        class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl"
      >
        <span class="flex-1 text-sm text-gray-800 truncate">
          {{ recipeStore.recipeById(id)?.title ?? '…' }}
        </span>
        <button
          type="button"
          class="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors p-0.5"
          @click="emit('remove', id)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Create new form -->
    <RecipeForm
      v-if="showForm"
      :plan-id="planId"
      @saved="onSaved"
      @cancel="showForm = false"
    />

    <template v-else>
      <BaseInput
        v-model="search"
        placeholder="Search recipes..."
      />

      <!-- Search results -->
      <div v-if="search.trim()" class="max-h-48 overflow-y-auto space-y-1">
        <button
          v-for="recipe in searchResults"
          :key="recipe.id"
          type="button"
          class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 truncate min-h-[44px] flex items-center"
          @click="emit('add', recipe.id)"
        >
          {{ recipe.title }}
        </button>
        <p v-if="!searchResults.length" class="text-sm text-gray-400 px-3 py-2">
          No matching recipes
        </p>
      </div>
      <p v-else class="text-xs text-gray-400 px-1">
        Type to search recipes
      </p>

      <button
        type="button"
        class="w-full py-2 px-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
        @click="showForm = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create new recipe
      </button>
    </template>
  </div>
</template>
