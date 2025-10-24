"use client"

import { BarChart3, LineChart, PieChart, AreaChart, ScanText as Scatter } from "lucide-react"

interface ChartTypeSelectorProps {
  selectedType: string
  onSelectType: (type: string) => void
}

const chartTypes = [
  { id: "bar", label: "Bar", icon: BarChart3 },
  { id: "line", label: "Line", icon: LineChart },
  { id: "pie", label: "Pie", icon: PieChart },
  { id: "area", label: "Area", icon: AreaChart },
  { id: "scatter", label: "Scatter", icon: Scatter },
]

export default function ChartTypeSelector({ selectedType, onSelectType }: ChartTypeSelectorProps) {
  return (
    <div className="w-24 bg-surface border-r border-border p-3 overflow-y-auto flex flex-col gap-2">
      {chartTypes.map((type) => {
        const Icon = type.icon
        return (
          <button
            key={type.id}
            onClick={() => onSelectType(type.id)}
            className={`w-full p-3 rounded-lg transition-all duration-200 flex flex-col items-center gap-1.5 ${
              selectedType === type.id
                ? "bg-accent text-white shadow-md scale-105"
                : "bg-background text-text-muted hover:bg-muted hover:text-text"
            }`}
            title={type.label}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span className="text-xs font-medium">{type.label}</span>
          </button>
        )
      })}
    </div>
  )
}
