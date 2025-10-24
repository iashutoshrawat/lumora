// Chart Specification Parser
// Extracts structured specifications from multi-agent analysis outputs

export interface ChartSpecification {
  chartType: string
  variant?: string
  colors: {
    palette: string // 'mckinsey' | 'bcg' | 'bain' | 'banking'
    primary: string[]
    accents: {
      positive: string
      negative: string
      warning: string
      neutral: string
    }
    grays: string[]
  }
  typography: {
    slideTitle: { size: number; weight: number; color: string }
    chartTitle: { size: number; weight: number; color: string }
    axisLabels: { size: number; weight: number; color: string }
    dataLabels: { size: number; weight: number; color: string }
    annotations: { size: number; weight: number; color: string }
    footnotes: { size: number; weight: number; color: string }
  }
  spacing: {
    margins: { top: number; right: number; bottom: number; left: number }
    padding: number
    barWidth: number // percentage (60-70%)
    barGap: number // pixels
  }
  dataLabels: {
    show: boolean
    position: 'top' | 'inside' | 'center' | 'end'
    format: string // e.g., "$0.0a" for abbreviated currency
    fontSize: number
    fontWeight: number
  }
  axes: {
    xAxis: {
      show: boolean
      label: string
      fontSize: number
      tickSize: number
      grid: boolean
    }
    yAxis: {
      show: boolean
      label: string
      fontSize: number
      tickSize: number
      grid: boolean
      startAtZero: boolean
    }
    gridStyle: {
      color: string
      opacity: number
      strokeWidth: number
      strokeDasharray: string
    }
  }
  referenceLines: Array<{
    value: number | string
    label: string
    axis: 'x' | 'y'
    color: string
    strokeWidth: number
    strokeDasharray: string
  }>
  annotations: Array<{
    text: string
    x?: number
    y?: number
    position: string
    fontSize: number
    color: string
  }>
  legend: {
    show: boolean
    position: 'top' | 'bottom' | 'left' | 'right' | 'top-right'
    align: 'left' | 'center' | 'right'
    fontSize: number
    wrapperStyle?: Record<string, any>
  }
  export: {
    format: 'png' | 'svg' | 'pdf'
    dpi: number
    dimensions: { width: number; height: number }
  }
}

// Consulting color palettes
const CONSULTING_PALETTES = {
  mckinsey: {
    primary: ['#004B87', '#0066B3', '#003366', '#0FA3B1', '#7209B7'],
    accents: {
      positive: '#00A859',
      negative: '#E63946',
      warning: '#F77F00',
      neutral: '#737373'
    },
    grays: ['#2C2C2C', '#4A4A4A', '#737373', '#A6A6A6', '#D9D9D9', '#F2F2F2']
  },
  bcg: {
    primary: ['#0033A0', '#0047BB', '#001F5C', '#00B140', '#00D084'],
    accents: {
      positive: '#00B140',
      negative: '#D32F2F',
      warning: '#FF9800',
      neutral: '#616161'
    },
    grays: ['#212121', '#424242', '#616161', '#9E9E9E', '#E0E0E0', '#F5F5F5']
  },
  bain: {
    primary: ['#C8102E', '#E63946', '#A01020', '#0FA3B1', '#3A86FF'],
    accents: {
      positive: '#38B000',
      negative: '#C8102E',
      warning: '#FF6B35',
      neutral: '#6C757D'
    },
    grays: ['#1C1C1C', '#3A3A3A', '#6C757D', '#ADB5BD', '#DEE2E6', '#F8F9FA']
  },
  banking: {
    primary: ['#1C2833', '#2E4053', '#34495E', '#27AE60', '#3498DB'],
    accents: {
      positive: '#27AE60',
      negative: '#CB4335',
      warning: '#F39C12',
      neutral: '#7F8C8D'
    },
    grays: ['#0B0C10', '#1F2833', '#566573', '#95A5A6', '#BDC3C7', '#ECF0F1']
  }
}

/**
 * Parse agent recommendations and extract structured chart specifications
 */
export function parseChartSpecifications(agentResults: any): ChartSpecification {
  const vizOutput = agentResults?.agents?.vizStrategist?.output || ''
  const designOutput = agentResults?.agents?.designConsultant?.output || ''
  const chartAnalystOutput = agentResults?.agents?.chartAnalyst?.output || ''

  // Extract chart type
  const chartType = extractChartType(vizOutput, chartAnalystOutput)

  // Extract color palette (detect which consulting firm style)
  const palette = extractColorPalette(designOutput)

  // Extract typography specifications
  const typography = extractTypography(designOutput)

  // Extract spacing specifications
  const spacing = extractSpacing(designOutput)

  // Extract data label configuration
  const dataLabels = extractDataLabels(vizOutput, designOutput)

  // Extract axes configuration
  const axes = extractAxes(vizOutput, designOutput)

  // Extract reference lines
  const referenceLines = extractReferenceLines(vizOutput)

  // Extract annotations
  const annotations = extractAnnotations(vizOutput)

  // Extract legend configuration
  const legend = extractLegend(vizOutput, designOutput)

  // Extract export specifications
  const exportSpec = extractExportSpec(vizOutput)

  return {
    chartType: chartType.type,
    variant: chartType.variant,
    colors: palette,
    typography,
    spacing,
    dataLabels,
    axes,
    referenceLines,
    annotations,
    legend,
    export: exportSpec
  }
}

