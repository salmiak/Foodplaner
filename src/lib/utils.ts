/**
 * Get ISO week number for a given date (1-53).
 * ISO weeks start on Monday. Week 1 contains the year's first Thursday.
 */
export function getISOWeek(date: Date): { year: number; weekNumber: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // ISO weekday: 1=Mon, 7=Sun
  const dayOfWeek = d.getUTCDay() || 7
  // Adjust to nearest Thursday
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { year: d.getUTCFullYear(), weekNumber }
}

/** Get the current ISO week */
export function getCurrentISOWeek() {
  return getISOWeek(new Date())
}

/**
 * Get the Monday Date of a given ISO year + week number.
 */
export function getWeekStart(year: number, weekNumber: number): Date {
  // Jan 4 is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4DayOfWeek = jan4.getUTCDay() || 7  // 1=Mon
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4DayOfWeek - 1))

  const monday = new Date(week1Monday)
  monday.setUTCDate(week1Monday.getUTCDate() + (weekNumber - 1) * 7)
  return monday
}

/**
 * Returns all 7 dates (Mon–Sun) for the given ISO week.
 */
export function getWeekDates(year: number, weekNumber: number): Date[] {
  const monday = getWeekStart(year, weekNumber)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() + i)
    return d
  })
}

/**
 * Format a week label e.g. "Apr 7 – Apr 13, 2026"
 */
export function formatWeekLabel(year: number, weekNumber: number): string {
  const dates = getWeekDates(year, weekNumber)
  const start = dates[0]
  const end = dates[6]
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  const endYear =
    end.getUTCFullYear() !== start.getUTCFullYear() ? `, ${end.getUTCFullYear()}` : ''
  return `${fmt(start)} – ${fmt(end)}${endYear || `, ${year}`}`
}

/**
 * Format a single day label e.g. "Apr 7"
 */
export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/**
 * Navigate to the adjacent week, handling year boundaries.
 */
export function getAdjacentWeek(
  year: number,
  weekNumber: number,
  direction: 'prev' | 'next',
): { year: number; weekNumber: number } {
  const delta = direction === 'next' ? 1 : -1
  let targetWeek = weekNumber + delta
  let targetYear = year

  if (targetWeek < 1) {
    targetYear -= 1
    targetWeek = getISOWeeksInYear(targetYear)
  } else if (targetWeek > getISOWeeksInYear(year)) {
    targetYear += 1
    targetWeek = 1
  }

  return { year: targetYear, weekNumber: targetWeek }
}

export function getISOWeeksInYear(year: number): number {
  const jan1Day = new Date(year, 0, 1).getDay()
  const dec31Day = new Date(year, 11, 31).getDay()
  return jan1Day === 4 || dec31Day === 4 ? 53 : 52
}

/** Return true if date is today */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getUTCFullYear() === today.getFullYear() &&
    date.getUTCMonth() === today.getMonth() &&
    date.getUTCDate() === today.getDate()
  )
}

/** Generate a consistent color from a string (for presence avatars) */
export function stringToColor(str: string): string {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/** Get display initials from email or name */
export function getInitials(emailOrName: string): string {
  if (emailOrName.includes('@')) {
    return emailOrName.slice(0, 2).toUpperCase()
  }
  const parts = emailOrName.trim().split(/\s+/)
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : emailOrName.slice(0, 2).toUpperCase()
}
