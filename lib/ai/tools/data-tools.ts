import { tool } from 'ai'
import { z } from 'zod'

// Export all tools as a map
export const dataTools = {
  analyzeDataStructure: tool({
    description: 'Analyze the structure and characteristics of the uploaded data',
    parameters: z.object({
      insights: z.array(z.string()).describe('Key insights about the data structure'),
      dataQualityIssues: z.array(z.string()).optional().describe('Any data quality problems detected'),
      rowCount: z.number().optional(),
      columnCount: z.number().optional()
    }),
    execute: async (args) => {
      return { ...args, success: true }
    }
  }),

  suggestChartTypes: tool({
    description: 'Recommend appropriate chart types based on the data',
    parameters: z.object({
      recommendations: z.array(z.object({
        chartType: z.enum(['bar', 'line', 'pie', 'area', 'scatter']),
        reason: z.string().describe('Why this chart type is suitable'),
        priority: z.enum(['high', 'medium', 'low'])
      })).min(1).max(3)
    }),
    execute: async ({ recommendations }: { recommendations: any }) => {
      return { recommendations, success: true }
    }
  }),

  detectAnomalies: tool({
    description: 'Identify outliers, unusual patterns, or data anomalies',
    parameters: z.object({
      anomalies: z.array(z.object({
        column: z.string(),
        description: z.string(),
        severity: z.enum(['high', 'medium', 'low'])
      })),
      hasAnomalies: z.boolean()
    }),
    execute: async ({ anomalies, hasAnomalies }: { anomalies: any; hasAnomalies: boolean }) => {
      return { anomalies, hasAnomalies, success: true }
    }
  }),

  suggestDataCleaning: tool({
    description: 'Recommend data cleaning or preparation steps',
    parameters: z.object({
      steps: z.array(z.object({
        action: z.string().describe('The cleaning action to take'),
        reason: z.string().describe('Why this cleaning is needed'),
        impact: z.string().describe('How this will improve the data')
      }))
    }),
    execute: async ({ steps }: { steps: any }) => {
      return { steps, success: true }
    }
  })
}

// Type exports
export type DataToolName = keyof typeof dataTools
