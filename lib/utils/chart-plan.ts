import { parseChartSpecifications, ChartSpecification } from "@/lib/utils/chart-spec-parser"
import { chartAnalystOutputSchema } from "@/lib/schemas/agent-output-schemas"
import { parseAndValidateAgentOutput } from "@/lib/utils/agent-retry"

export interface ChartSeries {
  key: string
  label?: string
  color?: string
  yAxisKey?: string
}

export interface ChartPlan {
  chartType: string
  xKey: string
  data: {
    columns: string[]
    rows: Record<string, any>[]
  }
  series: ChartSeries[]
  recommendationId: string
  recommendation?: AnalystRecommendation
  chartSpec: ChartSpecification | null
}

export interface AnalystRecommendation {
  id: string
  priority: number
  chartType: string
  chartVariant?: string
  businessQuestion?: string
  dataPreparation?: RecommendationDataPreparation
  chartMapping?: RecommendationChartMapping
  insightType?: string
  raw: any
}

export interface RecommendationDataPreparation {
  useTransformedStructure?: boolean
  groupBy?: string[]
  aggregations?: Record<string, AggregationType>
  filters?: Array<{ column: string; condition: string }>
  sorting?: { column: string; order?: "ascending" | "descending" }
}

export interface RecommendationChartMapping {
  xAxis?: string
  yAxis?: string | string[]
  groupBy?: string
}

type AggregationType =
  | "sum"
  | "avg"
  | "average"
  | "mean"
  | "count"
  | "countDistinct"
  | "max"
  | "min"

const SUPPORTED_CHART_TYPES = new Map<string, string>([
  ["bar", "bar"],
  ["column", "bar"],
  ["stacked bar", "bar"],
  ["grouped bar", "bar"],
  ["line", "line"],
  ["line chart", "line"],
  ["area", "area"],
  ["area chart", "area"],
  ["pie", "pie"],
  ["donut", "pie"],
  ["scatter", "scatter"],
])

const DEFAULT_COLORS = ["#00BFFF", "#001F3F", "#FF6B6B", "#4ECDC4", "#45B7D1"]

export function buildChartPlan(
  data: { columns: string[]; rows: Record<string, any>[] },
  agentResults: any,
  options?: { selectedRecommendationId?: string | null }
): ChartPlan | null {
  if (!data || !data.rows || data.rows.length === 0) {
    return null
  }

  const chartSpec = safeParseChartSpec(agentResults)
  const recommendations = extractChartRecommendations(agentResults)
  if (recommendations.length === 0) {
    return chartSpec
      ? {
          chartType: chartSpec.chartType,
          xKey: data.columns[0],
          data,
          series: defaultSeriesFromData(data, chartSpec),
          recommendationId: "default",
          chartSpec,
        }
      : null
  }

  const selected = selectRecommendation(recommendations, options?.selectedRecommendationId)
  if (!selected) {
    return null
  }

  const prepared = applyRecommendationData(data, selected)
  if (!prepared) {
    return null
  }

  const chartType = normalizeChartType(selected.chartType, chartSpec?.chartType)

  const { shapedData, series, xKey } = shapeDataForChart(prepared, selected, chartSpec)

  return {
    chartType,
    xKey,
    data: shapedData,
    series,
    recommendationId: selected.id,
    recommendation: selected,
    chartSpec,
  }
}

function safeParseChartSpec(agentResults: any): ChartSpecification | null {
  try {
    return parseChartSpecifications(agentResults)
  } catch (error) {
    console.warn("Failed to parse chart specification", error)
    return null
  }
}

export function extractChartRecommendations(agentResults: any): AnalystRecommendation[] {
  const text = agentResults?.agents?.chartAnalyst?.output
  if (!text) {
    return []
  }

  // Use retry utility to parse and validate agent output
  const parseResult = parseAndValidateAgentOutput(
    text,
    chartAnalystOutputSchema,
    'Chart Analyst'
  )

  if (!parseResult.success || !parseResult.data) {
    console.warn("⚠️ Chart Analyst output could not be validated, returning empty recommendations")
    return []
  }

  const validatedData = parseResult.data

  const recommendations: any[] = Array.isArray(validatedData?.chartRecommendations)
    ? validatedData.chartRecommendations
    : []

  return recommendations
    .map((rec, index) => toAnalystRecommendation(rec, index))
    .filter((rec): rec is AnalystRecommendation => !!rec)
    .sort((a, b) => a.priority - b.priority)
}

