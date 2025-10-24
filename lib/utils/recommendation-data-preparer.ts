/**
 * Prepares data for a specific chart recommendation
 * Applies grouping, aggregation, filtering, and sorting
 */

import type { AnalystRecommendation } from './chart-plan'

export interface PreparedChartData {
  columns: string[]
  rows: Record<string, any>[]
  xKey: string
  series: Array<{
    key: string
    label: string
    color?: string
  }>
}

/**
 * Prepare data for a specific chart recommendation
 */
export function prepareDataForRecommendation(
  originalData: { columns: string[]; rows: Record<string, any>[] },
  recommendation: AnalystRecommendation,
  colorPalette: string[]
): PreparedChartData {
  const prep = recommendation.dataPreparation

  // Step 1: Apply data preparation (grouping, aggregation)
  let processedRows = originalData.rows

  if (prep?.groupBy && prep.aggregations) {
    processedRows = groupAndAggregate(
      originalData.rows,
      prep.groupBy,
      prep.aggregations
    )
  }

  // Step 2: Apply filters
  if (prep?.filters && prep.filters.length > 0) {
    processedRows = applyFilters(processedRows, prep.filters)
  }

  // Step 3: Apply sorting
  if (prep?.sorting?.column) {
    processedRows = sortData(processedRows, prep.sorting.column, prep.sorting.order)
  }

  // Step 4: Determine x-axis key
  const xKey =
    recommendation.chartMapping?.xAxis ||
    prep?.groupBy?.[0] ||
    originalData.columns[0]

  // Step 5: Determine series (y-axis data)
  let series: Array<{ key: string; label: string; color?: string }> = []

  const chartMapping = recommendation.chartMapping
  const yAxes = Array.isArray(chartMapping?.yAxis)
    ? chartMapping.yAxis
    : chartMapping?.yAxis
      ? [chartMapping.yAxis]
      : Object.keys(prep?.aggregations || {}).filter((key) => key !== xKey)

  if (chartMapping?.groupBy && yAxes.length === 1) {
    // Pivot: create one series per group value
    const pivotResult = pivotSeries(processedRows, xKey, chartMapping.groupBy, yAxes[0])
    processedRows = pivotResult.rows
    series = pivotResult.series.map((s, idx) => ({
      ...s,
      color: colorPalette[idx % colorPalette.length]
    }))
  } else if (yAxes.length > 0) {
    // Multiple y-axes: one series per y-axis
    series = yAxes.map((key, idx) => ({
      key,
      label: key,
      color: colorPalette[idx % colorPalette.length]
    }))
  } else {
    // Default: all numeric columns except x-axis
    const allColumns = Array.from(
      new Set([...Object.keys(processedRows[0] || {})])
    ).filter(col => col !== xKey)

    series = allColumns.map((key, idx) => ({
      key,
      label: key,
      color: colorPalette[idx % colorPalette.length]
    }))
  }

  // Step 6: Sort chronologically if x-axis has month names
  processedRows = sortRowsByChronologicalMonth(processedRows, xKey)

  // Step 7: Build final columns list
  const columns = Array.from(
    new Set([xKey, ...series.map((s) => s.key)])
  )

  return {
    columns,
    rows: processedRows,
    xKey,
    series
  }
}

/**
 * Group and aggregate data
 */
function groupAndAggregate(
  rows: Record<string, any>[],
  groupBy: string[],
  aggregations: Record<string, string>
): Record<string, any>[] {
  if (groupBy.length === 0) return rows

  const groups = new Map<string, Record<string, any>[]>()

  for (const row of rows) {
    const keyValues = groupBy.map((col) => row[col])
    const groupKey = JSON.stringify(keyValues)
    const bucket = groups.get(groupKey)
    if (bucket) {
      bucket.push(row)
    } else {
      groups.set(groupKey, [row])
    }
  }

  const result: Record<string, any>[] = []

  for (const [key, groupRows] of groups.entries()) {
    const keyValues: any[] = JSON.parse(key)
    const aggregatedRow: Record<string, any> = {}

    groupBy.forEach((col, idx) => {
      aggregatedRow[col] = keyValues[idx]
    })

    for (const [measure, agg] of Object.entries(aggregations)) {
      aggregatedRow[measure] = applyAggregation(groupRows, measure, agg)
    }

    result.push(aggregatedRow)
  }

  return result
}

/**
 * Apply aggregation function
 */
