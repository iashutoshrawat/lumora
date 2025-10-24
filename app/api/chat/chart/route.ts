import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { CHART_AGENT_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { chartTools } from '@/lib/ai/tools/chart-tools'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, chartType, chartConfig, dataStructure } = body

    // Build context-aware system prompt
    const systemPrompt = `${CHART_AGENT_SYSTEM_PROMPT}

CURRENT CONTEXT:
- Chart Type: ${chartType || 'bar'}
- Available Data Columns: ${dataStructure?.columns?.join(', ') || 'Not available'}
- Current Colors: ${chartConfig?.colors?.join(', ') || 'Default colors'}

Use this context to provide relevant suggestions and make informed changes.`

    const result = await generateText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      temperature: 0.5,
      tools: chartTools,
    })

    return new Response(JSON.stringify({
      text: result.text,
      toolCalls: result.toolCalls,
      finishReason: result.finishReason
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Chart agent error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { message: errorMessage, stack: errorStack })

    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        details: errorMessage
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
