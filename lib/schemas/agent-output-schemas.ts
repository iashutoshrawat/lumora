import { z } from 'zod'

// ============================================================================
// DATA TRANSFORMER AGENT SCHEMA
// ============================================================================

const columnAnalysisSchema = z.object({
  name: z.string(),
  type: z.enum(['dimension', 'measure', 'temporal', 'identifier']),
  dataType: z.enum(['string', 'number', 'date', 'boolean']),
  role: z.enum(['categorical', 'numerical', 'temporal', 'implicitDimension', 'identifier', 'measure']), // Add 'measure' to match agent output
  description: z.string(),
})

const transformationSchema = z.object({
  type: z.enum(['unpivot', 'pivot', 'melt', 'aggregate', 'dateExtraction', 'none']),
  idColumns: z.array(z.string()).optional(),
  valueColumns: z.array(z.string()).optional(),
  newDimensionColumn: z.string().optional(),
  newMeasureColumn: z.string().optional(),
  reasoning: z.string().optional(),
})

const plotReadyStructureSchema = z.object({
  dimensions: z.array(z.string()),
  measures: z.array(z.string()),
  temporal: z.string().nullable(),
  primaryDimension: z.string(),
  suggestedXAxis: z.string(),
  suggestedYAxis: z.string(),
  groupBy: z.string().nullable().optional(),
})

export const dataTransformerOutputSchema = z.object({
  columns: z.array(columnAnalysisSchema),
  dataFormat: z.enum(['wide', 'tall', 'long', 'normalized']),
  needsTransformation: z.boolean(),
  transformationReason: z.string().optional(),
  transformation: transformationSchema.optional(),
  plotReadyStructure: plotReadyStructureSchema,
  expectedOutcome: z.string().optional(),
})

export type DataTransformerOutput = z.infer<typeof dataTransformerOutputSchema>

// ============================================================================
// CHART ANALYST AGENT SCHEMA
// ============================================================================

const dataAnalysisSchema = z.object({
  summary: z.string(),
  keyDimensions: z.array(z.string()),
  keyMeasures: z.array(z.string()),
  temporalGranularity: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'none']),
  estimatedCardinality: z.record(z.string(), z.string()).optional(), // Accept descriptive strings like "medium (10-50)"
  analyticalOpportunities: z.array(z.string()).optional(),
})

const calculatedFieldSchema = z.object({
  name: z.string(),
  formula: z.string(),
  purpose: z.string().optional(),
  reasoning: z.string().optional(),
})

const filterSchema = z.object({
  column: z.string(),
  condition: z.string(),
  reason: z.string().optional(),
})

const sortingSchema = z.object({
  column: z.string(),
  order: z.enum(['ascending', 'descending']),
})

const dataPreparationSchema = z.object({
  useTransformedStructure: z.boolean().optional(),
  groupBy: z.array(z.string()).optional(),
  aggregations: z.record(z.string(), z.string()).optional(),
  calculatedFields: z.array(calculatedFieldSchema).optional(),
  filters: z.array(filterSchema).optional(),
  sorting: sortingSchema.optional(),
})

const chartMappingSchema = z.object({
  xAxis: z.string(),
  yAxis: z.union([z.string(), z.array(z.string())]),
  groupBy: z.string().optional().nullable(),
  additionalEncodings: z.record(z.string(), z.any()).optional(),
})

const alternativeChartSchema = z.object({
  type: z.string(),
  reason: z.string(),
})

const nextAgentGuidanceSchema = z.object({
  visualizationStrategist: z.string().optional(),
  designConsultant: z.string().optional(),
})

const INSIGHT_TYPES = ['trend', 'comparison', 'composition', 'distribution', 'relationship', 'performance'] as const

const insightTypeSchema = z
  .string()
  .transform((value) => value.split('|')[0].trim().toLowerCase())
  .pipe(z.enum(INSIGHT_TYPES))

const chartRecommendationSchema = z.object({
  priority: z.number(),
  chartType: z.string(),
  chartVariant: z.string().optional(),
  businessQuestion: z.string(),
  chartTitle: z.string(),
  insightType: insightTypeSchema,
  dataPreparation: dataPreparationSchema,
  chartMapping: chartMappingSchema,
  expectedInsight: z.string().optional(),
  executiveSummary: z.string().optional(),
  analyticalConsiderations: z.array(z.string()).optional(),
  alternativeCharts: z.array(alternativeChartSchema).optional(),
  dashboardRole: z.enum(['primary', 'secondary', 'supporting']).optional(),
  targetAudience: z.string().optional(), // Accept multi-value strings like "executives | analysts"
  nextAgentGuidance: nextAgentGuidanceSchema.optional(),
})

const chartCombinationSchema = z.object({
  name: z.string(),
  charts: z.array(z.string()),
  purpose: z.string(),
  layout: z.string().optional(),
})

const dashboardStrategySchema = z.object({
  overview: z.string().optional(),
  chartCombinations: z.array(chartCombinationSchema).optional(),
  interactivity: z.array(z.string()).optional(),
})

const suggestedKPISchema = z.object({
  name: z.string(),
  calculation: z.string(),
  displayFormat: z.string(),
})

const additionalAnalyticsSchema = z.object({
  suggestedKPIs: z.array(suggestedKPISchema).optional(),
  benchmarksNeeded: z.array(z.string()).optional(),
})

export const chartAnalystOutputSchema = z.object({
  dataAnalysis: dataAnalysisSchema.optional(),
  chartRecommendations: z.array(chartRecommendationSchema),
  dashboardStrategy: dashboardStrategySchema.optional(),
  additionalAnalytics: additionalAnalyticsSchema.optional(),
  warnings: z.array(z.string()).optional(),
})

