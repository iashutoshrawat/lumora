/**
 * Format large numbers with K, M, B abbreviations (consulting style)
 * Examples:
 * - 1234 → "1.2K"
 * - 1234567 → "1.2M"
 * - 1234567890 → "1.2B"
 * - 50333677.41 → "50.3M"
 */
export function formatLargeNumber(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '0'

  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(decimals)}B`
  } else if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(decimals)}M`
  } else if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(decimals)}K`
  } else {
    return `${sign}${absValue.toFixed(decimals)}`
  }
}

/**
 * Format currency with K, M, B abbreviations
 * Examples:
 * - 1234 → "$1.2K"
 * - 1234567 → "$1.2M"
 * - -1234567 → "-$1.2M"
 */
export function formatCurrency(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '$0'

  const sign = value < 0 ? '-' : ''
  const formatted = formatLargeNumber(Math.abs(value), decimals)

  return `${sign}$${formatted}`
}

/**
 * Format percentage
 * Examples:
 * - 0.234 → "23.4%"
 * - 0.5 → "50.0%"
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '0%'

  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Highcharts number formatter function
 * Use this for data labels that need abbreviation
 */
export function highchartsNumberFormatter(this: any): string {
  return formatLargeNumber(this.y)
}

/**
 * Highcharts currency formatter function
 * Use this for data labels that need currency abbreviation
 */
export function highchartsCurrencyFormatter(this: any): string {
  return formatCurrency(this.y)
}
