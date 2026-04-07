import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMealStore } from './meal.store'
import type { Meal } from '@/types/app.types'

// vi.hoisted ensures these are available when vi.mock factories run
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  },
}))

vi.mock('./auth.store', () => ({
  useAuthStore: () => ({ userId: 'user-1' }),
}))

function createChain(result = { data: null as unknown, error: null as unknown }) {
  const chain: Record<string, unknown> = {}
  const proxy: unknown = new Proxy(chain, {
    get(_t, prop: string) {
      if (prop === 'then') return (res: (v: unknown) => unknown) => Promise.resolve(result).then(res)
      if (prop === 'catch') return (rej: (v: unknown) => unknown) => Promise.resolve(result).catch(rej)
      if (prop === 'finally') return (fn: () => void) => Promise.resolve(result).finally(fn)
      return vi.fn().mockReturnValue(proxy)
    },
  })
  return proxy
}

function makeMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: 'meal-1',
    week_id: 'week-1',
    plan_id: 'plan-1',
    day_of_week: 1,
    title: 'Pasta',
    comment: null,
    is_done: false,
    sort_order: 0,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    recipes: [],
    ...overrides,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('mealsByDay', () => {
  it('groups meals by day_of_week', () => {
    const store = useMealStore()
    store.meals = [
      makeMeal({ id: 'a', day_of_week: 1, sort_order: 0 }),
      makeMeal({ id: 'b', day_of_week: 3, sort_order: 0 }),
      makeMeal({ id: 'c', day_of_week: 1, sort_order: 1 }),
    ]
    expect(store.mealsByDay['1']).toHaveLength(2)
    expect(store.mealsByDay['3']).toHaveLength(1)
    expect(store.mealsByDay['2']).toHaveLength(0)
  })

  it('places meals with null day_of_week into "null" key', () => {
    const store = useMealStore()
    store.meals = [makeMeal({ id: 'x', day_of_week: null })]
    expect(store.mealsByDay['null']).toHaveLength(1)
  })

  it('sorts meals within a day by sort_order', () => {
    const store = useMealStore()
    store.meals = [
      makeMeal({ id: 'b', day_of_week: 2, sort_order: 2 }),
      makeMeal({ id: 'a', day_of_week: 2, sort_order: 0 }),
      makeMeal({ id: 'c', day_of_week: 2, sort_order: 1 }),
    ]
    const ids = store.mealsByDay['2'].map((m) => m.id)
    expect(ids).toEqual(['a', 'c', 'b'])
  })
})

describe('applyRealtimeEvent', () => {
  it('INSERT adds a new meal', () => {
    const store = useMealStore()
    store.meals = []
    store.applyRealtimeEvent({
      eventType: 'INSERT',
      new: makeMeal({ id: 'new-1' }),
      old: {},
      schema: 'public',
      table: 'meals',
      commit_timestamp: '',
      errors: [],
    })
    expect(store.meals).toHaveLength(1)
    expect(store.meals[0].id).toBe('new-1')
  })

  it('INSERT ignores duplicates', () => {
    const store = useMealStore()
    store.meals = [makeMeal({ id: 'existing' })]
    store.applyRealtimeEvent({
      eventType: 'INSERT',
      new: makeMeal({ id: 'existing' }),
      old: {},
      schema: 'public',
      table: 'meals',
      commit_timestamp: '',
      errors: [],
    })
    expect(store.meals).toHaveLength(1)
  })

  it('UPDATE merges fields', () => {
    const store = useMealStore()
    store.meals = [makeMeal({ id: 'meal-1', title: 'Old title' })]
    store.applyRealtimeEvent({
      eventType: 'UPDATE',
      new: makeMeal({ id: 'meal-1', title: 'New title' }),
      old: {},
      schema: 'public',
      table: 'meals',
      commit_timestamp: '',
      errors: [],
    })
    expect(store.meals[0].title).toBe('New title')
  })

  it('UPDATE preserves recipes array', () => {
    const recipe = {
      id: 'r1', plan_id: 'p1', title: 'Sauce', kind: 'text' as const,
      url: null, image_path: null, content: null, created_by: null, created_at: '', updated_at: '',
    }
    const store = useMealStore()
    store.meals = [makeMeal({ id: 'meal-1', recipes: [recipe] })]
    store.applyRealtimeEvent({
      eventType: 'UPDATE',
      new: makeMeal({ id: 'meal-1', title: 'Updated' }),
      old: {},
      schema: 'public',
      table: 'meals',
      commit_timestamp: '',
      errors: [],
    })
    expect(store.meals[0].recipes).toHaveLength(1)
  })

  it('DELETE removes the meal', () => {
    const store = useMealStore()
    store.meals = [makeMeal({ id: 'meal-1' }), makeMeal({ id: 'meal-2' })]
    store.applyRealtimeEvent({
      eventType: 'DELETE',
      new: {},
      old: { id: 'meal-1' },
      schema: 'public',
      table: 'meals',
      commit_timestamp: '',
      errors: [],
    })
    expect(store.meals).toHaveLength(1)
    expect(store.meals[0].id).toBe('meal-2')
  })
})

