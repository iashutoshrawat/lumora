import { tool } from 'ai'
import { z } from 'zod'

// Tool definitions with proper Zod schemas
export const changeChartType = tool({
  description: 'Change the chart type to better visualize the data',
  parameters: z.object({
    chartType: z.enum(['bar', 'line', 'pie', 'area', 'scatter']).describe('The type of chart to switch to'),
    reason: z.string().describe('Brief explanation why this chart type is appropriate')
  }),
  execute: async ({ chartType, reason }) => {
    return { chartType, reason, success: true }
  }
})

export const updateChartColors = tool({
  description: 'Update the color scheme of the chart',
  parameters: z.object({
    colors: z.array(z.string()).min(1).max(10).describe('Array of hex color codes (e.g., ["#004B87", "#0066B3"])'),
    reason: z.string().optional().describe('Why these colors were chosen')
  }),
  execute: async ({ colors, reason }) => {
    return { colors, reason, success: true }
  }
})

export const updateChartTitle = tool({
  description: 'Set or update the chart title and subtitle',
  parameters: z.object({
    title: z.string().describe('The new chart title'),
    subtitle: z.string().optional().describe('Optional subtitle for additional context')
  }),
  execute: async ({ title, subtitle }) => {
    return { title, subtitle, success: true }
  }
})

export const filterDataSeries = tool({
  description: 'Show or hide specific data series in the chart',
  parameters: z.object({
    seriesToShow: z.array(z.string()).describe('Names of data series to display'),
    reason: z.string().optional().describe('Why filter these specific series')
  }),
  execute: async ({ seriesToShow, reason }) => {
    return { seriesToShow, reason, success: true }
  }
})

export const adjustChartSettings = tool({
  description: 'Modify chart display settings like legend, grid, tooltips, and positioning',
  parameters: z.object({
    showLegend: z.boolean().optional().describe('Whether to show the legend'),
    showGrid: z.boolean().optional().describe('Whether to show grid lines'),
    showTooltip: z.boolean().optional().describe('Whether to show tooltips'),
    legendPosition: z.enum(['top', 'bottom', 'left', 'right']).optional().describe('Legend position')
  }),
  execute: async (settings) => {
    return { ...settings, success: true }
  }
})

// Export as object for use in generateText
export const chartTools = {
  changeChartType,
  updateChartColors,
  updateChartTitle,
  filterDataSeries,
  adjustChartSettings
}

// Type exports for client use
export type ChartToolName = keyof typeof chartTools
