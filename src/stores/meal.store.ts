import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth.store'
import type { Meal } from '@/types/app.types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export const useMealStore = defineStore('meal', () => {
  const meals = ref<Meal[]>([])
  const loading = ref(false)

  const mealsByDay = computed(() => {
    const grouped: Record<string, Meal[]> = {
      null: [],
      '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '7': [],
    }
    for (const meal of meals.value) {
      const key = meal.day_of_week == null ? 'null' : String(meal.day_of_week)
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(meal)
    }
    // Sort by sort_order within each day
    for (const key in grouped) {
      grouped[key].sort((a, b) => a.sort_order - b.sort_order)
    }
    return grouped
  })

  async function fetchMeals(weekId: string) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('meals')
        .select(`
          *,
          meal_recipes(
            id,
            sort_order,
            recipe_id,
            recipes(*)
          )
        `)
        .eq('week_id', weekId)
        .order('sort_order', { ascending: true })

      if (error) throw error

      meals.value = (data ?? []).map((m) => ({
        ...m,
        recipes: (m.meal_recipes ?? [])
          .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
          .map((mr: { recipes: unknown }) => mr.recipes),
      }))
    } finally {
      loading.value = false
    }
  }

  async function createMeal(payload: {
    weekId: string
    planId: string
    title: string
    dayOfWeek: number | null
  }): Promise<Meal> {
    const authStore = useAuthStore()
    const sortOrder = (mealsByDay.value[String(payload.dayOfWeek ?? 'null')] ?? []).length

    const { data, error } = await supabase
      .from('meals')
      .insert({
        week_id: payload.weekId,
        plan_id: payload.planId,
        title: payload.title,
        day_of_week: payload.dayOfWeek,
        sort_order: sortOrder,
        created_by: authStore.userId,
      })
      .select()
      .single()

    if (error) throw error

    const meal: Meal = { ...data, recipes: [] }
    meals.value.push(meal)
    return meal
  }

  async function updateMeal(id: string, patch: Partial<Meal>) {
    // Optimistic update
    const index = meals.value.findIndex((m) => m.id === id)
    const previous = index >= 0 ? { ...meals.value[index] } : null
    if (index >= 0) {
      meals.value[index] = { ...meals.value[index], ...patch }
    }

    const { error } = await supabase
      .from('meals')
      .update(patch)
      .eq('id', id)

    if (error) {
      // Roll back
      if (index >= 0 && previous) {
        meals.value[index] = previous
      }
      throw error
    }
  }

  async function deleteMeal(id: string) {
    const index = meals.value.findIndex((m) => m.id === id)
    const previous = index >= 0 ? meals.value[index] : null
    if (index >= 0) meals.value.splice(index, 1)

    const { error } = await supabase.from('meals').delete().eq('id', id)

    if (error) {
      if (previous && index >= 0) meals.value.splice(index, 0, previous)
      throw error
    }
  }

  async function toggleDone(id: string) {
    const meal = meals.value.find((m) => m.id === id)
    if (!meal) return
    await updateMeal(id, { is_done: !meal.is_done })
  }

  async function addRecipeToMeal(mealId: string, recipeId: string) {
    const meal = meals.value.find((m) => m.id === mealId)
    const sortOrder = meal?.recipes?.length ?? 0

    const { error } = await supabase
      .from('meal_recipes')
      .insert({ meal_id: mealId, recipe_id: recipeId, sort_order: sortOrder })

    if (error) throw error

    // Fetch the recipe and add it to meal
    const { data: recipe } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single()

    if (recipe && meal) {
      if (!meal.recipes) meal.recipes = []
      meal.recipes.push(recipe)
    }
  }

  async function removeRecipeFromMeal(mealId: string, recipeId: string) {
    const { error } = await supabase
      .from('meal_recipes')
      .delete()
      .eq('meal_id', mealId)
      .eq('recipe_id', recipeId)

    if (error) throw error

    const meal = meals.value.find((m) => m.id === mealId)
    if (meal?.recipes) {
      meal.recipes = meal.recipes.filter((r) => r.id !== recipeId)
    }
  }

  async function transferMeal(mealId: string, direction: 'prev' | 'next') {
    const meal = meals.value.find((m) => m.id === mealId)
    if (!meal) throw new Error('Meal not found')

    // Get current week
    const { data: week, error: weekError } = await supabase
      .from('weeks')
      .select('*')
      .eq('id', meal.week_id)
      .single()
    if (weekError || !week) throw new Error('Week not found')

    // Calculate target year/week
    const { year: targetYear, weekNumber: targetWeekNumber } =
      adjacentWeek(week.year, week.week_number, direction)

    // Find or create target week
    let targetWeekId: string
    const { data: existing } = await supabase
      .from('weeks')
      .select('id')
      .eq('plan_id', meal.plan_id)
      .eq('year', targetYear)
      .eq('week_number', targetWeekNumber)
      .maybeSingle()

    if (existing) {
      targetWeekId = existing.id
    } else {
      const { data: created, error: createError } = await supabase
        .from('weeks')
        .insert({ plan_id: meal.plan_id, year: targetYear, week_number: targetWeekNumber })
        .select('id')
        .single()
      if (createError || !created) throw new Error('Failed to create target week')
      targetWeekId = created.id
    }

    // Move the meal
    const { error: updateError } = await supabase
      .from('meals')
      .update({ week_id: targetWeekId })
      .eq('id', mealId)
    if (updateError) throw new Error('Failed to transfer meal')

    // Remove from current week view
    const index = meals.value.findIndex((m) => m.id === mealId)
    if (index >= 0) meals.value.splice(index, 1)
  }

  function applyRealtimeEvent(payload: RealtimePostgresChangesPayload<Meal>) {
    if (payload.eventType === 'INSERT') {
      const exists = meals.value.some((m) => m.id === (payload.new as Meal).id)
      if (!exists) {
        meals.value.push({ ...(payload.new as Meal), recipes: [] })
      }
    } else if (payload.eventType === 'UPDATE') {
      const index = meals.value.findIndex((m) => m.id === (payload.new as Meal).id)
      if (index >= 0) {
        // Realtime payloads don't include joined data (recipes), so preserve the local copy
        const { recipes, ...dbFields } = payload.new as Meal
        void recipes
        meals.value[index] = {
          ...meals.value[index],
          ...dbFields,
        }
      }
    } else if (payload.eventType === 'DELETE') {
      const index = meals.value.findIndex((m) => m.id === (payload.old as Meal).id)
      if (index >= 0) meals.value.splice(index, 1)
    }
  }

  function clear() {
    meals.value = []
  }

  return {
    meals,
    loading,
    mealsByDay,
    fetchMeals,
    createMeal,
    updateMeal,
    deleteMeal,
    toggleDone,
    addRecipeToMeal,
    removeRecipeFromMeal,
    transferMeal,
    applyRealtimeEvent,
    clear,
  }
})

// ─── ISO week helpers ──────────────────────────────────────────────────────────

function isoWeeksInYear(year: number): number {
  const jan1 = new Date(year, 0, 1).getDay()
  const dec31 = new Date(year, 11, 31).getDay()
  return jan1 === 4 || dec31 === 4 ? 53 : 52
}

function adjacentWeek(year: number, weekNumber: number, direction: 'prev' | 'next') {
  const delta = direction === 'next' ? 1 : -1
  let w = weekNumber + delta
  let y = year
  if (w < 1) { y -= 1; w = isoWeeksInYear(y) }
  else if (w > isoWeeksInYear(y)) { y += 1; w = 1 }
  return { year: y, weekNumber: w }
}
