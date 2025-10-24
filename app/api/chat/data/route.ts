import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { DATA_AGENT_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { dataTools } from '@/lib/ai/tools/data-tools'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, dataStructure, sampleRows } = body

    // Build context-aware system prompt
    const systemPrompt = `${DATA_AGENT_SYSTEM_PROMPT}

DATA CONTEXT:
${dataStructure ? `
- Columns: ${dataStructure.columns?.join(', ')}
- Row Count: ${dataStructure.rowCount || 'Unknown'}
- Sample Data: ${JSON.stringify(sampleRows || [], null, 2).slice(0, 500)}
` : 'No data uploaded yet.'}

Analyze this data and provide helpful insights.`

    const result = await generateText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      temperature: 0.3,
      tools: dataTools,
    })

    return new Response(JSON.stringify({
      text: result.text,
      toolCalls: result.toolCalls,
      finishReason: result.finishReason
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Data agent error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
