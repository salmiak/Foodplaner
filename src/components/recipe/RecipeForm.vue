<script setup lang="ts">
import { ref } from 'vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useRecipeStore } from '@/stores/recipe.store'
import { useImageUpload } from '@/composables/useImageUpload'
import type { Recipe } from '@/types/app.types'

const props = defineProps<{
  planId: string
  recipe?: Recipe   // if provided → edit mode
}>()
const emit = defineEmits<{ saved: [recipe: Recipe]; cancel: [] }>()

const recipeStore = useRecipeStore()
const { uploading, uploadImage, getImageUrl } = useImageUpload(props.planId)

// 'text' means no attachment — it's the default
const kind = ref<'url' | 'image' | 'text'>(props.recipe?.kind ?? 'text')
const title = ref(props.recipe?.title ?? '')
const url = ref(props.recipe?.url ?? '')
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(
  props.recipe?.image_path ? getImageUrl(props.recipe.image_path) : null,
)
const saving = ref(false)
const error = ref<string | null>(null)

function onImageSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

async function submit() {
  if (!title.value.trim()) {
    error.value = 'Title is required'
    return
  }

  saving.value = true
  error.value = null

  try {
    if (props.recipe) {
      // ── Edit mode ──────────────────────────────────────────────────────────
      let imagePath = props.recipe.image_path
      if (kind.value === 'image' && imageFile.value) {
        imagePath = await uploadImage(imageFile.value)
      }

      const patch: Partial<Recipe> = {
        title: title.value.trim(),
        kind: kind.value,
        url: kind.value === 'url' ? url.value : null,
        image_path: kind.value === 'image' ? imagePath : null,
      }
      await recipeStore.updateRecipe(props.recipe.id, patch)
      emit('saved', { ...props.recipe, ...patch })
    } else {
      // ── Create mode ────────────────────────────────────────────────────────
      let imagePath: string | null = null
      if (kind.value === 'image' && imageFile.value) {
        imagePath = await uploadImage(imageFile.value)
      }

      const recipe = await recipeStore.createRecipe({
        planId: props.planId,
        title: title.value.trim(),
        kind: kind.value,
        url: kind.value === 'url' ? url.value : null,
        imagePath,
      })
      emit('saved', recipe)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save recipe'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-4 space-y-4">
    <h3 class="font-semibold text-gray-900">{{ recipe ? 'Edit Recipe' : 'New Recipe' }}</h3>

    <BaseInput v-model="title" label="Recipe name" placeholder="e.g. Spaghetti Bolognese" />

    <!-- Attachment selector -->
    <div>
      <p class="text-sm font-medium text-gray-700 mb-2">Attachment</p>
      <div class="flex gap-2">
        <button
          v-for="[k, label] in ([['text', 'None'], ['url', 'Link'], ['image', 'Photo']] as const)"
          :key="k"
          type="button"
          class="flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-colors"
          :class="kind === k
            ? 'border-primary-500 bg-primary-50 text-primary-700'
            : 'border-gray-200 text-gray-600 hover:border-gray-300'"
          @click="kind = k"
        >
          {{ label }}
        </button>
      </div>
    </div>

    <!-- URL field -->
    <BaseInput
      v-if="kind === 'url'"
      v-model="url"
      label="URL"
      type="url"
      placeholder="https://..."
    />

    <!-- Image field -->
    <div v-if="kind === 'image'" class="space-y-2">
      <p class="text-sm font-medium text-gray-700">Photo</p>
      <label
        class="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 transition-colors overflow-hidden"
      >
        <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
        <div v-else class="flex flex-col items-center gap-1 text-gray-400">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="text-sm">{{ imagePreview ? 'Tap to replace photo' : 'Tap to upload photo' }}</span>
        </div>
        <input type="file" accept="image/*" class="hidden" @change="onImageSelect" />
      </label>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <div class="flex gap-2 pt-2">
      <BaseButton variant="secondary" class="flex-1" @click="emit('cancel')">Cancel</BaseButton>
      <BaseButton
        class="flex-1"
        :loading="saving || uploading"
        @click="submit"
      >{{ recipe ? 'Save Changes' : 'Save Recipe' }}</BaseButton>
    </div>
  </div>
</template>
