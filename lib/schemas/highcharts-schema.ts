import { z } from 'zod'

/**
 * Comprehensive Zod schema for Highcharts configuration
 * Used with generateObject() for structured, type-safe chart generation
 */

// Style object schema (reusable)
const styleSchema = z.object({
  fontSize: z.string().optional(),
  fontWeight: z.string().optional(),
  color: z.string().optional(),
  fontFamily: z.string().optional(),
  textOutline: z.string().optional(),
  lineHeight: z.number().optional()
}).passthrough()

// Data label schema
const dataLabelSchema = z.object({
  enabled: z.boolean().optional(),
  format: z.string().optional(),
  style: styleSchema.optional(),
  y: z.number().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  verticalAlign: z.enum(['top', 'middle', 'bottom']).optional()
}).passthrough()

// Marker schema
const markerSchema = z.object({
  enabled: z.boolean().optional(),
  radius: z.number().optional(),
  lineWidth: z.number().optional(),
  lineColor: z.string().optional(),
  symbol: z.string().optional()
}).passthrough()

// Series data point schema
const dataPointSchema = z.union([
  z.number(),
  z.array(z.number()),
  z.object({
    y: z.number().optional(),
    x: z.number().optional(),
    name: z.string().optional(),
    color: z.string().optional(),
    dataLabels: dataLabelSchema.optional()
  }).passthrough()
])

// Series schema
const seriesSchema = z.object({
  type: z.enum(['line', 'column', 'bar', 'pie', 'scatter', 'area', 'spline']).optional(),
  name: z.string().optional(),
  data: z.array(dataPointSchema),
  color: z.string().optional(),
  lineWidth: z.number().optional(),
  marker: markerSchema.optional(),
  dataLabels: dataLabelSchema.optional(),
  colorByPoint: z.boolean().optional(),
  showInLegend: z.boolean().optional()
}).passthrough()

// Plot line schema (for reference lines)
const plotLineSchema = z.object({
  value: z.number(),
  color: z.string().optional(),
  width: z.number().optional(),
  dashStyle: z.enum(['Solid', 'Dash', 'Dot', 'DashDot']).optional(),
  zIndex: z.number().optional(),
  label: z.object({
    text: z.string().optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    style: styleSchema.optional()
  }).optional()
}).passthrough()

// Annotation schema
const annotationSchema = z.object({
  labelOptions: z.object({
    backgroundColor: z.string().optional(),
    borderColor: z.string().optional(),
    borderWidth: z.number().optional(),
    borderRadius: z.number().optional(),
    padding: z.number().optional(),
    style: styleSchema.optional()
  }).optional(),
  labels: z.array(z.object({
    point: z.object({
      xAxis: z.number().optional(),
      yAxis: z.number().optional(),
      x: z.number().optional(),
      y: z.number().optional()
    }).optional(),
    text: z.string()
  }))
}).passthrough()

// Main Highcharts config schema
export const highchartsConfigSchema = z.object({
  chart: z.object({
    type: z.enum(['line', 'column', 'bar', 'pie', 'scatter', 'area', 'spline']).optional(),
    backgroundColor: z.string().optional(),
    spacing: z.array(z.number()).optional(),
    height: z.number().nullable().optional(),  // Allow null for responsive rendering
    width: z.number().nullable().optional()    // Allow null for responsive rendering
  }).passthrough(),

  title: z.object({
    text: z.string().optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    style: styleSchema.optional()
  }).passthrough().optional(),

  subtitle: z.object({
    text: z.string().optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    style: styleSchema.optional()
  }).passthrough().optional(),

  xAxis: z.object({
    categories: z.array(z.string().nullable()).optional(),
    type: z.enum(['linear', 'logarithmic', 'datetime', 'category']).optional(),
    title: z.object({
      text: z.string().optional(),
      style: styleSchema.optional()
    }).optional(),
    labels: z.object({
      style: styleSchema.optional(),
      format: z.string().optional(),
      rotation: z.number().optional()
    }).optional(),
    lineWidth: z.number().optional(),
    lineColor: z.string().optional(),
    tickLength: z.number().optional(),
    gridLineWidth: z.number().optional(),
    gridLineColor: z.string().optional()
  }).passthrough().optional(),

  yAxis: z.object({
    title: z.object({
      text: z.string().optional(),
      style: styleSchema.optional()
    }).optional(),
    labels: z.object({
      style: styleSchema.optional(),
      format: z.string().optional()
    }).optional(),
    gridLineWidth: z.number().optional(),
    gridLineColor: z.string().optional(),
    gridLineDashStyle: z.enum(['Solid', 'Dash', 'Dot', 'DashDot']).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    startOnTick: z.boolean().optional(),
    endOnTick: z.boolean().optional(),
    plotLines: z.array(plotLineSchema).optional()
  }).passthrough().optional(),

  tooltip: z.object({
    enabled: z.boolean().optional(),
    shared: z.boolean().optional(),
    valuePrefix: z.string().optional(),
    valueSuffix: z.string().optional(),
    valueDecimals: z.number().optional(),
    headerFormat: z.string().optional(),
    pointFormat: z.string().optional()
  }).passthrough().optional(),

  plotOptions: z.object({
    series: z.object({
      dataLabels: dataLabelSchema.optional(),
      marker: markerSchema.optional(),
      animation: z.boolean().optional()
    }).passthrough().optional(),
    line: z.object({
      lineWidth: z.number().optional(),
      marker: markerSchema.optional(),
      dataLabels: dataLabelSchema.optional()
    }).passthrough().optional(),
    column: z.object({
      pointWidth: z.number().optional(),
      pointPadding: z.number().optional(),
      groupPadding: z.number().optional(),
      borderRadius: z.number().optional(),
      dataLabels: dataLabelSchema.optional()
    }).passthrough().optional(),
    bar: z.object({
      pointWidth: z.number().optional(),
      pointPadding: z.number().optional(),
      groupPadding: z.number().optional(),
      borderRadius: z.number().optional(),
      dataLabels: dataLabelSchema.optional()
    }).passthrough().optional(),
    pie: z.object({
      dataLabels: dataLabelSchema.optional(),
      showInLegend: z.boolean().optional(),
      innerSize: z.string().optional()
    }).passthrough().optional(),
    scatter: z.object({
      marker: markerSchema.optional(),
      dataLabels: dataLabelSchema.optional()
    }).passthrough().optional(),
    area: z.object({
      lineWidth: z.number().optional(),
      marker: markerSchema.optional(),
      fillOpacity: z.number().optional(),
      dataLabels: dataLabelSchema.optional()
    }).passthrough().optional()
  }).passthrough().optional(),

  legend: z.object({
    enabled: z.boolean().optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    verticalAlign: z.enum(['top', 'middle', 'bottom']).optional(),
    layout: z.enum(['horizontal', 'vertical']).optional(),
    itemStyle: styleSchema.optional(),
    x: z.number().optional(),
    y: z.number().optional()
  }).passthrough().optional(),

  annotations: z.array(annotationSchema).optional(),

  series: z.array(seriesSchema),

  colors: z.array(z.string()).optional(),

  credits: z.object({
    enabled: z.boolean().optional(),
    text: z.string().optional(),
    href: z.string().optional()
  }).optional(),

  exporting: z.object({
    enabled: z.boolean().optional(),
    sourceWidth: z.number().optional(),
    sourceHeight: z.number().optional(),
    scale: z.number().optional()
  }).optional()
}).passthrough()

// Type export for TypeScript
export type HighchartsConfig = z.infer<typeof highchartsConfigSchema>
