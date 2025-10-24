import type { ChartSpecification } from './chart-plan'

type LegendLayout = 'horizontal' | 'vertical'

type LegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'top-right'

export interface VizStrategySpec {
  staticElements: {
    dataLabels: {
      show: 'all' | 'none' | 'selective'
      format?: string
      positions?: Array<Record<string, unknown>>
      position?: string
      fontSize?: number
      fontWeight?: number
    }
    referenceLines: Array<Record<string, unknown>>
    annotations: Array<Record<string, unknown>>
    legend: {
      show: boolean
      position: LegendPosition
    }
  }
  powerpoint: {
    exportDPI: number
    chartDimensions: {
      width: number
      height: number
    }
  }
}

export interface DesignSpec {
  palette: {
    name: string
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
    fontFamily: string
    chartTitle: TypographySpec
    axisLabels: TypographySpec
    dataLabels: TypographySpec
    legendText: TypographySpec
    annotations: TypographySpec
  }
  spacing: {
    margins: MarginSpec
    lineWeight: {
      primary: number
      secondary: number
    }
    markerSize: {
      standard: number
      emphasis: number
    }
    barWidth: number
    barGap: number
  }
  elements: {
    axes: {
      lineWeight: number
      lineColor: string
      tickLength: number
    }
    gridLines: {
      weight: number
      color: string
      opacity: number
      style: 'solid' | 'dashed' | 'dotted'
    }
    dataLabels: {
      fontSize: number
      fontWeight: number
      color: string
      offsetY: number
    }
    legend: {
      align: 'left' | 'center' | 'right'
      verticalAlign: 'top' | 'middle' | 'bottom'
      layout?: LegendLayout
    }
    calloutBox: {
      background: string
      border: string
      borderRadius: number
      padding: number
    }
  }
  backgroundColor: string
}

interface TypographySpec {
  size: number
  weight: number
  color: string
  lineHeight: number
}

interface MarginSpec {
  top: number
  right: number
  bottom: number
  left: number
}

export function deriveVizStrategyFromChartSpec(
  chartSpec: ChartSpecification | null,
  defaultVizStrategy: VizStrategySpec
): VizStrategySpec {
  const strategy = deepClone(defaultVizStrategy)

  if (!chartSpec) {
    return strategy
  }

  const showSetting: VizStrategySpec['staticElements']['dataLabels']['show'] =
    chartSpec.dataLabels?.show === false ? 'none' : 'all'

  strategy.staticElements.dataLabels.show = showSetting
  if (chartSpec.dataLabels?.format) {
    strategy.staticElements.dataLabels.format = chartSpec.dataLabels.format
  }
  if (chartSpec.dataLabels?.fontSize) {
    strategy.staticElements.dataLabels.fontSize = chartSpec.dataLabels.fontSize
  }
  if (chartSpec.dataLabels?.fontWeight) {
    strategy.staticElements.dataLabels.fontWeight = chartSpec.dataLabels.fontWeight
  }
  if (chartSpec.dataLabels?.position) {
    strategy.staticElements.dataLabels.position = chartSpec.dataLabels.position
  }

  strategy.staticElements.referenceLines = chartSpec.referenceLines || []
  strategy.staticElements.annotations = chartSpec.annotations || []

  if (chartSpec.legend) {
    strategy.staticElements.legend = {
      show: chartSpec.legend.show !== false,
      position: (chartSpec.legend.position as LegendPosition) || 'top'
    }
  }

  strategy.powerpoint = {
    exportDPI: chartSpec.export?.dpi || defaultVizStrategy.powerpoint.exportDPI,
    chartDimensions: chartSpec.export?.dimensions || defaultVizStrategy.powerpoint.chartDimensions
  }

  return strategy
}

