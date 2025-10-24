import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { HIGHCHARTS_GENERATOR_AGENT_PROMPT } from '@/lib/ai/prompts/agents/highcharts-generator'
import { highchartsConfigSchema } from '@/lib/schemas/highcharts-schema'
import type { ChartSpecification } from '@/lib/utils/chart-spec-parser'
import {
  deriveDesignFromChartSpec,
  deriveVizStrategyFromChartSpec,
  deepMerge,
  type DesignSpec,
  type VizStrategySpec
} from '@/lib/utils/chart-spec-adapter'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { recommendation, preparedData, vizStrategy, design, chartSpec } = body as {
      recommendation: any
      preparedData: any
      vizStrategy?: VizStrategySpec
      design?: DesignSpec
      chartSpec?: ChartSpecification | null
    }

    if (!recommendation || !preparedData) {
      return new Response(
        JSON.stringify({ error: 'Missing required inputs: recommendation and preparedData' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const defaultDesign = getDefaultDesign()
    const defaultViz = getDefaultVizStrategy()

    const specAwareDesign = chartSpec
      ? deriveDesignFromChartSpec(chartSpec, defaultDesign)
      : deepMerge(defaultDesign, {})
    const specAwareVizStrategy = chartSpec
      ? deriveVizStrategyFromChartSpec(chartSpec, defaultViz)
      : deepMerge(defaultViz, {})

    const resolvedDesign = deepMerge<DesignSpec>(specAwareDesign, design || {})
    const resolvedVizStrategy = deepMerge<VizStrategySpec>(specAwareVizStrategy, vizStrategy || {})

    console.log('🎨 Generating Highcharts config for:', recommendation.chartType)
    console.log('🧮 Prepared data snapshot:', {
      columns: preparedData?.columns?.slice?.(0, 5),
      rowSample: preparedData?.rows?.slice?.(0, 2)
    })

    console.log('🎯 Resolved strategist directives:', {
      legend: resolvedVizStrategy.staticElements.legend,
      dataLabels: resolvedVizStrategy.staticElements.dataLabels,
      referenceLines: resolvedVizStrategy.staticElements.referenceLines?.length || 0
    })

    console.log('🎨 Resolved design palette:', {
      name: resolvedDesign.palette.name,
      primary: resolvedDesign.palette.primary
    })

    // Build human-readable context header
    const xAxisLabel = recommendation.chartMapping?.xAxis || preparedData.xKey || 'Categories'
    const yAxisLabel = Array.isArray(recommendation.chartMapping?.yAxis)
      ? recommendation.chartMapping.yAxis.join(', ')
      : recommendation.chartMapping?.yAxis || 'Values'

    const seriesNames = preparedData.series.map((s: any) => s.label || s.key).join(', ')
    const dataFormat = resolvedVizStrategy.staticElements.dataLabels?.format || '${point.y:.0f}'

    // Extract title and subtitle info
    const chartTitle = recommendation.chartTitle || recommendation.businessQuestion || 'Data Visualization'
    const subtitle = chartSpec?.subtitle || `By ${xAxisLabel}. Source: [Data source], [Period]`

    // Build annotations summary
    const annotationsSummary = resolvedVizStrategy.staticElements.annotations?.length > 0
      ? resolvedVizStrategy.staticElements.annotations.map((anno: any) =>
          `  - "${anno.text}" at position (${anno.x}, ${anno.y})`
        ).join('\n')
      : '  - None'

    // Build reference lines summary
    const referenceLinesSummary = resolvedVizStrategy.staticElements.referenceLines?.length > 0
      ? resolvedVizStrategy.staticElements.referenceLines.map((line: any) =>
          `  - ${line.label || 'Line'} at value ${line.value} (color: ${line.color || 'default'})`
        ).join('\n')
      : ''

    // Get data range
    const firstXValue = preparedData.rows[0]?.[preparedData.xKey]
    const lastXValue = preparedData.rows[preparedData.rows.length - 1]?.[preparedData.xKey]
    const sampleDataPoint = preparedData.rows[0]
      ? preparedData.series.map((s: any) => `${s.label || s.key}: ${sampleDataPoint[s.key]}`).join(', ')
      : 'No data'

    const contextHeader = `
# Highcharts Generation Request

## Chart Overview
- **Chart Type**: ${recommendation.chartType}
- **Chart Title**: "${chartTitle}"
- **Subtitle**: "${subtitle}"
- **X-Axis**: ${xAxisLabel} (${preparedData.rows.length} data points)
- **Y-Axis**: ${yAxisLabel}
- **Series Displayed**: ${seriesNames} (${preparedData.series.length} total)
- **Number Format**: ${dataFormat}

## Data Range
- **X-Axis Values**: ${firstXValue} → ${lastXValue}
- **Sample Data Point**: ${firstXValue} = ${sampleDataPoint}

## Annotations (Callouts on Chart)
${annotationsSummary}

## Static Elements (Critical for PowerPoint/PDF Export)
- **Data Labels**: ${resolvedVizStrategy.staticElements.dataLabels?.show || 'all'} points labeled with format "${dataFormat}"
- **Reference Lines**: ${resolvedVizStrategy.staticElements.referenceLines?.length || 0} benchmark line(s)
${referenceLinesSummary}
- **Legend**: ${resolvedVizStrategy.staticElements.legend?.show ? `Visible at ${resolvedVizStrategy.staticElements.legend.position}` : 'Hidden (using direct labeling)'}
- **Tooltips**: Disabled (static chart for export)

## Design Specifications
- **Color Palette**: ${resolvedDesign.palette.name}
- **Primary Colors**: ${resolvedDesign.palette.primary.slice(0, 3).join(', ')}
- **Typography**: Title ${resolvedDesign.typography.chartTitle.size}px (weight ${resolvedDesign.typography.chartTitle.weight}), Axis labels ${resolvedDesign.typography.axisLabels.size}px
- **Spacing**: Margins ${resolvedDesign.spacing.margins.top}/${resolvedDesign.spacing.margins.right}/${resolvedDesign.spacing.margins.bottom}/${resolvedDesign.spacing.margins.left}px

## Export Settings
- **Dimensions**: ${resolvedVizStrategy.powerpoint.chartDimensions.width}×${resolvedVizStrategy.powerpoint.chartDimensions.height}px
- **DPI**: ${resolvedVizStrategy.powerpoint.exportDPI} (scale: ${resolvedVizStrategy.powerpoint.exportDPI / 96})
- **Target**: PowerPoint/PDF static export (no browser interactivity needed)

## Complete Structured Data
\`\`\`json
${JSON.stringify({
  recommendation,
  preparedData,
  chartSpec: chartSpec ?? null,
  vizStrategy: resolvedVizStrategy,
  design: resolvedDesign
}, null, 2)}
\`\`\`

Generate a complete Highcharts configuration that implements this specification exactly.
`

    // Call Highcharts Generator Agent with structured output
    console.log('🎨 Calling Highcharts Generator Agent with hybrid prompt...')

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: highchartsConfigSchema,
      system: HIGHCHARTS_GENERATOR_AGENT_PROMPT,
      prompt: contextHeader,
      temperature: 0.2,
    })

    console.log('✅ Highcharts Generator Agent completed successfully')
    console.log('📊 Generated chart type:', result.object.chart?.type)
    console.log('📈 Series count:', result.object.series?.length)

    const highchartsConfig = result.object

    if (highchartsConfig.chart) {
      if ('width' in highchartsConfig.chart) {
        delete (highchartsConfig.chart as Record<string, unknown>).width
      }
      if ('height' in highchartsConfig.chart) {
        delete (highchartsConfig.chart as Record<string, unknown>).height
      }
    }

    console.log('🧾 Highcharts config preview:', {
      chart: highchartsConfig.chart,
      title: highchartsConfig.title?.text,
      legend: highchartsConfig.legend
    })

    return new Response(
      JSON.stringify({
        success: true,
        highchartsConfig,
        metadata: {
          chartType: highchartsConfig.chart?.type || recommendation.chartType,
          seriesCount: highchartsConfig.series?.length || 0,
          generatedAt: new Date().toISOString()
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Highcharts generation error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to generate Highcharts configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

function getDefaultDesign() {
  return {
    palette: {
      name: 'mckinsey',
      primary: ['#004B87', '#0066B3', '#003366', '#0FA3B1', '#7209B7'],
      accents: {
        positive: '#00A859',
        negative: '#E63946',
        warning: '#F77F00',
        neutral: '#737373'
      },
      grays: ['#2C2C2C', '#4A4A4A', '#737373', '#A6A6A6', '#D9D9D9', '#F2F2F2']
    },
    typography: {
      fontFamily: 'Inter, Arial, sans-serif',
      chartTitle: { size: 20, weight: 600, color: '#2C2C2C', lineHeight: 1.3 },
      axisLabels: { size: 12, weight: 400, color: '#4A4A4A', lineHeight: 1.2 },
      dataLabels: { size: 11, weight: 500, color: '#2C2C2C', lineHeight: 1.2 },
      legendText: { size: 11, weight: 400, color: '#4A4A4A', lineHeight: 1.4 },
      annotations: { size: 11, weight: 400, color: '#2C2C2C', lineHeight: 1.3 }
    },
    spacing: {
      margins: { top: 60, right: 80, bottom: 80, left: 80 },
      lineWeight: { primary: 3, secondary: 2 },
      markerSize: { standard: 6, emphasis: 10 },
      barWidth: 65,
      barGap: 8
    },
    elements: {
      axes: { lineWeight: 1.5, lineColor: '#4A4A4A', tickLength: 5 },
      gridLines: { weight: 0.5, color: '#E5E5E5', opacity: 0.6, style: 'solid' },
      dataLabels: { fontSize: 11, fontWeight: 500, color: '#2C2C2C', offsetY: 6 },
      legend: { align: 'right', verticalAlign: 'top' },
      calloutBox: {
        background: 'rgba(255, 255, 255, 0.95)',
        border: '#004B87',
        borderRadius: 4,
        padding: 8
      }
    },
    backgroundColor: '#FFFFFF'
  }
}

function getDefaultVizStrategy(): VizStrategySpec {
  return {
    staticElements: {
      dataLabels: {
        show: 'all',
        format: '${point.y:.0f}',
        positions: [],
      },
      referenceLines: [],
      annotations: [],
      legend: {
        show: true,
        position: 'top-right',
      },
    },
    powerpoint: {
      exportDPI: 300,
      chartDimensions: { width: 1600, height: 800 },
    },
  }
}
