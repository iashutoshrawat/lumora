"use client"

import { Settings } from "lucide-react"

interface PropertiesPanelProps {
  config: any
  onConfigChange: (config: any) => void
}

export default function PropertiesPanel({ config, onConfigChange }: PropertiesPanelProps) {
  const handleColorChange = (index: number, color: string) => {
    const newColors = [...config.colors]
    newColors[index] = color
    onConfigChange({ ...config, colors: newColors })
  }

  return (
    <div className="w-72 bg-surface border-l border-border p-5 overflow-y-auto shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Settings size={18} className="text-accent" />
        <h3 className="font-semibold text-text text-lg">Properties</h3>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-text mb-2">Chart Title</label>
          <input
            type="text"
            placeholder="Enter chart title"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background transition-all"
          />
        </div>

        <div className="border-t border-border pt-4">
          <label className="block text-sm font-medium text-text mb-3">Colors</label>
          <div className="space-y-2.5">
            {config.colors.map((color: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(idx, e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-border hover:shadow-md transition-shadow"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(idx, e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <label className="block text-sm font-medium text-text mb-2">Legend Position</label>
          <select className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background transition-all">
            <option>Top</option>
            <option>Bottom</option>
            <option>Left</option>
            <option>Right</option>
          </select>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-accent" />
            <span className="text-sm font-medium text-text">Show Grid</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-accent" />
            <span className="text-sm font-medium text-text">Show Tooltip</span>
          </label>
        </div>
      </div>
    </div>
  )
}
