<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import RecipeChip from '@/components/recipe/RecipeChip.vue'
import RecipeForm from '@/components/recipe/RecipeForm.vue'
import RichTextEditor from '@/components/editor/RichTextEditor.vue'
import { useRecipeStore } from '@/stores/recipe.store'
import { usePlanStore } from '@/stores/plan.store'
import type { Recipe } from '@/types/app.types'

const route = useRoute()
const recipeStore = useRecipeStore()
const planStore = usePlanStore()

const search = ref('')
const showCreateForm = ref(false)
const selectedRecipe = ref<Recipe | null>(null)
const editing = ref(false)

const planId = computed(() => (route.params.planId as string) || planStore.currentPlan?.id || '')

const filtered = computed(() => recipeStore.searchRecipes(search.value))

onMounted(async () => {
  if (planId.value) {
    if (!planStore.currentPlan) await planStore.fetchPlan(planId.value)
    await recipeStore.fetchRecipes(planId.value)
  }
})

function getImageUrl(path: string) {
  return recipeStore.getImageUrl(path)
}

function openRecipe(recipe: Recipe) {
  selectedRecipe.value = recipe
  editing.value = false
}

function closeDetail() {
  selectedRecipe.value = null
  editing.value = false
}

function onRecipeSaved(recipe: Recipe) {
  selectedRecipe.value = recipe
  editing.value = false
}

async function deleteRecipe(recipe: Recipe) {
  if (!confirm(`Delete "${recipe.title}"?`)) return
  await recipeStore.deleteRecipe(recipe.id)
  closeDetail()
}
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <AppHeader title="Recipes" :show-back="false">
      <template #actions>
        <BaseButton size="sm" @click="showCreateForm = true">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nytt recept
        </BaseButton>
      </template>
    </AppHeader>

    <div class="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))]">
      <!-- Search bar -->
      <div class="px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
        <BaseInput v-model="search" placeholder="Sök recept..." />
      </div>

      <!-- Loading -->
      <div v-if="recipeStore.loading" class="flex justify-center py-12">
        <BaseSpinner size="lg" />
      </div>

      <!-- Empty state -->
      <div v-else-if="!filtered.length" class="text-center py-16 px-4">
        <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <p class="text-gray-500 font-medium">{{ search ? 'Inga recept hittades' : 'Inga recept än' }}</p>
        <p class="text-gray-400 text-sm mt-1 mb-4">{{ search ? 'Prova en annan sökning' : 'Skapa ditt första recept' }}</p>
        <BaseButton v-if="!search" @click="showCreateForm = true">
          Skapa recept
        </BaseButton>
      </div>

      <!-- Recipe grid -->
      <div v-else class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="recipe in filtered"
          :key="recipe.id"
          class="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all"
          @click="openRecipe(recipe)"
        >
          <!-- Image preview -->
          <div
            v-if="recipe.kind === 'image' && recipe.image_path"
            class="w-full h-32 bg-gray-100 overflow-hidden"
          >
            <img
              :src="getImageUrl(recipe.image_path)"
              :alt="recipe.title"
              class="w-full h-full object-cover"
            />
          </div>

          <div class="p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 truncate">{{ recipe.title }}</h3>
                <div class="mt-1">
                  <RecipeChip :recipe="recipe" />
                </div>
              </div>
            </div>

            <!-- URL preview -->
            <a
              v-if="recipe.kind === 'url' && recipe.url"
              :href="recipe.url"
              target="_blank"
              rel="noopener"
              class="mt-2 text-xs text-blue-600 hover:underline truncate block"
              @click.stop
            >
              {{ recipe.url }}
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Create recipe modal -->
    <BaseModal v-if="showCreateForm" title="New Recipe" @close="showCreateForm = false">
      <RecipeForm
        :plan-id="planId"
        @saved="showCreateForm = false"
        @cancel="showCreateForm = false"
      />
    </BaseModal>

    <!-- Recipe detail / edit modal -->
    <BaseModal
      v-if="selectedRecipe"
      :title="editing ? 'Edit Recipe' : selectedRecipe.title"
      @close="closeDetail"
    >
      <!-- Edit mode: form pre-populated with existing data -->
      <RecipeForm
        v-if="editing"
        :plan-id="planId"
        :recipe="selectedRecipe"
        @saved="onRecipeSaved"
        @cancel="editing = false"
      />

      <!-- View mode: read-only detail -->
      <div v-else class="p-4 space-y-4">
        <RecipeChip :recipe="selectedRecipe" />

        <div v-if="selectedRecipe.kind === 'url' && selectedRecipe.url">
          <a
            :href="selectedRecipe.url"
            target="_blank"
            rel="noopener"
            class="text-blue-600 hover:underline break-all"
          >{{ selectedRecipe.url }}</a>
        </div>

        <div v-if="selectedRecipe.kind === 'image' && selectedRecipe.image_path">
          <img
            :src="getImageUrl(selectedRecipe.image_path)"
            :alt="selectedRecipe.title"
            class="w-full rounded-xl"
          />
        </div>

        <!-- Notes shown for any recipe that has content -->
        <div v-if="selectedRecipe.content">
          <RichTextEditor :model-value="selectedRecipe.content" :editable="false" />
        </div>
      </div>

      <!-- Footer buttons — only shown in view mode -->
      <template v-if="!editing" #footer>
        <div class="flex items-center gap-2">
          <BaseButton variant="danger" size="sm" @click="deleteRecipe(selectedRecipe!)">
            Delete
          </BaseButton>
          <div class="flex-1" />
          <BaseButton @click="editing = true">
            Edit
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <BottomNav />
  </div>
</template>
