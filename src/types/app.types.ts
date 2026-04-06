import type { JSONContent } from '@tiptap/vue-3'

export interface Plan {
  id: string
  name: string
  created_at: string
}

export interface PlanMember {
  id: string
  plan_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  // joined from auth.users via RPC or view
  email?: string
  display_name?: string
}

export interface Week {
  id: string
  plan_id: string
  year: number
  week_number: number
  created_at: string
}

export interface Meal {
  id: string
  week_id: string
  plan_id: string
  day_of_week: number | null  // 1=Mon … 7=Sun, null=unassigned
  title: string
  comment: JSONContent | null
  is_done: boolean
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  recipes?: Recipe[]
}

export interface Recipe {
  id: string
  plan_id: string
  title: string
  kind: 'url' | 'image' | 'text'
  url: string | null
  image_path: string | null
  content: JSONContent | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface MealRecipe {
  id: string
  meal_id: string
  recipe_id: string
  sort_order: number
}

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const DAY_NAMES: Record<DayOfWeek, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
}

export const DAY_NAMES_SHORT: Record<DayOfWeek, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
}

export interface PresenceUser {
  user_id: string
  display_name: string
  email: string
  color: string
}

// AI suggestion types
export interface MealSuggestion {
  day_of_week: number
  title: string
  recipes: Array<
    | { existing_recipe_id: string }
    | { new_recipe: Partial<Recipe> }
  >
  comment: string | null
}

export interface SuggestMealsResponse {
  suggestions: MealSuggestion[]
  meta: {
    model: string
    generated_at: string
    note?: string
  }
}
