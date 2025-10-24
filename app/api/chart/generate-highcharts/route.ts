import { openai } from '@ai-sdk/openai'
import { generateObject, NoObjectGeneratedError } from 'ai'
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

const MAX_ROWS_FOR_AGENT_CONTEXT = 24

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
    const annotationCount = resolvedVizStrategy.staticElements.annotations?.length || 0
    const referenceLineCount = resolvedVizStrategy.staticElements.referenceLines?.length || 0
    const firstAnnotation = annotationCount > 0
      ? resolvedVizStrategy.staticElements.annotations?.[0]?.text
      : null
    const firstReferenceLine = referenceLineCount > 0
      ? resolvedVizStrategy.staticElements.referenceLines?.[0]
      : null

    // Get data range
    const firstXValue = preparedData.rows[0]?.[preparedData.xKey]
    const lastXValue = preparedData.rows[preparedData.rows.length - 1]?.[preparedData.xKey]
    const firstRow = preparedData.rows[0]

    const totalRowCount = preparedData.rows.length
    const truncatedRows = totalRowCount > MAX_ROWS_FOR_AGENT_CONTEXT
    const rowSampleForAgent = truncatedRows
      ? preparedData.rows.slice(0, MAX_ROWS_FOR_AGENT_CONTEXT)
      : preparedData.rows

    const categoriesForAgent = rowSampleForAgent.map((row: any) => row[preparedData.xKey])
    const compactSeries = preparedData.series.map((s: any) => ({
      key: s.key,
      label: s.label,
      color: s.color,
      type: s.type,
      data: rowSampleForAgent.map((row: any) => row[s.key]),
    }))

    const structuredPayloadForAgent = {
      recommendation: recommendation
        ? {
            chartType: recommendation.chartType,
            chartTitle: recommendation.chartTitle,
            businessQuestion: recommendation.businessQuestion,
            chartMapping: recommendation.chartMapping,
          }
        : null,
      preparedData: {
        xKey: preparedData.xKey,
        categories: categoriesForAgent,
        series: compactSeries,
        rowCount: totalRowCount,
        truncated: truncatedRows,
      },
      vizStrategy: {
        staticElements: {
          dataLabels: resolvedVizStrategy.staticElements.dataLabels && {
            show: resolvedVizStrategy.staticElements.dataLabels.show,
            format: resolvedVizStrategy.staticElements.dataLabels.format,
          },
          referenceLines: resolvedVizStrategy.staticElements.referenceLines,
          annotations: resolvedVizStrategy.staticElements.annotations,
          legend: resolvedVizStrategy.staticElements.legend,
        },
        powerpoint: resolvedVizStrategy.powerpoint,
      },
      design: {
        palette: resolvedDesign.palette,
        typography: resolvedDesign.typography,
        spacing: resolvedDesign.spacing,
        elements: resolvedDesign.elements,
        backgroundColor: resolvedDesign.backgroundColor,
      },
    }

    const contextHeader = JSON.stringify(structuredPayloadForAgent)

    // Call Highcharts Generator Agent with structured output
    console.log('🎨 Calling Highcharts Generator Agent with hybrid prompt...')

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: highchartsConfigSchema,
      system: HIGHCHARTS_GENERATOR_AGENT_PROMPT,
      prompt: contextHeader,
      temperature: 0.2,
      mode: 'json',
      maxOutputTokens: 12000,
      maxRetries: 2,
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
    if (NoObjectGeneratedError.isInstance(error)) {
      console.error('Highcharts generation error: model returned invalid JSON', {
        finishReason: error.finishReason,
        usage: error.usage,
        preview: error.text?.slice(0, 500),
      })
    } else {
      console.error('Highcharts generation error:', error)
    }
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
