"use client"

import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import { useMemo } from "react"
import { Palette, Download, Share2 } from "lucide-react"
import { formatCurrency, formatLargeNumber, formatPercentage } from "@/lib/utils/number-formatter"

interface ChartCanvasNewProps {
  highchartsConfig: any
  chartType: string
  onChartTypeChange?: (type: string) => void
}

export default function ChartCanvasNew({
  highchartsConfig,
  chartType,
  onChartTypeChange
}: ChartCanvasNewProps) {
  const typeOptions = useMemo(() => {
    return ["bar", "line", "pie", "area", "scatter"]
  }, [])

  // Override chart dimensions to make it responsive to container size
  // AND inject number formatters for consulting-style abbreviations
  const responsiveChartConfig = useMemo(() => {
    if (!highchartsConfig) return null

    // Detect if we're dealing with currency, percentage, or plain numbers
    const formatString = highchartsConfig.plotOptions?.series?.dataLabels?.format ||
                         highchartsConfig.tooltip?.valuePrefix || ''
    const isCurrency = formatString.includes('$') ||
                       highchartsConfig.tooltip?.valuePrefix === '$'
    const isPercentage = formatString.includes('%') ||
                         highchartsConfig.tooltip?.valueSuffix === '%'

    // Create formatter function based on data type
    const createFormatter = () => {
      if (isCurrency) {
        return function(this: any): string {
          return formatCurrency(this.y || this.value)
        }
      } else if (isPercentage) {
        return function(this: any): string {
          return formatPercentage((this.y || this.value) / 100)
        }
      } else {
        return function(this: any): string {
          return formatLargeNumber(this.y || this.value)
        }
      }
    }

    const config = {
      ...highchartsConfig,
      chart: {
        ...highchartsConfig.chart,
        height: null,  // Let chart be responsive to container height
        width: null    // Let chart be responsive to container width
      },

      // Add formatter to data labels
      plotOptions: {
        ...highchartsConfig.plotOptions,
        series: {
          ...highchartsConfig.plotOptions?.series,
          dataLabels: {
            ...highchartsConfig.plotOptions?.series?.dataLabels,
            formatter: createFormatter()
          }
        }
      },

      // Add formatter to tooltip
      tooltip: {
        ...highchartsConfig.tooltip,
        formatter: function(this: any): string {
          const value = this.y || this.point?.y
          let formattedValue = ''

          if (isCurrency) {
            formattedValue = formatCurrency(value)
          } else if (isPercentage) {
            formattedValue = formatPercentage(value / 100)
          } else {
            formattedValue = formatLargeNumber(value)
          }

          if (this.series?.name) {
            return `<b>${this.series.name}</b><br/>${this.x || this.point?.name}: ${formattedValue}`
          }
          return `${this.x || this.point?.name}: ${formattedValue}`
        }
      },

      // Add formatter to Y-axis labels
      yAxis: {
        ...highchartsConfig.yAxis,
        labels: {
          ...highchartsConfig.yAxis?.labels,
          formatter: function(this: any): string {
            if (isCurrency) {
              return formatCurrency(this.value)
            } else if (isPercentage) {
              return formatPercentage(this.value / 100)
            } else {
              return formatLargeNumber(this.value)
            }
          }
        }
      }
    }

    return config
  }, [highchartsConfig])

  if (!highchartsConfig) {
    return (
      <div className="w-full h-full bg-surface flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-base font-medium">No chart configuration</p>
          <p className="text-sm">Waiting for AI to generate chart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 bg-white p-8 overflow-hidden">
        <HighchartsReact
          highcharts={Highcharts}
          options={responsiveChartConfig}
          immutable={false}
        />
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
