"use client"

import { MoreVertical, Copy, Trash2, Download } from "lucide-react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import exportingModule from "highcharts/modules/exporting"
import offlineExportingModule from "highcharts/modules/offline-exporting"
import { useMemo, useRef, useState } from "react"

interface ChartCardProps {
  chart: {
    id: string
    title: string
    type: string
    highchartsConfig: any
    createdAt: Date
  }
  isSelected: boolean
  onClick: () => void
  onDuplicate: () => void
  onDelete: () => void
}

// Ensure exporting modules are initialized on the client before rendering charts
if (typeof window !== "undefined") {
  exportingModule(Highcharts)
  offlineExportingModule(Highcharts)
}

export default function ChartCard({
  chart,
  isSelected,
  onClick,
  onDuplicate,
  onDelete
}: ChartCardProps) {
  const chartRef = useRef<HighchartsReact.RefObject>(null)
  const [showActions, setShowActions] = useState(false)

  const baseConfig = useMemo(() => {
    if (typeof chart.highchartsConfig === "string") {
      try {
        return JSON.parse(chart.highchartsConfig)
      } catch (error) {
        console.error("Failed to parse Highcharts config string", error)
        return {}
      }
    }
    return chart.highchartsConfig || {}
  }, [chart.highchartsConfig])

  const previewOptions = useMemo(() => {
    const config = typeof chart.highchartsConfig === "string"
      ? (() => {
          try {
            return JSON.parse(chart.highchartsConfig)
          } catch (error) {
            console.error("Failed to parse Highcharts config string", error)
            return {}
          }
        })()
      : chart.highchartsConfig || {}

    return {
      ...config,
      chart: {
        ...config.chart,
        height: null,
        animation: false
      },
      credits: {
        enabled: false,
        ...(config.credits || {})
      },
      exporting: {
        ...(config.exporting || {}),
        enabled: true,
        fallbackToExportServer: false,
        buttons: {
          ...(config.exporting?.buttons || {}),
          contextButton: {
            ...(config.exporting?.buttons?.contextButton || {}),
            enabled: false
          }
        }
      }
    }
  }, [chart.highchartsConfig])

  const handleExport = () => {
    const chartInstance = chartRef.current?.chart
    if (!chartInstance) {
      console.warn("Highcharts instance not available for export.")
      return
    }

    if (typeof chartInstance.exportChartLocal === "function") {
      chartInstance.exportChartLocal({ type: "image/png" })
    } else if (typeof chartInstance.exportChart === "function") {
      chartInstance.exportChart({ type: "image/png" }, undefined, undefined, {
        fallbackToExportServer: false
      })
    } else {
      console.warn("Highcharts export module is not available on this chart instance.")
    }
  }

  return (
    <div
      onClick={onClick}
      className={`relative group bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
        isSelected
          ? 'border-accent shadow-md ring-2 ring-accent/20'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Card Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 truncate">
            {chart.title || 'Untitled Chart'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {chart.type.charAt(0).toUpperCase() + chart.type.slice(1)} • {new Date(chart.createdAt).toLocaleTimeString()}
          </p>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowActions(!showActions)
            }}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>

          {showActions && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowActions(false)
                }}
              />

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicate()
                    setShowActions(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicate
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExport()
                    setShowActions(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export PNG
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                    setShowActions(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart Preview */}
      <div className="p-4 bg-gray-50">
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          {/* Responsive aspect ratio container: 16:10 for professional charts */}
          <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
            <HighchartsReact
              highcharts={Highcharts}
              options={previewOptions}
              ref={chartRef}
              containerProps={{ className: 'w-full h-full' }}
            />
          </div>
        </div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
        </div>
      )}
    </div>
  )
}