export type ChartAnalystOutput = z.infer<typeof chartAnalystOutputSchema>
export type ChartRecommendation = z.infer<typeof chartRecommendationSchema>

// ============================================================================
// VIZ STRATEGIST AGENT SCHEMA
// ============================================================================

const dataLabelsConfigSchema = z.object({
  show: z.enum(['all', 'selective', 'none', 'first-last', 'peaks-troughs', 'outliers']),
  format: z.string().optional(),
  positions: z.array(z.number()).optional(),
  fontSize: z.number().optional(),
  fontWeight: z.number().optional(),
  color: z.string().optional(),
})

const referenceLineSchema = z.object({
  value: z.union([z.number(), z.string()]),
  label: z.string(),
  color: z.string().optional(),
  style: z.enum(['solid', 'dashed', 'dotted']).optional(),
  width: z.number().optional(),
  opacity: z.number().optional(),
})

const annotationSchema = z.object({
  text: z.string(),
  x: z.union([z.number(), z.string()]),
  y: z.union([z.number(), z.string()]),
  style: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  fontSize: z.number().optional(),
})

const legendConfigSchema = z.object({
  show: z.boolean(),
  position: z.enum(['top', 'bottom', 'left', 'right', 'top-right', 'top-left', 'bottom-right', 'bottom-left']).optional(),
  layout: z.enum(['horizontal', 'vertical']).optional(),
})

const staticElementsSchema = z.object({
  dataLabels: dataLabelsConfigSchema.optional(),
  referenceLines: z.array(referenceLineSchema).optional(),
  annotations: z.array(annotationSchema).optional(),
  legend: legendConfigSchema.optional(),
})

const chartDimensionsSchema = z.object({
  width: z.number(),
  height: z.number(),
})

const powerpointConfigSchema = z.object({
  exportDPI: z.number(),
  chartDimensions: chartDimensionsSchema,
  slideSize: z.enum(['16:9', '4:3']).optional(),
  animationBuild: z.string().optional(),
})

export const vizStrategistOutputSchema = z.object({
  staticElements: staticElementsSchema.optional(),
  powerpoint: powerpointConfigSchema.optional(),
  subtitle: z.string().optional(),
  footnotes: z.array(z.string()).optional(),
  source: z.string().optional(),
})

export type VizStrategistOutput = z.infer<typeof vizStrategistOutputSchema>

// ============================================================================
// DESIGN CONSULTANT AGENT SCHEMA
// ============================================================================

const colorAccentsSchema = z.object({
  positive: z.string(),
  negative: z.string(),
  warning: z.string(),
  neutral: z.string(),
})

const paletteSchema = z.object({
  name: z.string().optional(),
  primary: z.array(z.string()).optional(),
  accents: colorAccentsSchema.optional(),
  grays: z.array(z.string()).optional(),
})

const typographyElementSchema = z.object({
  size: z.number().optional(),
  weight: z.number().optional(),
  color: z.string().optional(),
  lineHeight: z.number().optional(),
  fontFamily: z.string().optional(),
})

const typographySchema = z.object({
  fontFamily: z.string().optional(),
  chartTitle: typographyElementSchema.optional(),
  axisLabels: typographyElementSchema.optional(),
  dataLabels: typographyElementSchema.optional(),
  legendText: typographyElementSchema.optional(),
  annotations: typographyElementSchema.optional(),
})

const marginsSchema = z.object({
  top: z.number(),
  right: z.number(),
  bottom: z.number(),
  left: z.number(),
})

const lineWeightSchema = z.object({
  primary: z.number().optional(),
  secondary: z.number().optional(),
})

const markerSizeSchema = z.object({
  standard: z.number().optional(),
  emphasis: z.number().optional(),
})

const spacingSchema = z.object({
  margins: marginsSchema.optional(),
  lineWeight: lineWeightSchema.optional(),
  markerSize: markerSizeSchema.optional(),
  barWidth: z.number().nullable().optional(),
  barGap: z.number().nullable().optional(),
})

const axesStyleSchema = z.object({
  lineWeight: z.number().optional(),
  lineColor: z.string().optional(),
  tickLength: z.number().optional(),
})

const gridLinesStyleSchema = z.object({
  weight: z.number().optional(),
  color: z.string().optional(),
  opacity: z.number().optional(),
  style: z.enum(['solid', 'dashed', 'dotted']).optional(),
})

const dataLabelsStyleSchema = z.object({
  fontSize: z.number().optional(),
  fontWeight: z.number().optional(),
  color: z.string().optional(),
  offsetY: z.number().optional(),
})

const legendStyleSchema = z.object({
  align: z.string().optional(),
  verticalAlign: z.string().optional(),
})

const calloutBoxStyleSchema = z.object({
  background: z.string().optional(),
  border: z.string().optional(),
  borderRadius: z.number().optional(),
  padding: z.number().optional(),
})

const elementsSchema = z.object({
  axes: axesStyleSchema.optional(),
  gridLines: gridLinesStyleSchema.optional(),
  dataLabels: dataLabelsStyleSchema.optional(),
  legend: legendStyleSchema.optional(),
  calloutBox: calloutBoxStyleSchema.optional(),
})

export const designConsultantOutputSchema = z.object({
  palette: paletteSchema.optional(),
  typography: typographySchema.optional(),
  spacing: spacingSchema.optional(),
  elements: elementsSchema.optional(),
  backgroundColor: z.string().optional(),
})

export type DesignConsultantOutput = z.infer<typeof designConsultantOutputSchema>
