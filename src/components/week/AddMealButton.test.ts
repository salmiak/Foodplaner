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
function mountButton(dayOfWeek: number | null = null) {
  return mount(AddMealButton, { props: { planId: 'plan-1', dayOfWeek } })
}

async function openModal(wrapper: ReturnType<typeof mountButton>) {
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
describe('AddMealButton', () => {
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

  it('does not call updateMeal after createMeal', async () => {
    const wrapper = mountButton()
    await openModal(wrapper)
    await setTitle(wrapper, 'Plain Meal')

    await findSaveBtn(wrapper)!.trigger('click')
    await flushPromises()

    expect(mockCreateMeal).toHaveBeenCalled()
    expect(mockUpdateMeal).not.toHaveBeenCalled()
  })

  it('adds selected recipes after createMeal', async () => {
    const wrapper = mountButton()
    await openModal(wrapper)
    await setTitle(wrapper, 'Pasta')

    const picker = wrapper.findComponent({ name: 'RecipePicker' })
    await picker.vm.$emit('add', 'recipe-abc')

    await findSaveBtn(wrapper)!.trigger('click')
    await flushPromises()

    expect(mockAddRecipeToMeal).toHaveBeenCalledWith('new-meal', 'recipe-abc')
  })

  it('resets title after modal is closed', async () => {
    const wrapper = mountButton()
    await openModal(wrapper)
    await setTitle(wrapper, 'Sushi')

    await findSaveBtn(wrapper)!.trigger('click')
    await flushPromises()

    await openModal(wrapper)
    expect(wrapper.find('input').element.value).toBe('')
  })
})
