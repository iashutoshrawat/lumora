import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParsedData {
  columns: string[]
  rows: Record<string, any>[]
}

export interface ParseResult {
  success: boolean
  data?: ParsedData
  error?: string
}

/**
 * Parse CSV file using Papa Parse
 */
function parseCSV(content: string): ParseResult {
  try {
    const result = Papa.parse(content, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    })

    if (result.errors.length > 0) {
      return {
        success: false,
        error: `CSV parsing error: ${result.errors[0].message}`,
      }
    }

    const rows = result.data as Record<string, any>[]
    if (rows.length === 0) {
      return {
        success: false,
        error: 'CSV file is empty',
      }
    }

    const columns = Object.keys(rows[0])
    if (columns.length === 0) {
      return {
        success: false,
        error: 'No columns found in CSV file',
      }
    }

    return {
      success: true,
      data: { columns, rows },
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Parse Excel file (.xlsx, .xls) using xlsx library
 */
function parseExcel(arrayBuffer: ArrayBuffer): ParseResult {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // Get first sheet
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      return {
        success: false,
        error: 'Excel file has no sheets',
      }
    }

    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
    }) as any[][]

    if (jsonData.length === 0) {
      return {
        success: false,
        error: 'Excel sheet is empty',
      }
    }

    // First row is headers
    const columns = jsonData[0].map((col: any) => String(col || '').trim()).filter(Boolean)
    if (columns.length === 0) {
      return {
        success: false,
        error: 'No columns found in Excel file',
      }
    }

    // Convert remaining rows to objects
    const rows = jsonData.slice(1).map((row) => {
      const obj: Record<string, any> = {}
      columns.forEach((col, index) => {
        obj[col] = row[index] !== null && row[index] !== undefined ? row[index] : null
      })
      return obj
    }).filter((row) => {
      // Filter out completely empty rows
      return Object.values(row).some((val) => val !== null && val !== '')
    })

    if (rows.length === 0) {
      return {
        success: false,
        error: 'No data rows found in Excel file',
      }
    }

    return {
      success: true,
      data: { columns, rows },
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse Excel: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Parse JSON file
 */
function parseJSON(content: string): ParseResult {
  try {
    const parsed = JSON.parse(content)

    // Support array of objects
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        return {
          success: false,
          error: 'JSON array is empty',
        }
      }

      const columns = Object.keys(parsed[0])
      if (columns.length === 0) {
        return {
          success: false,
          error: 'No columns found in JSON data',
        }
      }

      return {
        success: true,
        data: { columns, rows: parsed },
      }
    }

    // Support object with columns and rows
    if (parsed.columns && parsed.rows) {
      return {
        success: true,
        data: {
          columns: parsed.columns,
          rows: parsed.rows,
        },
      }
    }

    return {
      success: false,
      error: 'JSON must be an array of objects or have "columns" and "rows" properties',
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Main file parser that detects file type and parses accordingly
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const fileName = file.name.toLowerCase()

  try {
    // CSV files
    if (fileName.endsWith('.csv')) {
      const text = await file.text()
      return parseCSV(text)
    }

    // Excel files
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const arrayBuffer = await file.arrayBuffer()
      return parseExcel(arrayBuffer)
    }

    // JSON files
    if (fileName.endsWith('.json')) {
      const text = await file.text()
      return parseJSON(text)
    }

    return {
      success: false,
      error: `Unsupported file format: ${fileName.split('.').pop()}. Please upload CSV, Excel, or JSON files.`,
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
