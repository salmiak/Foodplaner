<script setup lang="ts">
import { ref, computed } from 'vue'
import RecipeChip from './RecipeChip.vue'
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

const filtered = computed(() => {
  const results = recipeStore.searchRecipes(search.value)
  return results.filter((r) => !props.selectedIds.includes(r.id))
})

function onCreated(recipe: Recipe) {
  showForm.value = false
  emit('add', recipe.id)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Selected recipes -->
    <div v-if="selectedIds.length" class="flex flex-wrap gap-1.5">
      <RecipeChip
        v-for="id in selectedIds"
        :key="id"
        :recipe="recipeStore.recipeById(id)!"
        removable
        @remove="emit('remove', id)"
      />
    </div>

    <!-- Create new form -->
    <RecipeForm
      v-if="showForm"
      :plan-id="planId"
      @created="onCreated"
      @cancel="showForm = false"
    />

    <template v-else>
      <BaseInput
        v-model="search"
        placeholder="Search recipes..."
      />

      <!-- Recipe list -->
      <div class="max-h-48 overflow-y-auto space-y-1">
        <button
          v-for="recipe in filtered"
          :key="recipe.id"
          type="button"
          class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 min-h-[44px]"
          @click="emit('add', recipe.id)"
        >
          <RecipeChip :recipe="recipe" />
          <span class="text-sm text-gray-700 truncate">{{ recipe.title }}</span>
        </button>
        <p v-if="!filtered.length" class="text-sm text-gray-400 px-3 py-2">
          {{ search ? 'No matching recipes' : 'No recipes yet' }}
        </p>
      </div>

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