function extractChartType(vizOutput: string, chartAnalystOutput: string): { type: string; variant?: string } {
  const combined = `${vizOutput} ${chartAnalystOutput}`.toLowerCase()

  // Try to extract from JSON blocks first
  const jsonMatch = combined.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    try {
      const json = JSON.parse(jsonMatch[1])
      if (json.chartType) {
        return { type: json.chartType, variant: json.variant }
      }
      if (json.recommendedCharts && json.recommendedCharts[0]) {
        return { type: json.recommendedCharts[0].type, variant: json.recommendedCharts[0].variant }
      }
    } catch (e) {
      // Continue to text matching
    }
  }

  // Text-based matching
  if (combined.includes('waterfall')) return { type: 'waterfall' }
  if (combined.includes('combo') || combined.includes('combination')) return { type: 'combo' }
  if (combined.includes('stacked bar') || combined.includes('stacked column')) {
    return { type: 'bar', variant: 'stacked' }
  }
  if (combined.includes('grouped bar') || combined.includes('clustered')) {
    return { type: 'bar', variant: 'grouped' }
  }
  if (combined.includes('bar chart') || combined.includes('bar graph')) return { type: 'bar' }
  if (combined.includes('column chart')) return { type: 'bar' }
  if (combined.includes('line chart') || combined.includes('line graph')) return { type: 'line' }
  if (combined.includes('area chart')) return { type: 'area' }
  if (combined.includes('scatter') || combined.includes('scatterplot')) return { type: 'scatter' }
  if (combined.includes('pie chart')) return { type: 'pie' }
  if (combined.includes('donut')) return { type: 'donut' }

  // Default to bar chart
  return { type: 'bar' }
}

function extractColorPalette(designOutput: string): ChartSpecification['colors'] {
  const output = designOutput.toLowerCase()

  // Detect which consulting firm palette
  let paletteName: keyof typeof CONSULTING_PALETTES = 'mckinsey' // default

  if (output.includes('bcg') || output.includes('#0033a0')) {
    paletteName = 'bcg'
  } else if (output.includes('bain') || output.includes('#c8102e')) {
    paletteName = 'bain'
  } else if (output.includes('banking') || output.includes('investment bank') || output.includes('#1c2833')) {
    paletteName = 'banking'
  } else if (output.includes('mckinsey') || output.includes('#004b87')) {
    paletteName = 'mckinsey'
  }

  const palette = CONSULTING_PALETTES[paletteName]

  return {
    palette: paletteName,
    primary: palette.primary,
    accents: palette.accents,
    grays: palette.grays
  }
}

function extractTypography(designOutput: string): ChartSpecification['typography'] {
  // Default consulting-grade typography
  const defaults = {
    slideTitle: { size: 28, weight: 700, color: '#2C2C2C' },
    chartTitle: { size: 20, weight: 600, color: '#2C2C2C' },
    axisLabels: { size: 12, weight: 500, color: '#4A4A4A' },
    dataLabels: { size: 11, weight: 500, color: '#2C2C2C' },
    annotations: { size: 10, weight: 400, color: '#4A4A4A' },
    footnotes: { size: 9, weight: 400, color: '#737373' }
  }

  // Try to extract specific values from output
  const extractSize = (pattern: RegExp) => {
    const match = designOutput.match(pattern)
    return match ? parseInt(match[1]) : null
  }

  const titleSize = extractSize(/slide title.*?(\d+)pt/i) || extractSize(/title.*?(\d+)pt/i)
  const chartTitleSize = extractSize(/chart title.*?(\d+)pt/i)
  const axisSize = extractSize(/axis.*?label.*?(\d+)pt/i)
  const dataLabelSize = extractSize(/data label.*?(\d+)pt/i)

  return {
    slideTitle: { ...defaults.slideTitle, size: titleSize || defaults.slideTitle.size },
    chartTitle: { ...defaults.chartTitle, size: chartTitleSize || defaults.chartTitle.size },
    axisLabels: { ...defaults.axisLabels, size: axisSize || defaults.axisLabels.size },
    dataLabels: { ...defaults.dataLabels, size: dataLabelSize || defaults.dataLabels.size },
    annotations: defaults.annotations,
    footnotes: defaults.footnotes
  }
}

function extractSpacing(designOutput: string): ChartSpecification['spacing'] {
  return {
    margins: { top: 60, right: 80, bottom: 80, left: 80 },
    padding: 20,
    barWidth: 65, // percentage
    barGap: 8
  }
}

