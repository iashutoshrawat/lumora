"use client"

import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import type { Options, SeriesOptionsType, DashStyleValue, PointLabelObject, TooltipFormatterContextObject, Point } from "highcharts"
import { useEffect, useMemo, useState } from "react"
import { Palette, Download, Share2 } from "lucide-react"

import { parseChartSpecifications, formatValue, type ChartSpecification } from "@/lib/utils/chart-spec-parser"
import type { ChartPlan } from "@/lib/utils/chart-plan"

interface ChartCanvasProps {
  data: any
  chartType: string
  config: any
  agentRecommendations?: any
  onChartTypeChange?: (type: string) => void
  chartPlan?: ChartPlan | null
}

const FALLBACK_COLORS = ["#00BFFF", "#001F3F", "#FF6B6B", "#4ECDC4", "#45B7D1"]
type HighchartsChartType = "column" | "line" | "area" | "pie" | "scatter"

export default function ChartCanvas({ data, chartType, config, agentRecommendations, onChartTypeChange, chartPlan }: ChartCanvasProps) {
  const [chartSpec, setChartSpec] = useState<ChartSpecification | null>(null)

  useEffect(() => {
    if (chartPlan?.chartSpec) {
      setChartSpec(chartPlan.chartSpec)
    }
  }, [chartPlan])

  useEffect(() => {
    if (agentRecommendations && !chartPlan?.chartSpec) {
      try {
        const spec = parseChartSpecifications(agentRecommendations)
        setChartSpec(spec)
        console.log("📊 Parsed chart specifications:", spec)
      } catch (error) {
        console.error("Failed to parse chart specifications:", error)
      }
    }
  }, [agentRecommendations, chartPlan])

  useEffect(() => {
    if (data?.rows) {
      console.log("📈 Chart data sample (first 10 rows):", data.rows.slice(0, 10))
    }
  }, [data])

  if (!data || !data.rows || data.rows.length === 0) {
    return (
      <div className="w-full h-full bg-surface flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-base font-medium">No data loaded</p>
          <p className="text-sm">Upload a dataset to get started</p>
        </div>
      </div>
    )
  }

  const palette = chartSpec?.colors?.primary?.length ? chartSpec.colors.primary : FALLBACK_COLORS

  const xKey = chartPlan?.xKey || data?.columns?.[0]
  const rawSeries = chartPlan?.series?.length
    ? chartPlan.series
    : (data?.columns || [])
        .slice(1)
        .map((col: string) => ({ key: col, label: col }))

  const series = rawSeries.map((seriesItem, idx) => ({
    ...seriesItem,
    color: seriesItem.color || palette[idx % palette.length],
  }))

  const normalizedType = mapToHighchartsType(chartType)

  const categories = useMemo(() => {
    if (!xKey) return []
    return data.rows.map((row: Record<string, any>) => row[xKey])
  }, [data.rows, xKey])

  const chartOptions = useMemo<Options>(() => {
    if (!xKey || series.length === 0) {
      return {
        title: { text: "" },
        series: [],
      }
    }

    const dataLabelFormat = chartSpec?.dataLabels?.format || "$0.0a"
    const dataLabelsEnabled = chartSpec?.dataLabels?.show !== false

    const yPlotLines = (chartSpec?.referenceLines || [])
      .filter((line) => line.axis === "y" && typeof line.value !== "undefined")
      .map((line) => ({
        value: typeof line.value === "number" ? line.value : toNumber(line.value),
        color: line.color || "#737373",
        width: line.strokeWidth || 1,
        dashStyle: mapDashStyle(line.strokeDasharray),
        label: {
          text: line.label,
          align: "right",
          style: {
            color: "#737373",
            fontSize: "10px",
          },
        },
      }))

    const annotations = (chartSpec?.annotations || [])
      .filter((annotation) => typeof annotation.x === "number" && typeof annotation.y === "number")
      .map((annotation) => ({
        labelOptions: {
          backgroundColor: "rgba(0,0,0,0.65)",
          borderRadius: 4,
          style: { color: "#fff", fontSize: "10px" },
        },
        labels: [
          {
            point: { xAxis: 0, yAxis: 0, x: annotation.x, y: annotation.y },
            text: annotation.text,
          },
        ],
      }))

    const commonDataLabels = dataLabelsEnabled
      ? {
          enabled: true,
          formatter(this: PointLabelObject) {
            const value = typeof this.y === "number" ? this.y : toNumber(this.y)
            return formatValue(value, dataLabelFormat)
          },
          style: {
            textOutline: "none",
            fontSize: chartSpec?.dataLabels?.fontSize ? `${chartSpec.dataLabels.fontSize}px` : undefined,
            fontWeight: chartSpec?.dataLabels?.fontWeight,
            color: chartSpec?.typography?.dataLabels?.color,
          },
        }
      : { enabled: false }

    const seriesOptions: SeriesOptionsType[] = buildSeriesOptions({
      chartType: normalizedType,
      series,
      data,
      xKey,
      categories,
      palette,
      dataLabels: commonDataLabels,
      dataLabelFormat,
      columns: data.columns || [],
    })

    const legendPosition = chartSpec?.legend?.position || "top"
    const legendConfig = mapLegendPosition(legendPosition)

    return {
      chart: {
        type: normalizedType === "column" ? "column" : normalizedType,
        backgroundColor: "transparent",
        spacingTop: chartSpec?.spacing?.margins?.top ?? 60,
        spacingRight: chartSpec?.spacing?.margins?.right ?? 80,
        spacingBottom: chartSpec?.spacing?.margins?.bottom ?? 80,
        spacingLeft: chartSpec?.spacing?.margins?.left ?? 80,
        height: "100%",
        width: null,
        reflow: true,
      },
      title: {
        text: chartPlan?.recommendation?.businessQuestion || "",
        style: {
          fontSize: chartSpec?.typography?.chartTitle?.size
            ? `${chartSpec.typography.chartTitle.size}px`
            : "20px",
          fontWeight: chartSpec?.typography?.chartTitle?.weight?.toString() || "600",
          color: chartSpec?.typography?.chartTitle?.color || "#2C2C2C",
        },
      },
      colors: palette,
      xAxis: {
        categories: normalizedType === "scatter" ? undefined : categories.map(String),
        title: {
          text: chartSpec?.axes?.xAxis?.label || undefined,
          style: {
            color: chartSpec?.typography?.axisLabels?.color,
            fontSize: chartSpec?.typography?.axisLabels?.size
              ? `${chartSpec.typography.axisLabels.size}px`
              : undefined,
            fontWeight: chartSpec?.typography?.axisLabels?.weight,
          },
        },
        type: normalizedType === "scatter" && isNumericAxis(data.rows, xKey) ? "linear" : "category",
        gridLineWidth: chartSpec?.axes?.xAxis?.grid ? 1 : 0,
      },
      yAxis: {
        title: {
          text: chartSpec?.axes?.yAxis?.label || undefined,
          style: {
            color: chartSpec?.typography?.axisLabels?.color,
            fontSize: chartSpec?.typography?.axisLabels?.size
              ? `${chartSpec.typography.axisLabels.size}px`
              : undefined,
            fontWeight: chartSpec?.typography?.axisLabels?.weight,
          },
        },
        gridLineColor: chartSpec?.axes?.gridStyle?.color || "#E5E5E5",
        gridLineDashStyle: mapDashStyle(chartSpec?.axes?.gridStyle?.strokeDasharray),
        gridLineWidth: chartSpec?.axes?.yAxis?.grid === false ? 0 : 1,
        min: chartSpec?.axes?.yAxis?.startAtZero ? 0 : undefined,
        plotLines: yPlotLines,
      },
      tooltip: {
        shared: normalizedType !== "scatter" && normalizedType !== "pie",
        formatter(this: TooltipFormatterContextObject) {
          if (normalizedType === "pie" && this.point) {
            const label = this.point.name || String(this.x)
            const value = typeof this.y === "number" ? this.y : toNumber(this.y)
            return `${label}: <b>${formatValue(value, dataLabelFormat)}</b>`
          }

          const value = typeof this.y === "number" ? this.y : toNumber(this.y)
          const name = this.series?.name || this.key
          return `${name}: <b>${formatValue(value, dataLabelFormat)}</b>`
        },
      },
      plotOptions: {
        series: {
          borderRadius: normalizedType === "column" ? 4 : undefined,
          dataLabels: commonDataLabels,
          marker:
            normalizedType === "line" || normalizedType === "area"
              ? {
                  enabled: true,
                  radius: 4,
                }
              : undefined,
        },
        pie: {
          dataLabels: commonDataLabels,
          showInLegend: chartSpec?.legend?.show !== false,
        },
      },
      legend: {
        enabled: chartSpec?.legend?.show !== false,
        align: legendConfig.align,
        verticalAlign: legendConfig.verticalAlign,
        layout: legendConfig.layout,
      },
      annotations,
      credits: { enabled: false },
      series: seriesOptions,
    }
  }, [categories, chartPlan, chartSpec, data, data.rows, normalizedType, palette, series, xKey])

  const typeOptions = useMemo(() => {
    const base = ["bar", "line", "pie", "area", "scatter"]
    if (chartPlan?.chartType && !base.includes(chartPlan.chartType)) {
      base.push(chartPlan.chartType)
    }
    return Array.from(new Set(base))
  }, [chartPlan?.chartType])

  const canRender = (chartOptions.series || []).length > 0

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 bg-white p-8 flex flex-col overflow-hidden">
        {canRender ? (
          <div className="flex-1 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <HighchartsReact
              highcharts={Highcharts}
              options={chartOptions}
              immutable
              containerProps={{ className: "w-full h-full" }}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 text-sm text-gray-500 rounded-xl border border-dashed border-gray-200">
            Unable to render chart—missing axis or series configuration.
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-2">
            Chart Type
          </span>
          {typeOptions.map((type) => (
            <button
              key={type}
              onClick={() => onChartTypeChange?.(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                chartType === type
                  ? "bg-accent text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium flex items-center gap-1.5 transition-all">
            <Palette className="w-3.5 h-3.5" />
            Colors
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium flex items-center gap-1.5 transition-all">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent to-primary text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm hover:shadow">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>
    </div>
  )
}

function buildSeriesOptions({
  chartType,
  series,
  data,
  xKey,
  categories,
  palette,
  dataLabels,
  dataLabelFormat,
  columns,
}: {
  chartType: HighchartsChartType
  series: Array<{ key: string; label?: string; color?: string }>
  data: { rows: Record<string, any>[] }
  xKey: string
  categories: any[]
  palette: string[]
  dataLabels: Highcharts.PlotSeriesDataLabelsOptions
  dataLabelFormat: string
  columns: string[]
}): SeriesOptionsType[] {
  if (chartType === "pie") {
    const firstSeries = series[0]
    const valueKey = firstSeries?.key || columns[1]

    return [
      {
        type: "pie",
        name: firstSeries?.label || firstSeries?.key || "Value",
        colorByPoint: true,
        data: data.rows.map((row: Record<string, any>, idx: number) => ({
          name: String(row[xKey]),
          y: toNumber(row[valueKey]),
          color: firstSeries?.color || palette[idx % palette.length],
        })),
        dataLabels,
      },
    ]
  }

  if (chartType === "scatter") {
    const numericX = isNumericAxis(data.rows, xKey)

    return series.map((seriesItem, index) => ({
      type: "scatter",
      name: seriesItem.label || seriesItem.key,
      color: seriesItem.color || palette[index % palette.length],
      data: data.rows.map((row: Record<string, any>, idx: number) => {
        const rawX = row[xKey]
        const xValue = numericX ? toNumber(rawX) : idx
        return [xValue, toNumber(row[seriesItem.key])]
      }),
      dataLabels,
      tooltip: {
        pointFormatter(this: Point) {
          const value = toNumber(this.y)
          return `<span style="color:${this.color}">●</span> ${seriesItem.label || seriesItem.key}: <b>${formatValue(value, dataLabelFormat)}</b><br/>`
        },
      },
    }))
  }

  return series.map((seriesItem, index) => ({
    type: chartType,
    name: seriesItem.label || seriesItem.key,
    color: seriesItem.color || palette[index % palette.length],
    data: data.rows.map((row: Record<string, any>) => toNumber(row[seriesItem.key])),
    dataLabels,
  }))
}

function mapToHighchartsType(type: string): HighchartsChartType {
  const normalized = type.toLowerCase()
  if (normalized.includes("pie")) return "pie"
  if (normalized.includes("scatter")) return "scatter"
  if (normalized.includes("area")) return "area"
  if (normalized.includes("line")) return "line"
  return "column"
}

function isNumericAxis(rows: Record<string, any>[], key: string): boolean {
  return rows.every((row) => {
    const value = row[key]
    return typeof value === "number" || (!Number.isNaN(Number(value)) && value !== "")
  })
}

function mapLegendPosition(position: string): { align: "left" | "center" | "right"; verticalAlign: "top" | "middle" | "bottom"; layout: "horizontal" | "vertical" } {
  switch (position) {
    case "bottom":
      return { align: "center", verticalAlign: "bottom", layout: "horizontal" }
    case "left":
      return { align: "left", verticalAlign: "middle", layout: "vertical" }
    case "right":
      return { align: "right", verticalAlign: "middle", layout: "vertical" }
    case "top-right":
      return { align: "right", verticalAlign: "top", layout: "horizontal" }
    default:
      return { align: "center", verticalAlign: "top", layout: "horizontal" }
  }
}

function mapDashStyle(strokeDasharray?: string): Highcharts.DashStyleValue {
  if (!strokeDasharray) return "Solid"
  if (strokeDasharray.includes("5 5") || strokeDasharray.includes("4 4")) return "Dash"
  if (strokeDasharray.includes("3 3")) return "Dot"
  return "Solid"
}

function toNumber(value: any): number {
  if (value === null || value === undefined || value === "") return 0
  if (typeof value === "number") return value
  const parsed = Number(value)
  return Number.isNaN(parsed) ? 0 : parsed
}
