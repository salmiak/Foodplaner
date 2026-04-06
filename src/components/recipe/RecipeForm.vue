<script setup lang="ts">
import { ref } from 'vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import RichTextEditor from '@/components/editor/RichTextEditor.vue'
import { useRecipeStore } from '@/stores/recipe.store'
import { useImageUpload } from '@/composables/useImageUpload'
import type { Recipe } from '@/types/app.types'
import type { JSONContent } from '@tiptap/vue-3'

const props = defineProps<{ planId: string }>()
const emit = defineEmits<{ created: [recipe: Recipe]; cancel: [] }>()

const recipeStore = useRecipeStore()
const { uploading, uploadImage, getImageUrl } = useImageUpload(props.planId)

const kind = ref<'url' | 'image' | 'text'>('url')
const title = ref('')
const url = ref('')
const content = ref<JSONContent | null>(null)
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
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
      content: kind.value === 'text' ? content.value : null,
    })

    emit('created', recipe)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save recipe'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-4 space-y-4">
    <h3 class="font-semibold text-gray-900">New Recipe</h3>

    <BaseInput v-model="title" label="Recipe name" placeholder="e.g. Spaghetti Bolognese" />

    <!-- Type selector -->
    <div>
      <p class="text-sm font-medium text-gray-700 mb-2">Type</p>
      <div class="flex gap-2">
        <button
          v-for="k in (['url', 'image', 'text'] as const)"
          :key="k"
          type="button"
          class="flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-colors"
          :class="kind === k
            ? 'border-primary-500 bg-primary-50 text-primary-700'
            : 'border-gray-200 text-gray-600 hover:border-gray-300'"
          @click="kind = k"
        >
          {{ k === 'url' ? 'Link' : k === 'image' ? 'Photo' : 'Text' }}
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
          <span class="text-sm">Tap to upload photo</span>
        </div>
        <input type="file" accept="image/*" class="hidden" @change="onImageSelect" />
      </label>
    </div>

    <!-- Text field -->
    <div v-if="kind === 'text'" class="space-y-1">
      <p class="text-sm font-medium text-gray-700">Recipe text</p>
      <RichTextEditor v-model="content" placeholder="Write your recipe here..." />
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <div class="flex gap-2 pt-2">
      <BaseButton variant="secondary" class="flex-1" @click="emit('cancel')">Cancel</BaseButton>
      <BaseButton
        class="flex-1"
        :loading="saving || uploading"
        @click="submit"
      >Save Recipe</BaseButton>
    </div>
  </div>
</template>