export function deriveDesignFromChartSpec(
  chartSpec: ChartSpecification | null,
  defaultDesign: DesignSpec
): DesignSpec {
  const design = deepClone(defaultDesign)

  if (!chartSpec) {
    return design
  }

  if (chartSpec.colors) {
    design.palette.name = chartSpec.colors.palette || design.palette.name
    if (Array.isArray(chartSpec.colors.primary) && chartSpec.colors.primary.length > 0) {
      design.palette.primary = chartSpec.colors.primary
    }
    design.palette.accents = {
      ...design.palette.accents,
      ...(chartSpec.colors.accents ?? {}),
    }
    if (Array.isArray(chartSpec.colors.grays) && chartSpec.colors.grays.length > 0) {
      design.palette.grays = chartSpec.colors.grays
    }
  }

  if (chartSpec.typography) {
    design.typography.chartTitle = mergeTypography(design.typography.chartTitle, chartSpec.typography.chartTitle)
    design.typography.axisLabels = mergeTypography(design.typography.axisLabels, chartSpec.typography.axisLabels)
    design.typography.dataLabels = mergeTypography(design.typography.dataLabels, chartSpec.typography.dataLabels)
    design.typography.legendText = mergeTypography(design.typography.legendText, chartSpec.typography.legendText)
    design.typography.annotations = mergeTypography(design.typography.annotations, chartSpec.typography.annotations)
  }

  if (chartSpec.spacing) {
    if (chartSpec.spacing.margins) {
      design.spacing.margins = {
        ...design.spacing.margins,
        ...chartSpec.spacing.margins,
      }
    }
    if (typeof chartSpec.spacing.barWidth === 'number') {
      design.spacing.barWidth = chartSpec.spacing.barWidth
    }
    if (typeof chartSpec.spacing.barGap === 'number') {
      design.spacing.barGap = chartSpec.spacing.barGap
    }
  }

  if (chartSpec.axes?.gridStyle) {
    design.elements.gridLines.color = chartSpec.axes.gridStyle.color || design.elements.gridLines.color
    if (typeof chartSpec.axes.gridStyle.opacity === 'number') {
      design.elements.gridLines.opacity = chartSpec.axes.gridStyle.opacity
    }
    if (typeof chartSpec.axes.gridStyle.strokeWidth === 'number') {
      design.elements.gridLines.weight = chartSpec.axes.gridStyle.strokeWidth
    }
    if (chartSpec.axes.gridStyle.strokeDasharray) {
      design.elements.gridLines.style = mapDasharrayToStyle(chartSpec.axes.gridStyle.strokeDasharray)
    }
  }

  if (chartSpec.legend) {
    const mapped = mapLegendPosition(chartSpec.legend.position)
    design.elements.legend.align = mapped.align
    design.elements.legend.verticalAlign = mapped.verticalAlign
    if (mapped.layout) {
      design.elements.legend.layout = mapped.layout
    }
  }

  if (chartSpec.dataLabels) {
    if (typeof chartSpec.dataLabels.fontSize === 'number') {
      design.elements.dataLabels.fontSize = chartSpec.dataLabels.fontSize
    }
    if (typeof chartSpec.dataLabels.fontWeight === 'number') {
      design.elements.dataLabels.fontWeight = chartSpec.dataLabels.fontWeight
    }
  }

  return design
}

function mergeTypography(base: TypographySpec, override?: Partial<TypographySpec> | null): TypographySpec {
  if (!override) {
    return base
  }

  return {
    size: override.size ?? base.size,
    weight: override.weight ?? base.weight,
    color: override.color ?? base.color,
    lineHeight: override.lineHeight ?? base.lineHeight,
  }
}

function mapLegendPosition(position?: string): { align: 'left' | 'center' | 'right'; verticalAlign: 'top' | 'middle' | 'bottom'; layout?: LegendLayout } {
  switch (position) {
    case 'bottom':
      return { align: 'center', verticalAlign: 'bottom', layout: 'horizontal' }
    case 'left':
      return { align: 'left', verticalAlign: 'middle', layout: 'vertical' }
    case 'right':
      return { align: 'right', verticalAlign: 'middle', layout: 'vertical' }
    case 'top-right':
      return { align: 'right', verticalAlign: 'top', layout: 'horizontal' }
    case 'top':
    default:
      return { align: 'center', verticalAlign: 'top', layout: 'horizontal' }
  }
}

function mapDasharrayToStyle(dasharray: string): 'solid' | 'dashed' | 'dotted' {
  const normalized = dasharray.trim().toLowerCase()
  if (normalized.includes('0')) {
    return 'solid'
  }
  if (normalized.includes('1')) {
    return 'dotted'
  }
  return 'dashed'
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

export function deepMerge<T extends Record<string, any>>(
  base: T,
  ...sources: Array<Partial<T> | null | undefined>
): T {
  const output = Array.isArray(base) ? ([...base] as unknown as T) : ({ ...base } as T)

  for (const source of sources) {
    if (!source || typeof source !== 'object') {
      continue
    }

    for (const [key, value] of Object.entries(source)) {
      if (value === undefined) {
        continue
      }

      const targetValue = (output as Record<string, any>)[key]

      if (Array.isArray(value)) {
        (output as Record<string, any>)[key] = [...value]
      } else if (value && typeof value === 'object') {
        const newBase = targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)
          ? targetValue
          : {}
        ;(output as Record<string, any>)[key] = deepMerge(newBase, value)
      } else {
        (output as Record<string, any>)[key] = value
      }
    }
  }

  return output
}
