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

vi.mock('@/components/editor/RichTextEditor.vue', () => ({
  default: {
    name: 'RichTextEditor',
    props: ['modelValue', 'placeholder', 'editable'],
    emits: ['update:modelValue'],
    template: '<div data-testid="editor" />',
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

const noteContent = '**My notes**\n- item 1\n- item 2'

function makeRecipe(id = 'r1') {
  return {
    id,
    plan_id: 'plan-1',
    title: 'Sauce',
    kind: 'text' as const,
    url: null,
    image_path: null,
    content: null,
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
describe('MealDetailModal — comment (notes)', () => {
  it('passes existing meal comment to the editor on open', () => {
    const wrapper = mountModal(makeMeal({ comment: noteContent }))
    const editor = wrapper.findComponent({ name: 'RichTextEditor' })
    expect(editor.props('modelValue')).toEqual(noteContent)
  })

  it('reflects typed content in editor modelValue', async () => {
    const wrapper = mountModal()
    const editor = wrapper.findComponent({ name: 'RichTextEditor' })

    await editor.vm.$emit('update:modelValue', noteContent)

    expect(editor.props('modelValue')).toEqual(noteContent)
  })

  it('does NOT reset comment when meal.recipes changes (recipe added)', async () => {
    const meal = makeMeal()
    const wrapper = mountModal(meal)
    const editor = wrapper.findComponent({ name: 'RichTextEditor' })

    // Simulate user typing notes
    await editor.vm.$emit('update:modelValue', noteContent)

    // Simulate recipe being added: the meal object in the store gets its
    // recipes array mutated, causing the prop reference to change.
    await wrapper.setProps({ meal: { ...meal, recipes: [makeRecipe()] } })

    // Comment must NOT have been reset to null
    expect(editor.props('modelValue')).toEqual(noteContent)
  })

  it('syncs title from prop change (realtime) but leaves comment intact', async () => {
    const meal = makeMeal({ title: 'Original' })
    const wrapper = mountModal(meal)
    const editor = wrapper.findComponent({ name: 'RichTextEditor' })

    // User types notes
    await editor.vm.$emit('update:modelValue', noteContent)

    // Another user renames the meal via realtime
    await wrapper.setProps({ meal: { ...meal, title: 'Renamed by peer' } })

    // Comment still intact
    expect(editor.props('modelValue')).toEqual(noteContent)

    // Title input should show the updated title
    expect(wrapper.find('input').element.value).toBe('Renamed by peer')
  })

  it('includes comment in save payload', async () => {
    const wrapper = mountModal()
    const editor = wrapper.findComponent({ name: 'RichTextEditor' })
    await editor.vm.$emit('update:modelValue', noteContent)

    await findSaveBtn(wrapper)!.trigger('click')
    await flushPromises()

    expect(mockUpdateMeal).toHaveBeenCalledWith(
      'meal-1',
      expect.objectContaining({ comment: noteContent }),
    )
  })

  it('saves null comment when editor content is cleared', async () => {
    const wrapper = mountModal(makeMeal({ comment: noteContent }))
    const editor = wrapper.findComponent({ name: 'RichTextEditor' })

    // Editor emits null when user clears content
    await editor.vm.$emit('update:modelValue', null)

    await findSaveBtn(wrapper)!.trigger('click')
    await flushPromises()

    expect(mockUpdateMeal).toHaveBeenCalledWith(
      'meal-1',
      expect.objectContaining({ comment: null }),
    )
  })

  it('preserves pre-existing comment across multiple recipe adds', async () => {
    const meal = makeMeal({ comment: noteContent })
    const wrapper = mountModal(meal)

    // Add two recipes in sequence (prop changes twice)
    await wrapper.setProps({ meal: { ...meal, recipes: [makeRecipe('r1')] } })
    await wrapper.setProps({ meal: { ...meal, recipes: [makeRecipe('r1'), makeRecipe('r2')] } })

    await findSaveBtn(wrapper)!.trigger('click')
    await flushPromises()

    expect(mockUpdateMeal).toHaveBeenCalledWith(
      'meal-1',
      expect.objectContaining({ comment: noteContent }),
    )
  })
})
