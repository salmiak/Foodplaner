import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth.store'
import type { Recipe } from '@/types/app.types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export const useRecipeStore = defineStore('recipe', () => {
  const recipes = ref<Recipe[]>([])
  const loading = ref(false)

  const recipeById = computed(() => (id: string) =>
    recipes.value.find((r) => r.id === id),
  )

  function searchRecipes(query: string): Recipe[] {
    if (!query.trim()) return recipes.value
    const q = query.toLowerCase()
    return recipes.value.filter((r) => r.title.toLowerCase().includes(q))
  }

  async function fetchRecipes(planId: string) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false })

      if (error) throw error
      recipes.value = data ?? []
    } finally {
      loading.value = false
    }
  }

  async function createRecipe(payload: {
    planId: string
    title: string
    kind: 'url' | 'image' | 'text'
    url?: string | null
    imagePath?: string | null
    content?: object | null
  }): Promise<Recipe> {
    const authStore = useAuthStore()

    const { data, error } = await supabase
      .from('recipes')
      .insert({
        plan_id: payload.planId,
        title: payload.title,
        kind: payload.kind,
        url: payload.url ?? null,
        image_path: payload.imagePath ?? null,
        content: payload.content ?? null,
        created_by: authStore.userId,
      })
      .select()
      .single()

    if (error) throw error
    recipes.value.unshift(data)
    return data
  }

  async function updateRecipe(id: string, patch: Partial<Recipe>) {
    const index = recipes.value.findIndex((r) => r.id === id)
    const previous = index >= 0 ? { ...recipes.value[index] } : null
    if (index >= 0) {
      recipes.value[index] = { ...recipes.value[index], ...patch }
    }

    const { error } = await supabase
      .from('recipes')
      .update(patch)
      .eq('id', id)

    if (error) {
      if (index >= 0 && previous) recipes.value[index] = previous
      throw error
    }
  }

  async function deleteRecipe(id: string) {
    const index = recipes.value.findIndex((r) => r.id === id)
    const previous = index >= 0 ? recipes.value[index] : null
    if (index >= 0) recipes.value.splice(index, 1)

    const { error } = await supabase.from('recipes').delete().eq('id', id)

    if (error) {
      if (previous) recipes.value.splice(index, 0, previous)
      throw error
    }
  }

  async function uploadImage(file: File, planId: string): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${planId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('recipe-images')
      .upload(path, file, { upsert: false })

    if (error) throw error
    return path
  }

  function getImageUrl(path: string): string {
    const { data } = supabase.storage.from('recipe-images').getPublicUrl(path)
    return data.publicUrl
  }

  function applyRealtimeEvent(payload: RealtimePostgresChangesPayload<Recipe>) {
    if (payload.eventType === 'INSERT') {
      const exists = recipes.value.some((r) => r.id === (payload.new as Recipe).id)
      if (!exists) recipes.value.unshift(payload.new as Recipe)
    } else if (payload.eventType === 'UPDATE') {
      const index = recipes.value.findIndex((r) => r.id === (payload.new as Recipe).id)
      if (index >= 0) recipes.value[index] = { ...recipes.value[index], ...(payload.new as Recipe) }
    } else if (payload.eventType === 'DELETE') {
      const index = recipes.value.findIndex((r) => r.id === (payload.old as Recipe).id)
      if (index >= 0) recipes.value.splice(index, 1)
    }
  }

  function clear() {
    recipes.value = []
  }

  return {
    recipes,
    loading,
    recipeById,
    searchRecipes,
    fetchRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    uploadImage,
    getImageUrl,
    applyRealtimeEvent,
    clear,
  }
})
