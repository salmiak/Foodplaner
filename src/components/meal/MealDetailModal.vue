<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import RecipePicker from '@/components/recipe/RecipePicker.vue'
import MealDoneToggle from './MealDoneToggle.vue'
import MealTransferMenu from './MealTransferMenu.vue'
import { useMealStore } from '@/stores/meal.store'
import type { Meal } from '@/types/app.types'

const props = defineProps<{ meal: Meal; planId: string }>()
const emit = defineEmits<{ close: [] }>()

const mealStore = useMealStore()

const title = ref(props.meal.title)
const saving = ref(false)
const deleting = ref(false)
const showTransfer = ref(false)

const selectedRecipeIds = computed(() =>
  props.meal.recipes?.map((r) => r.id) ?? [],
)

watch(() => props.meal.title, (newTitle) => {
  title.value = newTitle
})

async function save() {
  saving.value = true
  try {
    await mealStore.updateMeal(props.meal.id, {
      title: title.value.trim() || props.meal.title,
    })
    emit('close')
  } finally {
    saving.value = false
  }
}

async function deleteMeal() {
  if (!confirm('Delete this meal?')) return
  deleting.value = true
  try {
    await mealStore.deleteMeal(props.meal.id)
    emit('close')
  } finally {
    deleting.value = false
  }
}

async function addRecipe(recipeId: string) {
  await mealStore.addRecipeToMeal(props.meal.id, recipeId)
}

async function removeRecipe(recipeId: string) {
  await mealStore.removeRecipeFromMeal(props.meal.id, recipeId)
}
</script>

<template>
  <BaseModal :title="meal.title" @close="emit('close')">
    <div class="p-4 space-y-5">
      <!-- Done toggle + title -->
      <div class="flex items-start gap-3">
        <MealDoneToggle
          :is-done="meal.is_done"
          @toggle="mealStore.toggleDone(meal.id)"
        />
        <div class="flex-1">
          <BaseInput v-model="title" placeholder="Meal name" />
        </div>
      </div>

      <!-- Recipes section -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-2">Recipes</h3>
        <RecipePicker
          :plan-id="planId"
          :selected-ids="selectedRecipeIds"
          @add="addRecipe"
          @remove="removeRecipe"
        />
      </div>

      <!-- Transfer section -->
      <div>
        <button
          type="button"
          class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          @click="showTransfer = !showTransfer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Move to another week
        </button>
        <div v-if="showTransfer" class="mt-2">
          <MealTransferMenu :meal-id="meal.id" @transferred="emit('close')" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center gap-2">
        <BaseButton variant="danger" size="sm" :loading="deleting" @click="deleteMeal">
          Delete
        </BaseButton>
        <div class="flex-1" />
        <BaseButton variant="secondary" @click="emit('close')">Cancel</BaseButton>
        <BaseButton :loading="saving" @click="save">Save</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
