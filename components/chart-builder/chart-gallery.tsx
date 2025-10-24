"use client"

import { Plus, LayoutGrid } from "lucide-react"
import ChartCard from "./chart-card"

interface Chart {
  id: string
  title: string
  type: string
  highchartsConfig: any
  createdAt: Date
  metadata?: any
}

interface ChartGalleryProps {
  charts: Chart[]
  selectedChartId: string | null
  onChartSelect: (id: string) => void
  onChartDuplicate: (id: string) => void
  onChartDelete: (id: string) => void
  onAddChart?: () => void
}

export default function ChartGallery({
  charts,
  selectedChartId,
  onChartSelect,
  onChartDuplicate,
  onChartDelete,
  onAddChart
}: ChartGalleryProps) {
  // Empty state
  if (charts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="text-center max-w-2xl w-full">
          {/* Large Single Chart Preview */}
          <div className="mb-8 mx-auto max-w-3xl">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 p-8 shadow-sm">
              {/* Mock Chart Visual */}
              <div className="bg-white rounded-xl p-6 shadow-inner">
                {/* Chart Title Area */}
                <div className="mb-4">
                  <div className="h-6 w-3/4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                </div>

                {/* Chart Bars Visualization */}
                <div className="flex items-end justify-around h-48 gap-4 mt-8">
                  <div className="w-full bg-gradient-to-t from-blue-400 to-blue-500 rounded-t-lg" style={{ height: '70%' }}></div>
                  <div className="w-full bg-gradient-to-t from-blue-400 to-blue-500 rounded-t-lg" style={{ height: '85%' }}></div>
                  <div className="w-full bg-gradient-to-t from-blue-400 to-blue-500 rounded-t-lg" style={{ height: '60%' }}></div>
                  <div className="w-full bg-gradient-to-t from-blue-400 to-blue-500 rounded-t-lg" style={{ height: '95%' }}></div>
                  <div className="w-full bg-gradient-to-t from-blue-400 to-blue-500 rounded-t-lg" style={{ height: '75%' }}></div>
                </div>

                {/* X-axis labels */}
                <div className="flex justify-around mt-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-2 w-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Simple Message */}
          <p className="text-lg text-gray-500">
            Upload data through chat to create professional charts
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Gallery Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Your Charts
            </h2>
            <p className="text-sm text-gray-500">
              {charts.length} {charts.length === 1 ? 'chart' : 'charts'} created
            </p>
          </div>
          {onAddChart && (
            <button
              onClick={onAddChart}
              className="px-4 py-2 bg-gradient-to-r from-accent to-primary text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Chart
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Gallery Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className={`grid gap-6 ${
          charts.length === 1
            ? 'grid-cols-1 max-w-4xl mx-auto'
            : 'grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3'
        }`}>
          {charts.map((chart) => (
            <ChartCard
              key={chart.id}
              chart={chart}
              isSelected={chart.id === selectedChartId}
              onClick={() => onChartSelect(chart.id)}
              onDuplicate={() => onChartDuplicate(chart.id)}
              onDelete={() => onChartDelete(chart.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