function toAnalystRecommendation(candidate: any, index: number): AnalystRecommendation | null {
  if (!candidate || typeof candidate !== "object") {
    return null
  }

  const priority = typeof candidate.priority === "number" ? candidate.priority : index + 1
  const chartType = String(candidate.chartType || candidate.chartVariant || "").toLowerCase()
  if (!chartType) {
    return null
  }

  const dataPreparation = candidate.dataPreparation || {}
  const chartMapping = candidate.chartMapping || {}

  return {
    id: candidate.id || `${priority}-${chartType}-${index}`,
    priority,
    chartType,
    chartVariant: candidate.chartVariant,
    businessQuestion: candidate.businessQuestion,
    dataPreparation,
    chartMapping,
    insightType: candidate.insightType,
    raw: candidate,
  }
}

function selectRecommendation(
  recommendations: AnalystRecommendation[],
  selectedId?: string | null
): AnalystRecommendation | null {
  if (recommendations.length === 0) return null
  if (selectedId) {
    const found = recommendations.find((rec) => rec.id === selectedId)
    if (found) return found
  }
  return recommendations[0]
}

type PreparedData = {
  columns: string[]
  rows: Record<string, any>[]
}

function applyRecommendationData(
  data: PreparedData,
  recommendation: AnalystRecommendation
): PreparedData | null {
  const prep = recommendation.dataPreparation
  if (!prep || !prep.groupBy || !prep.aggregations) {
    return data
  }

  const grouped = groupAndAggregate(data.rows, prep.groupBy, prep.aggregations)
  if (!grouped) {
    return data
  }

  let rows = grouped

  if (prep.sorting?.column) {
    const column = prep.sorting.column
    const order = prep.sorting.order === "descending" ? -1 : 1
    rows = [...rows].sort((a, b) => {
      const aVal = a[column]
      const bVal = b[column]
      if (aVal === bVal) return 0
      if (aVal === undefined || aVal === null) return 1
      if (bVal === undefined || bVal === null) return -1
      if (typeof aVal === "number" && typeof bVal === "number") {
        return aVal > bVal ? order : -order
      }
      return String(aVal).localeCompare(String(bVal)) * order
    })
  }

  const columns = Array.from(
    new Set([
      ...(prep.groupBy || []).filter(Boolean),
      ...Object.keys(prep.aggregations || {}).filter(Boolean),
    ])
  )

  return { columns, rows }
}

