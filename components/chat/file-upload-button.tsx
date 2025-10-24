"use client"

import { useState, useRef } from "react"
import { Paperclip, Loader2 } from "lucide-react"
import * as XLSX from 'xlsx'

interface FileUploadButtonProps {
  onFileUpload: (data: { columns: string[]; rows: any[] }, fileName: string) => void
  disabled?: boolean
}

export default function FileUploadButton({ onFileUpload, disabled }: FileUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()

      let parsedData: { columns: string[]; rows: any[] } | null = null

      if (fileExtension === 'csv') {
        // Parse CSV
        const text = await file.text()
        const lines = text.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          const row: any = {}
          headers.forEach((header, index) => {
            const value = values[index]
            // Try to parse as number
            const numValue = parseFloat(value)
            row[header] = isNaN(numValue) ? value : numValue
          })
          return row
        })

        parsedData = { columns: headers, rows }
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet)

        if (jsonData.length > 0) {
          const columns = Object.keys(jsonData[0])
          parsedData = { columns, rows: jsonData }
        }
      } else if (fileExtension === 'json') {
        // Parse JSON
        const text = await file.text()
        const jsonData = JSON.parse(text)

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          const columns = Object.keys(jsonData[0])
          parsedData = { columns, rows: jsonData }
        }
      }

      if (parsedData && parsedData.rows.length > 0) {
        onFileUpload(parsedData, file.name)
      } else {
        alert('No data found in file or unsupported format')
      }
    } catch (error) {
      console.error('File upload error:', error)
      alert('Failed to parse file: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsUploading(false)
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.json"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="p-2.5 text-gray-500 hover:text-accent hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Upload data file (CSV, Excel, JSON)"
      >
        {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
      </button>
    </>
  )
}
