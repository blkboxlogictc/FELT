/** Format an ISO date string (YYYY-MM-DD) or Date for display */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Compact date, e.g. "Jun 20" */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/** Month and year, e.g. "June 2025" */
export function formatMonthYear(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  return d.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

/** Today's date as YYYY-MM-DD (local time) */
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