function extractDataLabels(vizOutput: string, designOutput: string): ChartSpecification['dataLabels'] {
  const combined = `${vizOutput} ${designOutput}`.toLowerCase()

  // Check if data labels should be shown
  const show = combined.includes('show data label') ||
                combined.includes('label all') ||
                combined.includes('display values') ||
                !combined.includes('no data label')

  // Determine position
  let position: 'top' | 'inside' | 'center' | 'end' = 'top'
  if (combined.includes('inside')) position = 'inside'
  if (combined.includes('center')) position = 'center'
  if (combined.includes('end')) position = 'end'

  return {
    show,
    position,
    format: '$0.0a', // abbreviated format (e.g., $4.5M)
    fontSize: 11,
    fontWeight: 500
  }
}

function extractAxes(vizOutput: string, designOutput: string): ChartSpecification['axes'] {
  return {
    xAxis: {
      show: true,
      label: '',
      fontSize: 12,
      tickSize: 10,
      grid: false
    },
    yAxis: {
      show: true,
      label: '',
      fontSize: 12,
      tickSize: 10,
      grid: true,
      startAtZero: true
    },
    gridStyle: {
      color: '#E5E5E5',
      opacity: 0.6,
      strokeWidth: 1,
      strokeDasharray: '3 3'
    }
  }
}

function extractReferenceLines(vizOutput: string): ChartSpecification['referenceLines'] {
  const lines: ChartSpecification['referenceLines'] = []

  // Look for mentions of target, average, threshold, etc.
  const output = vizOutput.toLowerCase()

  if (output.includes('target line') || output.includes('target:')) {
    lines.push({
      value: 0, // Will be set dynamically
      label: 'Target',
      axis: 'y',
      color: '#737373',
      strokeWidth: 1.5,
      strokeDasharray: '5 5'
    })
  }

  if (output.includes('average line') || output.includes('avg:')) {
    lines.push({
      value: 0, // Will be set dynamically
      label: 'Average',
      axis: 'y',
      color: '#4A4A4A',
      strokeWidth: 1.5,
      strokeDasharray: '5 5'
    })
  }

  return lines
}

function extractAnnotations(vizOutput: string): ChartSpecification['annotations'] {
  const annotations: ChartSpecification['annotations'] = []

  // Try to extract annotations from structured format
  const annotationPattern = /annotation.*?["']([^"']+)["']/gi
  let match

  while ((match = annotationPattern.exec(vizOutput)) !== null) {
    annotations.push({
      text: match[1],
      position: 'top',
      fontSize: 10,
      color: '#4A4A4A'
    })
  }

  return annotations
}

function extractLegend(vizOutput: string, designOutput: string): ChartSpecification['legend'] {
  const combined = `${vizOutput} ${designOutput}`.toLowerCase()

  const show = !combined.includes('no legend') && !combined.includes('direct label')

  let position: 'top' | 'bottom' | 'left' | 'right' | 'top-right' = 'top-right'
  if (combined.includes('legend bottom') || combined.includes('bottom legend')) position = 'bottom'
  if (combined.includes('legend top') || combined.includes('top legend')) position = 'top'

  return {
    show,
    position,
    align: 'right',
    fontSize: 11,
    wrapperStyle: { paddingTop: 10 }
  }
}

function extractExportSpec(vizOutput: string): ChartSpecification['export'] {
  const output = vizOutput.toLowerCase()

  // Detect aspect ratio (16:9 vs 4:3)
  const is16x9 = output.includes('16:9') || !output.includes('4:3')

  return {
    format: 'png',
    dpi: 300, // Print quality
    dimensions: is16x9
      ? { width: 1600, height: 800 }
      : { width: 1200, height: 900 }
  }
}

/**
 * Helper to get specific color from palette
 */
export function getPaletteColor(spec: ChartSpecification, index: number): string {
  return spec.colors.primary[index % spec.colors.primary.length]
}

/**
 * Helper to format values according to spec
 */
export function formatValue(value: any, format: string): string {
  // Handle non-numeric values
  if (value === null || value === undefined) {
    return ''
  }

  // Convert to number if it's a string number
  const numValue = typeof value === 'number' ? value : parseFloat(value)

  // If not a valid number, return as string
  if (isNaN(numValue)) {
    return String(value)
  }

  if (format === '$0.0a') {
    // Abbreviated currency format
    if (numValue >= 1_000_000_000) {
      return `$${(numValue / 1_000_000_000).toFixed(1)}B`
    } else if (numValue >= 1_000_000) {
      return `$${(numValue / 1_000_000).toFixed(1)}M`
    } else if (numValue >= 1_000) {
      return `$${(numValue / 1_000).toFixed(1)}K`
    } else {
      return `$${numValue.toFixed(0)}`
    }
  }

  // Add more format patterns as needed
  return numValue.toString()
}
