import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  getISOWeek,
  getWeekStart,
  getWeekDates,
  formatWeekLabel,
  formatDayLabel,
  getAdjacentWeek,
  getISOWeeksInYear,
  isToday,
  stringToColor,
  getInitials,
} from './utils'

describe('getISOWeek', () => {
  it('returns correct week for a known Monday', () => {
    // 2026-01-05 is a Monday in week 2 of 2026
    expect(getISOWeek(new Date('2026-01-05'))).toEqual({ year: 2026, weekNumber: 2 })
  })

  it('returns week 1 for Jan 1 2026 (Thursday)', () => {
    expect(getISOWeek(new Date('2026-01-01'))).toEqual({ year: 2026, weekNumber: 1 })
  })

  it('returns week 53 of previous year for Dec 31 of a short year', () => {
    // 2020-01-01 is a Wednesday; ISO week 1 of 2020
    expect(getISOWeek(new Date('2020-01-01'))).toEqual({ year: 2020, weekNumber: 1 })
  })

  it('assigns Dec 28 to week 52 or 53 of its own year', () => {
    // Dec 28 is always in the last week of the ISO year
    const result = getISOWeek(new Date('2026-12-28'))
    expect(result.year).toBe(2026)
    expect(result.weekNumber).toBeGreaterThanOrEqual(52)
  })

  it('returns week 52 or 53 for the last day of 2015', () => {
    // 2015-12-31 is a Thursday, so it belongs to week 53 of 2015
    expect(getISOWeek(new Date('2015-12-31'))).toEqual({ year: 2015, weekNumber: 53 })
  })
})

describe('getWeekStart', () => {
  it('returns Monday for a known week', () => {
    // Week 14 of 2026 starts on Mon 30 March 2026
    const monday = getWeekStart(2026, 14)
    expect(monday.getUTCFullYear()).toBe(2026)
    expect(monday.getUTCMonth()).toBe(2) // March = 2
    expect(monday.getUTCDate()).toBe(30)
    expect(monday.getUTCDay()).toBe(1) // Monday
  })

  it('returns Mon Jan 4 for week 1 of 2021', () => {
    const monday = getWeekStart(2021, 1)
    expect(monday.getUTCFullYear()).toBe(2021)
    expect(monday.getUTCMonth()).toBe(0) // January
    expect(monday.getUTCDate()).toBe(4)
  })
})

describe('getWeekDates', () => {
  it('returns 7 dates', () => {
    expect(getWeekDates(2026, 15)).toHaveLength(7)
  })

  it('first date is Monday', () => {
    const dates = getWeekDates(2026, 15)
    expect(dates[0].getUTCDay()).toBe(1)
  })

  it('last date is Sunday', () => {
    const dates = getWeekDates(2026, 15)
    expect(dates[6].getUTCDay()).toBe(0)
  })

  it('dates are consecutive', () => {
    const dates = getWeekDates(2026, 15)
    for (let i = 1; i < 7; i++) {
      const diff = dates[i].getTime() - dates[i - 1].getTime()
      expect(diff).toBe(86400000) // exactly one day
    }
  })

  it('round-trips with getISOWeek', () => {
    const dates = getWeekDates(2026, 15)
    for (const d of dates) {
      expect(getISOWeek(d).weekNumber).toBe(15)
    }
  })
})

describe('formatWeekLabel', () => {
  it('includes both month names when spanning two months', () => {
    // Week 14 of 2026: Mar 30 – Apr 5
    const label = formatWeekLabel(2026, 14)
    expect(label).toContain('Mar')
    expect(label).toContain('Apr')
  })

  it('contains the year', () => {
    const label = formatWeekLabel(2026, 15)
    expect(label).toContain('2026')
  })

  it('uses – separator', () => {
    const label = formatWeekLabel(2026, 15)
    expect(label).toContain('–')
  })
})

describe('formatDayLabel', () => {
  it('formats a known date correctly', () => {
    const d = new Date('2026-04-07T00:00:00Z')
    const label = formatDayLabel(d)
    expect(label).toBe('Apr 7')
  })

  it('formats a single-digit day without zero-padding', () => {
    const d = new Date('2026-04-01T00:00:00Z')
    expect(formatDayLabel(d)).toBe('Apr 1')
  })
})

describe('getAdjacentWeek', () => {
  it('returns next week', () => {
    expect(getAdjacentWeek(2026, 15, 'next')).toEqual({ year: 2026, weekNumber: 16 })
  })

  it('returns previous week', () => {
    expect(getAdjacentWeek(2026, 15, 'prev')).toEqual({ year: 2026, weekNumber: 14 })
  })

  it('wraps from week 1 to last week of previous year', () => {
    const result = getAdjacentWeek(2026, 1, 'prev')
    expect(result.year).toBe(2025)
    expect(result.weekNumber).toBe(getISOWeeksInYear(2025))
  })

  it('wraps from last week of year to week 1 of next year', () => {
    const lastWeek = getISOWeeksInYear(2026)
    const result = getAdjacentWeek(2026, lastWeek, 'next')
    expect(result).toEqual({ year: 2027, weekNumber: 1 })
  })
})

describe('getISOWeeksInYear', () => {
  it('returns 52 for a normal year', () => {
    // 2024: Jan 1 is Monday, Dec 31 is Tuesday — neither is Thursday → 52 weeks
    expect(getISOWeeksInYear(2024)).toBe(52)
  })

  it('returns 53 for a long year (Jan 1 is Thursday)', () => {
    // 2015: Jan 1 is Thursday → 53 weeks
    expect(getISOWeeksInYear(2015)).toBe(53)
  })

  it('returns 53 for 2020', () => {
    // 2020: Dec 31 is Thursday → 53 weeks
    expect(getISOWeeksInYear(2020)).toBe(53)
  })
})

describe('isToday', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true for today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-07T12:00:00Z'))
    expect(isToday(new Date('2026-04-07'))).toBe(true)
  })

  it('returns false for yesterday', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-07T12:00:00Z'))
    expect(isToday(new Date('2026-04-06'))).toBe(false)
  })

  it('returns false for tomorrow', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-07T12:00:00Z'))
    expect(isToday(new Date('2026-04-08'))).toBe(false)
  })
})

describe('stringToColor', () => {
  const validColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  ]

  it('returns a color from the palette', () => {
    const color = stringToColor('user-123')
    expect(validColors).toContain(color)
  })

  it('is deterministic — same input always gives same color', () => {
    expect(stringToColor('abc')).toBe(stringToColor('abc'))
  })

  it('different inputs can produce different colors', () => {
    const colors = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(stringToColor))
    expect(colors.size).toBeGreaterThan(1)
  })
})

describe('getInitials', () => {
  it('returns first 2 chars uppercased for email', () => {
    expect(getInitials('alice@example.com')).toBe('AL')
  })

  it('returns first+last initial for full name', () => {
    expect(getInitials('Alice Johnson')).toBe('AJ')
  })

  it('returns first 2 chars for single word', () => {
    expect(getInitials('Bob')).toBe('BO')
  })

  it('handles multiple spaces — uses first and last word', () => {
    expect(getInitials('Anna Maria Berg')).toBe('AB')
  })

  it('uppercases result', () => {
    expect(getInitials('anna berg')).toBe('AB')
  })
})
