import { format, isToday, subDays } from 'date-fns'

/**
 * Get the last N days as date strings (YYYY-MM-DD), most recent last.
 */
export function getLastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    days.push(format(subDays(new Date(), i), 'yyyy-MM-dd'))
  }
  return days
}

/**
 * Check if a date string is today.
 */
export function isDateToday(dateStr: string): boolean {
  return isToday(new Date(dateStr))
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/**
 * Check if a recurring task should appear today.
 */
export function isRecurringDueToday(recurrence: string): boolean {
  if (recurrence === 'daily') return true
  if (recurrence === 'weekly') {
    // Show on Mondays
    return new Date().getDay() === 1
  }
  // Check comma-separated day names: "mon,wed,fri"
  const dayMap: Record<string, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  }
  const today = new Date().getDay()
  const days = recurrence.split(',').map((d) => d.trim().toLowerCase())
  return days.some((d) => dayMap[d] === today)
}