describe('updateMeal', () => {
  it('applies optimistic update immediately', async () => {
    const store = useMealStore()
    store.meals = [makeMeal({ id: 'meal-1', title: 'Before' })]
    mockFrom.mockReturnValue(createChain({ data: null, error: null }))

    const promise = store.updateMeal('meal-1', { title: 'After' })
    expect(store.meals[0].title).toBe('After')
    await promise
  })

  it('rolls back on error', async () => {
    const store = useMealStore()
    store.meals = [makeMeal({ id: 'meal-1', title: 'Before' })]
    mockFrom.mockReturnValue(createChain({ data: null, error: { message: 'DB error' } }))

    await expect(store.updateMeal('meal-1', { title: 'After' })).rejects.toBeTruthy()
    expect(store.meals[0].title).toBe('Before')
  })
})

describe('deleteMeal', () => {
  it('removes meal optimistically', async () => {
    const store = useMealStore()
    store.meals = [makeMeal({ id: 'meal-1' })]
    mockFrom.mockReturnValue(createChain({ data: null, error: null }))

    const promise = store.deleteMeal('meal-1')
    expect(store.meals).toHaveLength(0)
    await promise
  })

  it('restores meal on error', async () => {
    const store = useMealStore()
    store.meals = [makeMeal({ id: 'meal-1' })]
    mockFrom.mockReturnValue(createChain({ data: null, error: { message: 'fail' } }))

    await expect(store.deleteMeal('meal-1')).rejects.toBeTruthy()
    expect(store.meals).toHaveLength(1)
  })
})

describe('toggleDone', () => {
  it('flips is_done from false to true', async () => {
    const store = useMealStore()
    store.meals = [makeMeal({ id: 'meal-1', is_done: false })]
    mockFrom.mockReturnValue(createChain({ data: null, error: null }))
    await store.toggleDone('meal-1')
    expect(store.meals[0].is_done).toBe(true)
  })

  it('flips is_done from true to false', async () => {
    const store = useMealStore()
    store.meals = [makeMeal({ id: 'meal-1', is_done: true })]
    mockFrom.mockReturnValue(createChain({ data: null, error: null }))
    await store.toggleDone('meal-1')
    expect(store.meals[0].is_done).toBe(false)
  })

  it('does nothing for unknown id', async () => {
    const store = useMealStore()
    store.meals = [makeMeal({ id: 'meal-1', is_done: false })]
    await store.toggleDone('nonexistent')
    expect(store.meals[0].is_done).toBe(false)
  })
})

describe('clear', () => {
  it('empties the meals array', () => {
    const store = useMealStore()
    store.meals = [makeMeal(), makeMeal({ id: 'meal-2' })]
    store.clear()
    expect(store.meals).toHaveLength(0)
  })
})
