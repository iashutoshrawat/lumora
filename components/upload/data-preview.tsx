"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"

interface DataPreviewProps {
  data: any
}

export default function DataPreview({ data }: DataPreviewProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 5

  if (!data || !data.rows) return null

  const totalPages = Math.ceil(data.rows.length / itemsPerPage)
  const startIdx = currentPage * itemsPerPage
  const displayedRows = data.rows.slice(startIdx, startIdx + itemsPerPage)

  return (
    <Card className="mt-6 bg-surface border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-text">Data Preview</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {data.columns.map((col: string) => (
                <th key={col} className="px-4 py-2 text-left font-medium text-text">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((row: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                {data.columns.map((col: string) => (
                  <td key={col} className="px-4 py-2 text-text-muted">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-200 flex justify-between items-center">
        <span className="text-sm text-text-muted">
          Page {currentPage + 1} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            ← Prev
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </Card>
  )
}
