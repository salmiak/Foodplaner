import { ref } from 'vue'
import { useRecipeStore } from '@/stores/recipe.store'

export function useImageUpload(planId: string) {
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const recipeStore = useRecipeStore()

  async function uploadImage(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Image must be smaller than 10MB')
    }

    uploading.value = true
    error.value = null

    try {
      const path = await recipeStore.uploadImage(file, planId)
      return path
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Upload failed'
      throw err
    } finally {
      uploading.value = false
    }
  }

  function getImageUrl(path: string): string {
    return recipeStore.getImageUrl(path)
  }

  return { uploading, error, uploadImage, getImageUrl }
}
