const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const formatterWithCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Convert cents to a display string, e.g. 5000 → "$50" */
export function formatCurrency(cents: number): string {
  return formatter.format(cents / 100)
}

/** Convert cents to a display string with explicit decimals, e.g. 5050 → "$50.50" */
export function formatCurrencyExact(cents: number): string {
  return formatterWithCents.format(cents / 100)
}

/** Convert cents to a signed display string, e.g. 5000 → "+$50", -2000 → "-$20" */
export function formatCurrencySigned(cents: number): string {
  const abs = formatter.format(Math.abs(cents) / 100)
  if (cents > 0) return `+${abs}`
  if (cents < 0) return `-${abs}`
  return abs
}

/** Parse a dollar string input to cents, e.g. "50" or "50.50" → 5000 or 5050 */
export function parseToCents(dollarString: string): number {
  const parsed = parseFloat(dollarString.replace(/[^0-9.]/g, ''))
  if (isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}
