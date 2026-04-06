import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { SuggestMealsResponse } from '@/types/app.types'

export function useAiSuggest() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function suggestMeals(params: {
    planId: string
    year: number
    weekNumber: number
    preferences?: {
      dietary?: string[]
      maxCookTimeMinutes?: number
      servings?: number
    }
  }): Promise<SuggestMealsResponse> {
    loading.value = true
    error.value = null

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-meals`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            plan_id: params.planId,
            year: params.year,
            week_number: params.weekNumber,
            preferences: {
              dietary: params.preferences?.dietary,
              max_cook_time_minutes: params.preferences?.maxCookTimeMinutes,
              servings: params.preferences?.servings,
            },
            context: {
              use_existing_recipes: true,
              avoid_repeat_days: 3,
            },
          }),
        },
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'AI suggestion failed')
      }

      return await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { loading, error, suggestMeals }
}
