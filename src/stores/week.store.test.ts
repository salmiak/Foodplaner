import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWeekStore } from './week.store'
import { getISOWeeksInYear } from '@/lib/utils'

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('setWeek', () => {
  it('updates year and weekNumber', () => {
    const store = useWeekStore()
    store.setWeek(2027, 5)
    expect(store.currentYear).toBe(2027)
    expect(store.currentWeekNumber).toBe(5)
  })

  it('clears weekId', () => {
    const store = useWeekStore()
    store.setWeek(2027, 5)
    expect(store.weekId).toBeNull()
  })
})

describe('goToAdjacentWeek', () => {
  it('increments week number for next', () => {
    const store = useWeekStore()
    store.setWeek(2026, 10)
    const result = store.goToAdjacentWeek('next')
    expect(result).toEqual({ year: 2026, weekNumber: 11 })
    expect(store.currentWeekNumber).toBe(11)
  })

  it('decrements week number for prev', () => {
    const store = useWeekStore()
    store.setWeek(2026, 10)
    const result = store.goToAdjacentWeek('prev')
    expect(result).toEqual({ year: 2026, weekNumber: 9 })
    expect(store.currentWeekNumber).toBe(9)
  })

  it('wraps to previous year on week 1 prev', () => {
    const store = useWeekStore()
    store.setWeek(2026, 1)
    const result = store.goToAdjacentWeek('prev')
    expect(result.year).toBe(2025)
    expect(result.weekNumber).toBe(getISOWeeksInYear(2025))
  })

  it('wraps to next year on last week next', () => {
    const store = useWeekStore()
    const lastWeek = getISOWeeksInYear(2026)
    store.setWeek(2026, lastWeek)
    const result = store.goToAdjacentWeek('next')
    expect(result).toEqual({ year: 2027, weekNumber: 1 })
  })
})

describe('isCurrentWeek', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true when set to current week', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-07T12:00:00Z')) // week 15 of 2026
    setActivePinia(createPinia())
    const store = useWeekStore()
    store.setWeek(2026, 15)
    expect(store.isCurrentWeek).toBe(true)
  })

  it('returns false for a different week', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-07T12:00:00Z'))
    setActivePinia(createPinia())
    const store = useWeekStore()
    store.setWeek(2026, 10)
    expect(store.isCurrentWeek).toBe(false)
  })
})

describe('weekLabel', () => {
  it('returns a non-empty string', () => {
    const store = useWeekStore()
    store.setWeek(2026, 15)
    expect(typeof store.weekLabel).toBe('string')
    expect(store.weekLabel.length).toBeGreaterThan(0)
  })
})

describe('weekDates', () => {
  it('returns 7 dates for the current week', () => {
    const store = useWeekStore()
    store.setWeek(2026, 15)
    expect(store.weekDates).toHaveLength(7)
  })
})
