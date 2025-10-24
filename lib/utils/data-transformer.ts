/**
 * Data transformation utilities for reshaping data into plot-ready format
 */

export interface UnpivotConfig {
  idColumns: string[]        // Columns to keep as-is (dimensions)
  valueColumns: string[]     // Columns to unpivot (contains values)
  newDimensionColumn: string // Name for new dimension column
  newMeasureColumn: string   // Name for new measure column
}

export interface TransformedData {
  columns: string[]
  rows: Record<string, any>[]
  transformation: {
    type: 'unpivot' | 'none'
    applied: boolean
    details?: string
  }
}

/**
 * Unpivot (melt) data from wide format to tall format
 *
 * Example:
 * Input:  { Product: 'A', Q1: 100, Q2: 150, Q3: 120 }
 * Output: [
 *   { Product: 'A', Quarter: 'Q1', Sales: 100 },
 *   { Product: 'A', Quarter: 'Q2', Sales: 150 },
 *   { Product: 'A', Quarter: 'Q3', Sales: 120 }
 * ]
 */
export function unpivotData(
  data: Record<string, any>[],
  config: UnpivotConfig
): Record<string, any>[] {
  const { idColumns, valueColumns, newDimensionColumn, newMeasureColumn } = config

  const result: Record<string, any>[] = []

  for (const row of data) {
    // For each value column, create a new row
    for (const valueCol of valueColumns) {
      const newRow: Record<string, any> = {}

      // Copy ID columns (dimensions to preserve)
      for (const idCol of idColumns) {
        newRow[idCol] = row[idCol]
      }

      // Add new dimension column (the variable name)
      newRow[newDimensionColumn] = valueCol

      // Add new measure column (the value)
      newRow[newMeasureColumn] = row[valueCol]

      result.push(newRow)
    }
  }

  return result
}

/**
 * Detect column data types based on values
 */
export function detectColumnType(
  values: any[]
): 'number' | 'date' | 'string' | 'boolean' {
  // Remove null/undefined
  const cleanValues = values.filter((v) => v !== null && v !== undefined)

  if (cleanValues.length === 0) return 'string'

  // Check if all values are numbers
  const allNumbers = cleanValues.every(
    (v) => typeof v === 'number' || (!isNaN(Number(v)) && v !== '')
  )
  if (allNumbers) return 'number'

  // Check if values look like dates
  const allDates = cleanValues.every((v) => {
    const dateStr = String(v)
    // Simple date pattern check
    return (
      /^\d{4}-\d{2}-\d{2}/.test(dateStr) || // ISO format
      /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(dateStr) || // MM/DD/YYYY
      !isNaN(Date.parse(dateStr)) // Valid date string
    )
  })
  if (allDates) return 'date'

  // Check if all values are booleans
  const allBooleans = cleanValues.every(
    (v) =>
      typeof v === 'boolean' ||
      v === 'true' ||
      v === 'false' ||
      v === 'TRUE' ||
      v === 'FALSE'
  )
  if (allBooleans) return 'boolean'

  return 'string'
}

/**
 * Classify column as dimension or measure based on data type and uniqueness
 */
export function classifyColumn(
  values: any[],
  columnName: string
): 'dimension' | 'measure' | 'temporal' | 'identifier' {
  const dataType = detectColumnType(values)
  const uniqueCount = new Set(values.filter((v) => v !== null && v !== undefined)).size
  const totalCount = values.length

  // Temporal columns
  if (
    dataType === 'date' ||
    /date|time|year|month|quarter|day|week/i.test(columnName)
  ) {
    return 'temporal'
  }

  // Identifier columns (high uniqueness, often IDs)
  if (
    /id|key|code|uuid|guid/i.test(columnName) &&
    uniqueCount / totalCount > 0.9
  ) {
    return 'identifier'
  }

  // Measure columns (numeric)
  if (dataType === 'number') {
    return 'measure'
  }

  // Dimension columns (categorical, strings)
  return 'dimension'
}

/**
 * Apply transformation based on recommendation from Data Transformer Agent
 */
export function applyTransformation(
  originalData: Record<string, any>[],
  originalColumns: string[],
  transformationRecommendation: any
): TransformedData {
  // If no transformation needed, return original
  if (!transformationRecommendation.needsTransformation) {
    return {
      columns: originalColumns,
      rows: originalData,
      transformation: {
        type: 'none',
        applied: false,
        details: 'No transformation needed - data is already in optimal format',
      },
    }
  }

  // Apply unpivot transformation
  if (transformationRecommendation.transformation?.type === 'unpivot') {
    const config = transformationRecommendation.transformation

    const unpivotedRows = unpivotData(originalData, {
      idColumns: config.idColumns || [],
      valueColumns: config.valueColumns || [],
      newDimensionColumn: config.newDimensionColumn || 'Variable',
      newMeasureColumn: config.newMeasureColumn || 'Value',
    })

    const newColumns = [
      ...(config.idColumns || []),
      config.newDimensionColumn || 'Variable',
      config.newMeasureColumn || 'Value',
    ]

    return {
      columns: newColumns,
      rows: unpivotedRows,
      transformation: {
        type: 'unpivot',
        applied: true,
        details: `Unpivoted ${config.valueColumns?.length || 0} columns into ${
          config.newDimensionColumn
        } and ${config.newMeasureColumn}. Original: ${originalData.length} rows → Transformed: ${unpivotedRows.length} rows.`,
      },
    }
  }

  // Default: return original if transformation type not recognized
  return {
    columns: originalColumns,
    rows: originalData,
    transformation: {
      type: 'none',
      applied: false,
      details: 'Transformation type not supported',
    },
  }
}

/**
 * Get column statistics for analysis
 */
export function getColumnStats(
  data: Record<string, any>[],
  columnName: string
): {
  type: string
  uniqueCount: number
  nullCount: number
  sampleValues: any[]
} {
  const values = data.map((row) => row[columnName])
  const nonNullValues = values.filter((v) => v !== null && v !== undefined)

  return {
    type: detectColumnType(values),
    uniqueCount: new Set(nonNullValues).size,
    nullCount: values.length - nonNullValues.length,
    sampleValues: nonNullValues.slice(0, 5),
  }
}
