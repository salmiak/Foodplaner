import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AddMealButton from './AddMealButton.vue'
import type { Meal } from '@/types/app.types'

// ---------------------------------------------------------------------------
// Store mocks
// ---------------------------------------------------------------------------
const mockCreateMeal = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    id: 'new-meal',
    week_id: 'week-1',
    plan_id: 'plan-1',
    day_of_week: null,
    title: 'Taco',
    comment: null,
    is_done: false,
    sort_order: 0,
    created_by: 'user-1',
    created_at: '',
    updated_at: '',
    recipes: [],
  } satisfies Meal),
)
const mockUpdateMeal = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockAddRecipeToMeal = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('@/stores/meal.store', () => ({
  useMealStore: () => ({
    createMeal: mockCreateMeal,
    updateMeal: mockUpdateMeal,
    addRecipeToMeal: mockAddRecipeToMeal,
  }),
}))

vi.mock('@/stores/week.store', () => ({
  useWeekStore: () => ({ weekId: 'week-1' }),
}))

// ---------------------------------------------------------------------------
// Component stubs
// ---------------------------------------------------------------------------
vi.mock('@/components/ui/BaseModal.vue', () => ({
  default: {
    props: ['title'],
    emits: ['close'],
    template: '<div data-testid="modal"><slot /><slot name="footer" /></div>',
  },
}))

vi.mock('@/components/editor/RichTextEditor.vue', () => ({
  default: {
    name: 'RichTextEditor',
    props: ['modelValue', 'placeholder'],
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const noteContent = '**Add salt**\nCook for 20 min'

function mountButton(dayOfWeek: number | null = null) {
  return mount(AddMealButton, { props: { planId: 'plan-1', dayOfWeek } })
}

async function openModal(wrapper: ReturnType<typeof mountButton>) {
  // Click the dashed "Lägg till måltid" trigger button
  await wrapper.find('button').trigger('click')
}

async function setTitle(wrapper: ReturnType<typeof mountButton>, value: string) {
  const input = wrapper.find('input')
  await input.setValue(value)
}

function findSaveBtn(wrapper: ReturnType<typeof mountButton>) {
  return wrapper.findAll('button').find((b) => b.text() === 'Spara måltid')
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('AddMealButton — comment (notes) on create', () => {
  it('opens modal on trigger click', async () => {
    const wrapper = mountButton()
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
    await openModal(wrapper)
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('calls createMeal with title and planId', async () => {
    const wrapper = mountButton()
    await openModal(wrapper)
    await setTitle(wrapper, 'Taco Tuesday')
    await findSaveBtn(wrapper)!.trigger('click')
    await flushPromises()

    expect(mockCreateMeal).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Taco Tuesday', planId: 'plan-1' }),
    )
  })

  it('saves notes via updateMeal after createMeal', async () => {
    const wrapper = mountButton()
    await openModal(wrapper)
    await setTitle(wrapper, 'Taco Tuesday')

    // Simulate user typing in the notes editor
    const editor = wrapper.findComponent({ name: 'RichTextEditor' })
    await editor.vm.$emit('update:modelValue', noteContent)

    await findSaveBtn(wrapper)!.trigger('click')
    await flushPromises()

    // createMeal should have run first
    expect(mockCreateMeal).toHaveBeenCalled()
    // updateMeal should have been called with the comment
    expect(mockUpdateMeal).toHaveBeenCalledWith(
      'new-meal',
      expect.objectContaining({ comment: noteContent }),
    )
  })

  it('skips updateMeal when no notes are entered', async () => {
    const wrapper = mountButton()
    await openModal(wrapper)
    await setTitle(wrapper, 'Plain Meal')
    // No notes typed — editor stays null

    await findSaveBtn(wrapper)!.trigger('click')
    await flushPromises()

    expect(mockCreateMeal).toHaveBeenCalled()
    expect(mockUpdateMeal).not.toHaveBeenCalled()
  })

  it('adds selected recipes before saving notes', async () => {
    const wrapper = mountButton()
    await openModal(wrapper)
    await setTitle(wrapper, 'Pasta')

    // Simulate recipe selected via RecipePicker emit
    const picker = wrapper.findComponent({ name: 'RecipePicker' })
    await picker.vm.$emit('add', 'recipe-abc')

    // Simulate notes typed
    const editor = wrapper.findComponent({ name: 'RichTextEditor' })
    await editor.vm.$emit('update:modelValue', noteContent)

    await findSaveBtn(wrapper)!.trigger('click')
    await flushPromises()

    // recipe added first, then note saved
    expect(mockAddRecipeToMeal).toHaveBeenCalledWith('new-meal', 'recipe-abc')
    expect(mockUpdateMeal).toHaveBeenCalledWith(
      'new-meal',
      expect.objectContaining({ comment: noteContent }),
    )
    // recipe add must come before note update
    const addCallOrder = mockAddRecipeToMeal.mock.invocationCallOrder[0]
    const updateCallOrder = mockUpdateMeal.mock.invocationCallOrder[0]
    expect(addCallOrder).toBeLessThan(updateCallOrder)
  })

  it('resets comment after modal is closed', async () => {
    const wrapper = mountButton()
    await openModal(wrapper)
    await setTitle(wrapper, 'Sushi')
    const editor = wrapper.findComponent({ name: 'RichTextEditor' })
    await editor.vm.$emit('update:modelValue', noteContent)

    // Submit (closes modal)
    await findSaveBtn(wrapper)!.trigger('click')
    await flushPromises()

    // Reopen modal — editor should start fresh
    await openModal(wrapper)
    const editorAfterReopen = wrapper.findComponent({ name: 'RichTextEditor' })
    expect(editorAfterReopen.props('modelValue')).toBeNull()
  })
})
