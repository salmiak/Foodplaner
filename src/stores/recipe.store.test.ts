import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRecipeStore } from './recipe.store'
import type { Recipe } from '@/types/app.types'

const mockFrom = vi.hoisted(() => vi.fn())
const mockStorage = vi.hoisted(() => ({
  from: vi.fn().mockReturnValue({
    upload: vi.fn().mockResolvedValue({ data: null, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.jpg' } }),
  }),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom, storage: mockStorage },
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

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'recipe-1',
    plan_id: 'plan-1',
    title: 'Tomato Soup',
    kind: 'text',
    url: null,
    image_path: null,
    content: null,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('searchRecipes', () => {
  it('returns all recipes for empty query', () => {
    const store = useRecipeStore()
    store.recipes = [makeRecipe({ title: 'Soup' }), makeRecipe({ id: 'r2', title: 'Pasta' })]
    expect(store.searchRecipes('')).toHaveLength(2)
  })

  it('returns all recipes for whitespace-only query', () => {
    const store = useRecipeStore()
    store.recipes = [makeRecipe(), makeRecipe({ id: 'r2' })]
    expect(store.searchRecipes('   ')).toHaveLength(2)
  })

  it('filters by title substring (case-insensitive)', () => {
    const store = useRecipeStore()
    store.recipes = [
      makeRecipe({ id: 'r1', title: 'Tomato Soup' }),
      makeRecipe({ id: 'r2', title: 'Pasta Bolognese' }),
      makeRecipe({ id: 'r3', title: 'tomato salad' }),
    ]
    const results = store.searchRecipes('TOMATO')
    expect(results).toHaveLength(2)
    expect(results.map((r) => r.id)).toEqual(expect.arrayContaining(['r1', 'r3']))
  })

  it('returns empty array when no match', () => {
    const store = useRecipeStore()
    store.recipes = [makeRecipe({ title: 'Soup' })]
    expect(store.searchRecipes('Pizza')).toHaveLength(0)
  })
})

describe('recipeById', () => {
  it('finds a recipe by id', () => {
    const store = useRecipeStore()
    store.recipes = [makeRecipe({ id: 'r1' }), makeRecipe({ id: 'r2' })]
    expect(store.recipeById('r1')?.id).toBe('r1')
  })

  it('returns undefined for unknown id', () => {
    const store = useRecipeStore()
    store.recipes = [makeRecipe({ id: 'r1' })]
    expect(store.recipeById('nope')).toBeUndefined()
  })
})

describe('applyRealtimeEvent', () => {
  it('INSERT prepends new recipe', () => {
    const store = useRecipeStore()
    store.recipes = [makeRecipe({ id: 'old' })]
    store.applyRealtimeEvent({
      eventType: 'INSERT',
      new: makeRecipe({ id: 'new' }),
      old: {},
      schema: 'public',
      table: 'recipes',
      commit_timestamp: '',
      errors: [],
    })
    expect(store.recipes[0].id).toBe('new')
    expect(store.recipes).toHaveLength(2)
  })

  it('INSERT ignores duplicate', () => {
    const store = useRecipeStore()
    store.recipes = [makeRecipe({ id: 'r1' })]
    store.applyRealtimeEvent({
      eventType: 'INSERT',
      new: makeRecipe({ id: 'r1' }),
      old: {},
      schema: 'public',
      table: 'recipes',
      commit_timestamp: '',
      errors: [],
    })
    expect(store.recipes).toHaveLength(1)
  })

  it('UPDATE merges fields', () => {
    const store = useRecipeStore()
    store.recipes = [makeRecipe({ id: 'r1', title: 'Old' })]
    store.applyRealtimeEvent({
      eventType: 'UPDATE',
      new: makeRecipe({ id: 'r1', title: 'New' }),
      old: {},
      schema: 'public',
      table: 'recipes',
      commit_timestamp: '',
      errors: [],
    })
    expect(store.recipes[0].title).toBe('New')
  })

  it('DELETE removes the recipe', () => {
    const store = useRecipeStore()
    store.recipes = [makeRecipe({ id: 'r1' }), makeRecipe({ id: 'r2' })]
    store.applyRealtimeEvent({
      eventType: 'DELETE',
      new: {},
      old: { id: 'r1' },
      schema: 'public',
      table: 'recipes',
      commit_timestamp: '',
      errors: [],
    })
    expect(store.recipes).toHaveLength(1)
    expect(store.recipes[0].id).toBe('r2')
  })
})

describe('updateRecipe', () => {
  it('applies optimistic update immediately', async () => {
    const store = useRecipeStore()
    store.recipes = [makeRecipe({ id: 'r1', title: 'Before' })]
    mockFrom.mockReturnValue(createChain({ data: null, error: null }))

    const promise = store.updateRecipe('r1', { title: 'After' })
    expect(store.recipes[0].title).toBe('After')
    await promise
  })

  it('rolls back on error', async () => {
    const store = useRecipeStore()
    store.recipes = [makeRecipe({ id: 'r1', title: 'Before' })]
    mockFrom.mockReturnValue(createChain({ data: null, error: { message: 'fail' } }))

    await expect(store.updateRecipe('r1', { title: 'After' })).rejects.toBeTruthy()
    expect(store.recipes[0].title).toBe('Before')
  })
})

describe('deleteRecipe', () => {
  it('removes recipe optimistically', async () => {
    const store = useRecipeStore()
    store.recipes = [makeRecipe({ id: 'r1' })]
    mockFrom.mockReturnValue(createChain({ data: null, error: null }))

    const promise = store.deleteRecipe('r1')
    expect(store.recipes).toHaveLength(0)
    await promise
  })

  it('restores recipe on error', async () => {
    const store = useRecipeStore()
    store.recipes = [makeRecipe({ id: 'r1' })]
    mockFrom.mockReturnValue(createChain({ data: null, error: { message: 'fail' } }))

    await expect(store.deleteRecipe('r1')).rejects.toBeTruthy()
    expect(store.recipes).toHaveLength(1)
  })
})

describe('clear', () => {
  it('empties the recipes array', () => {
    const store = useRecipeStore()
    store.recipes = [makeRecipe(), makeRecipe({ id: 'r2' })]
    store.clear()
    expect(store.recipes).toHaveLength(0)
  })
})