function applyAggregation(
  rows: Record<string, any>[],
  measure: string,
  aggregation: string
): number {
  const values = rows
    .map((row) => toNumber(row[measure]))
    .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))

  if (values.length === 0) return 0

  switch (aggregation.toLowerCase()) {
    case 'sum':
      return values.reduce((acc, value) => acc + value, 0)
    case 'avg':
    case 'average':
    case 'mean':
      return values.reduce((acc, value) => acc + value, 0) / values.length
    case 'count':
      return rows.length
    case 'countdistinct':
      return new Set(values).size
    case 'max':
      return Math.max(...values)
    case 'min':
      return Math.min(...values)
    default:
      return values.reduce((acc, value) => acc + value, 0)
  }
}

/**
 * Apply filters to data
 */
function applyFilters(
  rows: Record<string, any>[],
  filters: Array<{ column: string; condition: string; reason?: string }>
): Record<string, any>[] {
  let filtered = rows

  for (const filter of filters) {
    const condition = filter.condition.toLowerCase()

    // Handle "top N" filters
    if (condition.includes('top')) {
      const match = condition.match(/top\s+(\d+)/)
      if (match) {
        const n = parseInt(match[1])
        filtered = filtered.slice(0, n)
      }
    }

    // Handle "last N" filters
    if (condition.includes('last')) {
      const match = condition.match(/last\s+(\d+)/)
      if (match) {
        const n = parseInt(match[1])
        filtered = filtered.slice(-n)
      }
    }

    // Add more filter conditions as needed
  }

  return filtered
}

/**
 * Sort data by column
 */
function sortData(
  rows: Record<string, any>[],
  column: string,
  order: 'ascending' | 'descending' = 'ascending'
): Record<string, any>[] {
  const multiplier = order === 'descending' ? -1 : 1

  return [...rows].sort((a, b) => {
    const aVal = a[column]
    const bVal = b[column]

    if (aVal === bVal) return 0
    if (aVal === undefined || aVal === null) return 1
    if (bVal === undefined || bVal === null) return -1

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * multiplier
    }

    return String(aVal).localeCompare(String(bVal)) * multiplier
  })
}

/**
 * Pivot series: convert rows into separate series per group value
 */
function pivotSeries(
  rows: Record<string, any>[],
  xKey: string,
  groupKey: string,
  valueKey: string
): {
  rows: Record<string, any>[]
  series: Array<{ key: string; label: string }>
} {
  const pivotMap = new Map<any, Record<string, any>>()
  const seriesKeys = new Set<string>()

  for (const row of rows) {
    const xValue = row[xKey]
    const groupValue = row[groupKey]
    const measureValue = row[valueKey]

    seriesKeys.add(String(groupValue))

    const existing = pivotMap.get(xValue)
    if (existing) {
      existing[String(groupValue)] = measureValue
    } else {
      pivotMap.set(xValue, {
        [xKey]: xValue,
        [String(groupValue)]: measureValue
      })
    }
  }

  const series = Array.from(seriesKeys).map((key) => ({
    key,
    label: key
  }))

  return {
    rows: Array.from(pivotMap.values()),
    series
  }
}

/**
 * Sort rows chronologically if x-axis contains month names
 */
function sortRowsByChronologicalMonth(
  rows: Record<string, any>[],
  xKey: string
): Record<string, any>[] {
  if (!xKey) return rows

  const MONTH_ALIASES: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  }

  const getMonthIndex = (value: unknown): number | null => {
    if (value === null || value === undefined) return null
    const str = String(value).trim().toLowerCase()
    if (!str) return null

    const cleaned = str.replace(/\.$/, '')
    if (MONTH_ALIASES.hasOwnProperty(cleaned)) {
      return MONTH_ALIASES[cleaned]
    }

    const [firstToken] = cleaned.split(/[\s\-_/]+/)
    if (MONTH_ALIASES.hasOwnProperty(firstToken)) {
      return MONTH_ALIASES[firstToken]
    }

    return null
  }

  const monthRanks = rows.map((row) => getMonthIndex(row?.[xKey]))
  if (monthRanks.some((rank) => rank === null)) {
    return rows
  }

  return [...rows].sort((a, b) => {
    const rankA = getMonthIndex(a?.[xKey]) ?? 0
    const rankB = getMonthIndex(b?.[xKey]) ?? 0
    return rankA - rankB
  })
}

/**
 * Convert value to number
 */
function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}