function groupAndAggregate(
  rows: Record<string, any>[],
  groupBy: string[],
  aggregations: Record<string, AggregationType>
): Record<string, any>[] {
  if (groupBy.length === 0) {
    return []
  }

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

function applyAggregation(
  rows: Record<string, any>[],
  measure: string,
  aggregation: AggregationType
): number {
  const values = rows
    .map((row) => toNumber(row[measure]))
    .filter((value): value is number => typeof value === "number" && !Number.isNaN(value))

  if (values.length === 0) {
    return 0
  }

  switch (aggregation) {
    case "sum":
      return values.reduce((acc, value) => acc + value, 0)
    case "avg":
    case "average":
    case "mean":
      return values.reduce((acc, value) => acc + value, 0) / values.length
    case "count":
      return rows.length
    case "countDistinct":
      return new Set(values).size
    case "max":
      return Math.max(...values)
    case "min":
      return Math.min(...values)
    default:
      return values.reduce((acc, value) => acc + value, 0)
  }
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null
  if (typeof value === "number") return value
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function shapeDataForChart(
  prepared: PreparedData,
  recommendation: AnalystRecommendation,
  chartSpec: ChartSpecification | null
): {
  shapedData: PreparedData
  series: ChartSeries[]
  xKey: string
} {
  const mapping = recommendation.chartMapping || {}
  const xKeyCandidate = mapping.xAxis || recommendation.dataPreparation?.groupBy?.find(Boolean)
  const xKey = xKeyCandidate || prepared.columns.find(Boolean) || prepared.columns[0]

  let series: ChartSeries[] = []
  let rows = prepared.rows

  const yAxes = Array.isArray(mapping.yAxis)
    ? mapping.yAxis
    : mapping.yAxis
      ? [mapping.yAxis]
      : Object.keys(recommendation.dataPreparation?.aggregations || {}).filter((key) => key !== xKey)

  const groupKey = mapping.groupBy

  if (groupKey && yAxes.length === 1) {
    const pivot = pivotSeries(rows, xKey, groupKey, yAxes[0])
    rows = pivot.rows
    series = pivot.series.map((seriesItem, index) => ({
      ...seriesItem,
      color: getPaletteColor(chartSpec, index),
    }))
  } else if (yAxes.length > 0) {
    series = yAxes
      .filter(Boolean)
      .map((key, index) => ({
        key,
        label: key,
        color: getPaletteColor(chartSpec, index),
      }))
  } else {
    const derivedSeries = prepared.columns.filter((col) => !!col && col !== xKey)
    series = derivedSeries.map((key, index) => ({
      key,
      label: key,
      color: getPaletteColor(chartSpec, index),
    }))
  }

  rows = sortRowsByChronologicalMonth(rows, xKey)

  const columns = Array.from(
    new Set([
      xKey,
      ...series.map((s) => s.key).filter(Boolean),
    ])
  )

  return {
    shapedData: { columns, rows },
    series,
    xKey,
  }
}

function pivotSeries(
  rows: Record<string, any>[],
  xKey: string,
  groupKey: string,
  valueKey: string
): {
  rows: Record<string, any>[]
  series: ChartSeries[]
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
        [String(groupValue)]: measureValue,
      })
    }
  }

  const series = Array.from(seriesKeys).map((key) => ({
    key,
    label: key,
  }))

  return {
    rows: Array.from(pivotMap.values()),
    series,
  }
}

function defaultSeriesFromData(
  data: { columns: string[]; rows: Record<string, any>[] },
  chartSpec: ChartSpecification | null
): ChartSeries[] {
  const columns = data.columns.slice(1)
  if (columns.length === 0) {
    return []
  }
  return columns.map((col, index) => ({
    key: col,
    label: col,
    color: getPaletteColor(chartSpec, index),
  }))
}

function normalizeChartType(candidate: string, fallback?: string): string {
  const lower = candidate.toLowerCase()
  for (const [key, value] of SUPPORTED_CHART_TYPES.entries()) {
    if (lower.includes(key)) {
      return value
    }
  }

  if (fallback) {
    return fallback
  }

  return "bar"
}

export type { ChartSpecification }

function getPaletteColor(chartSpec: ChartSpecification | null, index: number): string | undefined {
  const palette = chartSpec?.colors?.primary
  if (palette && palette.length > 0) {
    return palette[index % palette.length]
  }
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length]
}

const MONTH_ALIASES: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
}

function getMonthIndex(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const str = String(value).trim().toLowerCase()
  if (!str) return null

  const cleaned = str.replace(/\.$/, "")
  if (MONTH_ALIASES.hasOwnProperty(cleaned)) {
    return MONTH_ALIASES[cleaned]
  }

  const [firstToken] = cleaned.split(/[\s\-_/]+/)
  if (MONTH_ALIASES.hasOwnProperty(firstToken)) {
    return MONTH_ALIASES[firstToken]
  }

  const numeric = Number(cleaned)
  if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= 12) {
    return numeric - 1
  }

  return null
}

function sortRowsByChronologicalMonth(
  rows: Record<string, any>[],
  xKey: string
): Record<string, any>[] {
  if (!xKey) return rows

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
