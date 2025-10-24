"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Upload, FileSpreadsheet, FileJson, File, Check } from "lucide-react"
import LoadingSpinner from "@/components/ui/loading-spinner"

interface DataUploaderProps {
  onUpload: (data: any) => void
}

export default function DataUploader({ onUpload }: DataUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState("")

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  const processFile = async (file: File) => {
    setLoading(true)
    setFileName(file.name)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    try {
      // Import parser dynamically
      const { parseFile } = await import('@/lib/utils/file-parser')

      // Parse the actual file
      const result = await parseFile(file)

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success && result.data) {
        // Successfully parsed file
        console.log('✅ File parsed successfully:', {
          columns: result.data.columns,
          rowCount: result.data.rows.length
        })

        onUpload(result.data)

        setTimeout(() => {
          setLoading(false)
          setProgress(0)
        }, 500)
      } else {
        // Parsing failed
        clearInterval(progressInterval)
        setLoading(false)
        setProgress(0)
        alert(`Failed to parse file: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      clearInterval(progressInterval)
      setLoading(false)
      setProgress(0)
      console.error('File processing error:', error)
      alert(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.csv') || filename.endsWith('.xlsx')) {
      return <FileSpreadsheet className="w-5 h-5" />
    } else if (filename.endsWith('.json')) {
      return <FileJson className="w-5 h-5" />
    }
    return <File className="w-5 h-5" />
  }

  return (
    <Card
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 ${
        isDragging
          ? "border-accent bg-accent/10 scale-[1.02] shadow-lg"
          : "border-border bg-surface hover:border-accent/50 hover:bg-accent/5"
      }`}
    >
      {loading ? (
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center shadow-lg">
              {progress === 100 ? (
                <Check className="w-8 h-8 text-white" />
              ) : (
                <FileSpreadsheet className="w-8 h-8 text-white animate-pulse" />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              {getFileIcon(fileName)}
              <p className="text-sm font-medium text-foreground">{fileName}</p>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {progress === 100 ? "Processing complete!" : "Processing your file..."}
            </p>

            {/* Progress Bar */}
            <div className="max-w-xs mx-auto">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className={`w-20 h-20 mx-auto bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl flex items-center justify-center mb-4 transition-transform ${
              isDragging ? "scale-110" : ""
            }`}>
              <Upload className={`w-10 h-10 text-accent transition-transform ${
                isDragging ? "animate-bounce" : ""
              }`} />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {isDragging ? "Drop your file here" : "Drag and drop your file"}
            </h3>
            <p className="text-muted-foreground mb-6">or click to browse files</p>

            {/* Supported formats */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border border-border">
                <FileSpreadsheet className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium text-muted-foreground">CSV, Excel</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border border-border">
                <FileJson className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium text-muted-foreground">JSON</span>
              </div>
            </div>
          </div>

          <input
            type="file"
            id="file-input"
            onChange={handleFileSelect}
            accept=".csv,.xlsx,.xls,.json"
            className="hidden"
          />

          <label htmlFor="file-input">
            <button
              type="button"
              onClick={() => document.getElementById("file-input")?.click()}
              className="bg-gradient-to-r from-accent to-primary hover:opacity-90 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
              disabled={loading}
            >
              <Upload className="w-4 h-4" />
              Select File
            </button>
          </label>
        </>
      )}
    </Card>
  )
}
