import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { DATA_TRANSFORMER_AGENT_PROMPT } from '@/lib/ai/prompts/agents/data-transformer'
import { CHART_ANALYST_AGENT_PROMPT } from '@/lib/ai/prompts/agents/chart-analyst'
import { VIZ_STRATEGIST_AGENT_PROMPT } from '@/lib/ai/prompts/agents/viz-strategist'
import { DESIGN_CONSULTANT_AGENT_PROMPT } from '@/lib/ai/prompts/agents/design-consultant'
import { applyTransformation, getColumnStats } from '@/lib/utils/data-transformer'
import { dataTransformerOutputSchema } from '@/lib/schemas/agent-output-schemas'
import { parseAndValidateAgentOutput } from '@/lib/utils/agent-retry'

export const maxDuration = 60 // Allow up to 60 seconds for multi-agent processing

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { data, userMessage } = body

    const { columns, rows } = data || {}

    if (!columns || !rows) {
      return new Response(
        JSON.stringify({ error: 'Invalid data format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create a ReadableStream for Server-Sent Events
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: any) => {
          const event = `data: ${JSON.stringify({ type, ...data })}\n\n`
          controller.enqueue(encoder.encode(event))
        }

        try {
          // Build data context with column statistics
          const columnStats = columns.map((col) => {
            const stats = getColumnStats(rows, col)
            return `${col} (${stats.type}, ${stats.uniqueCount} unique values)`
          }).join(', ')

          const dataContext = `
DATA STRUCTURE:
- Columns: ${columns.join(', ')}
- Column Details: ${columnStats}
- Row Count: ${rows.length}
- Sample Data (first 3 rows): ${JSON.stringify(rows.slice(0, 3), null, 2)}

${userMessage ? `USER REQUEST: "${userMessage}"` : 'USER REQUEST: Analyze this data and create a professional visualization'}
`

          console.log('🤖 Starting multi-agent analysis...')

          // AGENT 0: DATA TRANSFORMER
          console.log('🔄 Agent 0: Data Transformer analyzing structure...')
          sendEvent('agent-start', { agentName: 'Data Transformer' })
          
          let transformerResult: any
          try {
            transformerResult = await generateText({
              model: openai('gpt-4o-mini'), // Using mini for 2x speed (simple task)
              system: DATA_TRANSFORMER_AGENT_PROMPT,
              prompt: dataContext,
              temperature: 0.2,
            })

            console.log('✅ Data Transformation analysis complete')
            sendEvent('agent-complete', { agentName: 'Data Transformer' })
          } catch (error) {
            console.error('❌ Data Transformer failed:', error)
            sendEvent('error', { 
              agentName: 'Data Transformer', 
              message: error instanceof Error ? error.message : 'Unknown error' 
            })
            throw error // Re-throw to stop the process
          }

          // Parse transformation recommendation with Zod validation
          let transformationRecommendation: any = null
          let transformedData = { columns, rows }
          let transformationApplied = false

          // Use retry utility to parse and validate agent output
          const parseResult = parseAndValidateAgentOutput(
            transformerResult.text,
            dataTransformerOutputSchema,
            'Data Transformer'
          )

          if (parseResult.success && parseResult.data) {
            transformationRecommendation = parseResult.data

            // Apply transformation if recommended
            if (transformationRecommendation.needsTransformation) {
              console.log('🔄 Applying data transformation...')
              const transformed = applyTransformation(
                rows,
                columns,
                transformationRecommendation
              )

              if (transformed.transformation.applied) {
                transformedData = { columns: transformed.columns, rows: transformed.rows }
                transformationApplied = true
                console.log('✅ Transformation applied:', transformed.transformation.details)
              }
            } else {
              console.log('ℹ️ No transformation needed - data is already plot-ready')
            }
          } else {
            console.warn('⚠️ Using original data due to parse failure')
            console.warn('Raw output:', transformerResult.text?.substring(0, 500))
          }

          // Update data context with transformed data for remaining agents
          const transformedContext = `
DATA STRUCTURE (${transformationApplied ? 'TRANSFORMED' : 'ORIGINAL'}):
- Columns: ${transformedData.columns.join(', ')}
- Row Count: ${transformedData.rows.length}
- Sample Data (first 3 rows): ${JSON.stringify(transformedData.rows.slice(0, 3), null, 2)}
${transformationApplied ? `\n- Transformation Applied: ${transformationRecommendation?.transformationReason || 'Data reshaped for optimal plotting'}` : ''}

${userMessage ? `USER REQUEST: "${userMessage}"` : 'USER REQUEST: Analyze this data and create a professional visualization'}
`

          // AGENT 1: CHART ANALYST
          console.log('📊 Agent 1: Chart Analyst recommending charts...')
          sendEvent('agent-start', { agentName: 'Chart Analyst' })
          
          let chartAnalysis: any
          try {
            chartAnalysis = await generateText({
              model: openai('gpt-4o'),
              system: CHART_ANALYST_AGENT_PROMPT,
              prompt: transformedContext,
              temperature: 0.3,
            })

            console.log('✅ Chart Analysis complete')
            sendEvent('agent-complete', { agentName: 'Chart Analyst' })
          } catch (error) {
            console.error('❌ Chart Analyst failed:', error)
            sendEvent('error', { 
              agentName: 'Chart Analyst', 
              message: error instanceof Error ? error.message : 'Unknown error' 
            })
            throw error // Re-throw to stop the process
          }

          // AGENTS 2 & 3: RUN IN PARALLEL for 40% speedup ⚡
          console.log('⚡ Running Viz Strategist and Design Consultant in parallel...')
          sendEvent('agent-start', { agentName: 'Visualization Strategist' })
          sendEvent('agent-start', { agentName: 'Design Consultant' })

          let vizStrategy: any, designStyling: any
          try {
            const results = await Promise.allSettled([
              // AGENT 2: VISUALIZATION STRATEGIST
              generateText({
                model: openai('gpt-4o-mini'), // Using mini for 2x speed
                system: VIZ_STRATEGIST_AGENT_PROMPT,
                prompt: `${transformedContext}

PREVIOUS AGENT OUTPUT (Data Transformer):
${transformationRecommendation ? JSON.stringify(transformationRecommendation.plotReadyStructure || {}, null, 2) : 'No transformation needed'}

PREVIOUS AGENT OUTPUT (Chart Analyst):
${chartAnalysis.text}

Based on the chart analysis above, create detailed static chart specifications for PowerPoint/PDF/PNG export. Focus on comprehensive labeling, annotations, and consulting standards. Remember: no tooltips exist - all information must be visible on the chart.`,
                temperature: 0.4,
              }),

              // AGENT 3: DESIGN CONSULTANT
              generateText({
                model: openai('gpt-4o-mini'), // Using mini for 2x speed
                system: DESIGN_CONSULTANT_AGENT_PROMPT,
                prompt: `${transformedContext}

CHART ANALYSIS:
${chartAnalysis.text}

Create pixel-perfect design specifications following McKinsey/BCG/Bain consulting standards. Specify exact colors (hex codes), typography (sizes, weights), spacing (pixels), and all visual elements. Remember: you are the final agent before implementation - every visual decision must be explicit and precise.`,
                temperature: 0.5,
              })
            ])

            // Handle results with individual error handling
            if (results[0].status === 'fulfilled') {
              vizStrategy = results[0].value
              console.log('✅ Viz Strategy complete')
              sendEvent('agent-complete', { agentName: 'Visualization Strategist' })
            } else {
              console.error('❌ Visualization Strategist failed:', results[0].reason)
              sendEvent('error', { 
                agentName: 'Visualization Strategist', 
                message: results[0].reason instanceof Error ? results[0].reason.message : 'Unknown error' 
              })
              throw results[0].reason
            }

            if (results[1].status === 'fulfilled') {
              designStyling = results[1].value
              console.log('✅ Design Styling complete')
              sendEvent('agent-complete', { agentName: 'Design Consultant' })
            } else {
              console.error('❌ Design Consultant failed:', results[1].reason)
              sendEvent('error', { 
                agentName: 'Design Consultant', 
                message: results[1].reason instanceof Error ? results[1].reason.message : 'Unknown error' 
              })
              throw results[1].reason
            }

            console.log('✅ Viz Strategy and Design Styling complete (parallel execution)')
          } catch (error) {
            console.error('❌ Parallel agents failed:', error)
            // Individual error events already sent above
            throw error
          }

          console.log('🎉 Multi-agent analysis complete!')

          // Send final complete event with all results
          sendEvent('complete', {
            success: true,
            transformedData: transformationApplied ? transformedData : null,
            transformation: {
              applied: transformationApplied,
              recommendation: transformationRecommendation,
              details: transformationApplied ?
                `Data was reshaped from ${columns.length} columns × ${rows.length} rows to ${transformedData.columns.length} columns × ${transformedData.rows.length} rows` :
                'No transformation needed'
            },
            agents: {
              dataTransformer: {
                output: transformerResult.text,
                role: 'Data structure analysis and transformation'
              },
              chartAnalyst: {
                output: chartAnalysis.text,
                role: 'Strategic chart recommendations and data operations'
              },
              vizStrategist: {
                output: vizStrategy.text,
                role: 'Static chart specifications for PowerPoint/PDF/PNG exports'
              },
              designConsultant: {
                output: designStyling.text,
                role: 'Pixel-perfect design specifications (colors, typography, spacing)'
              }
            },
            summary: {
              transformation: transformationApplied ? extractKeyPoints(transformerResult.text) : ['Data is already in optimal format'],
              chartInsights: extractKeyPoints(chartAnalysis.text),
              chartRecommendation: extractKeyPoints(vizStrategy.text),
              styleGuide: extractKeyPoints(designStyling.text)
            }
          })

        } catch (error) {
          console.error('Multi-agent analysis error:', error)
          sendEvent('error', {
            message: error instanceof Error ? error.message : 'Unknown error',
            details: 'Multi-agent analysis failed'
          })
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error) {
    console.error('Multi-agent analysis error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to complete multi-agent analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Helper function to extract key points from agent output
function extractKeyPoints(text: string): string[] {
  // Try to extract bullet points or key sentences
  const lines = text.split('\n').filter(line => line.trim())
  const keyPoints = lines
    .filter(line =>
      line.includes('•') ||
      line.includes('-') ||
      line.includes('*') ||
      line.match(/^\d+\./)
    )
    .map(line => line.replace(/^[\s•\-*\d.]+/, '').trim())
    .filter(line => line.length > 10)

  // If no bullet points found, return first few meaningful sentences
  if (keyPoints.length === 0) {
    return lines
      .filter(line => line.length > 50 && line.length < 200)
      .slice(0, 3)
  }

  return keyPoints.slice(0, 5)
}
