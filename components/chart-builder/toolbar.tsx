"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { RotateCcw, RotateCw, Save, Download } from "lucide-react"

interface ToolbarProps {
  chartType: string
}

export default function Toolbar({ chartType }: ToolbarProps) {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-surface border-b border-border px-6 py-4 flex justify-between items-center shadow-sm">
      <h1 className="text-2xl font-bold text-primary">Chart Builder</h1>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="border-border text-text hover:bg-muted bg-background flex items-center gap-2"
          title="Undo"
        >
          <RotateCcw size={16} />
          Undo
        </Button>
        <Button
          variant="outline"
          className="border-border text-text hover:bg-muted bg-background flex items-center gap-2"
          title="Redo"
        >
          <RotateCw size={16} />
          Redo
        </Button>
        <Button
          onClick={handleSave}
          className={`flex items-center gap-2 transition-all ${
            saved ? "bg-green-500 hover:bg-green-600" : "bg-primary hover:bg-primary/90"
          } text-white shadow-md hover:shadow-lg`}
        >
          <Save size={16} />
          {saved ? "Saved" : "Save"}
        </Button>
        <Link href="/dashboard/export">
          <Button className="bg-accent hover:bg-accent/90 text-white flex items-center gap-2 shadow-md hover:shadow-lg">
            <Download size={16} />
            Export
          </Button>
        </Link>
      </div>
    </div>
  )
}
