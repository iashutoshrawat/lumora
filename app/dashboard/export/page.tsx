"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Sidebar from "@/components/dashboard/sidebar"

export default function ExportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [exportFormat, setExportFormat] = useState("png")
  const [highRes, setHighRes] = useState(false)
  const [watermark, setWatermark] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    // Mock export
    setTimeout(() => {
      alert(`Chart exported as ${exportFormat.toUpperCase()}!`)
      setExporting(false)
    }, 1500)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-surface border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-primary">Export Chart</h1>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-surface border border-gray-200 p-8">
              <div className="space-y-6">
                {/* Format Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-text mb-4">Export Format</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {["png", "svg", "pdf", "pptx"].map((format) => (
                      <button
                        key={format}
                        onClick={() => setExportFormat(format)}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          exportFormat === format ? "border-accent bg-accent/5" : "border-gray-300 hover:border-accent"
                        }`}
                      >
                        <div className="font-semibold text-text">{format.toUpperCase()}</div>
                        <div className="text-sm text-text-muted">
                          {format === "png" && "Raster image"}
                          {format === "svg" && "Vector graphic"}
                          {format === "pdf" && "Document"}
                          {format === "pptx" && "PowerPoint slide"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-text">Options</h3>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={highRes}
                      onChange={(e) => setHighRes(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-text">High Resolution (300 DPI)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={watermark}
                      onChange={(e) => setWatermark(e.target.checked)}
                      disabled
                      className="w-4 h-4"
                    />
                    <span className="text-text-muted">Add Watermark (Pro only)</span>
                  </label>
                </div>

                {/* Preview */}
                <div>
                  <h3 className="text-lg font-semibold text-text mb-4">Preview</h3>
                  <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <img
                      src="/chart-preview.png"
                      alt="Chart preview"
                      className="w-full max-w-md mx-auto rounded"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex-1 bg-accent hover:bg-accent/90 text-white py-3 rounded-lg font-medium"
                  >
                    {exporting ? "Exporting..." : "Download"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-primary text-primary hover:bg-primary/5 py-3 rounded-lg font-medium bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
