import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import MealDetailModal from './MealDetailModal.vue'
import type { Meal } from '@/types/app.types'

// ---------------------------------------------------------------------------
// Store mocks (hoisted so vi.mock factories can reference them)
// ---------------------------------------------------------------------------
const mockUpdateMeal = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockDeleteMeal = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockToggleDone = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockAddRecipeToMeal = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockRemoveRecipeFromMeal = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('@/stores/meal.store', () => ({
  useMealStore: () => ({
    updateMeal: mockUpdateMeal,
    deleteMeal: mockDeleteMeal,
    toggleDone: mockToggleDone,
    addRecipeToMeal: mockAddRecipeToMeal,
    removeRecipeFromMeal: mockRemoveRecipeFromMeal,
  }),
}))

// ---------------------------------------------------------------------------
// Component stubs — keep heavy deps out of tests
// ---------------------------------------------------------------------------
vi.mock('@/components/ui/BaseModal.vue', () => ({
  default: {
    props: ['title'],
    emits: ['close'],
    // Render both default and footer slots so buttons are accessible
    template: '<div data-testid="modal"><slot /><slot name="footer" /></div>',
  },
}))

vi.mock('@/components/recipe/RecipePicker.vue', () => ({
  default: {
    name: 'RecipePicker',
    props: ['planId', 'selectedIds'],
    emits: ['add', 'remove'],
    template: '<div data-testid="recipe-picker" />',
  },
}))

vi.mock('@/components/meal/MealDoneToggle.vue', () => ({
  default: {
    name: 'MealDoneToggle',
    props: ['isDone'],
    emits: ['toggle'],
    template: '<div />',
  },
}))

vi.mock('@/components/meal/MealTransferMenu.vue', () => ({
  default: {
    name: 'MealTransferMenu',
    props: ['mealId'],
    emits: ['transferred'],
    template: '<div />',
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: 'meal-1',
    week_id: 'week-1',
    plan_id: 'plan-1',
    day_of_week: 1,
    title: 'Pasta',
    is_done: false,
    sort_order: 0,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    recipes: [],
    ...overrides,
  }
}

function makeRecipe(id = 'r1') {
  return {
    id,
    plan_id: 'plan-1',
    title: 'Sauce',
    kind: 'text' as const,
    url: null,
    image_path: null,
    created_by: null,
    created_at: '',
    updated_at: '',
  }
}

function mountModal(meal: Meal = makeMeal()) {
  return mount(MealDetailModal, { props: { meal, planId: 'plan-1' } })
}

// Find the Save button (last button in footer area that says "Save")
function findSaveBtn(wrapper: ReturnType<typeof mountModal>) {
  return wrapper.findAll('button').find((b) => b.text() === 'Save')
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('MealDetailModal — save', () => {
  it('calls updateMeal with title on save', async () => {
    const wrapper = mountModal()
    const input = wrapper.find('input')
    await input.setValue('New title')

    await findSaveBtn(wrapper)!.trigger('click')
    await flushPromises()

    expect(mockUpdateMeal).toHaveBeenCalledWith(
      'meal-1',
      expect.objectContaining({ title: 'New title' }),
    )
  })

  it('syncs title from prop change (realtime)', async () => {
    const meal = makeMeal({ title: 'Original' })
    const wrapper = mountModal(meal)

    await wrapper.setProps({ meal: { ...meal, title: 'Renamed by peer' } })

    expect(wrapper.find('input').element.value).toBe('Renamed by peer')
  })

  it('does not reset title when recipes change', async () => {
    const meal = makeMeal()
    const wrapper = mountModal(meal)
    const input = wrapper.find('input')
    await input.setValue('My edited title')

    await wrapper.setProps({ meal: { ...meal, recipes: [makeRecipe()] } })

    expect(input.element.value).toBe('My edited title')
  })
})
