import { openai } from '@ai-sdk/openai'
import { generateText, generateObject } from 'ai'
import { chartPatchResultSchema } from '@/lib/schemas/chart-edit-patch-schema'

export const maxDuration = 30

const CHART_PATCH_PROMPT = `# Highcharts Configuration Patch Generator

You are a Highcharts configuration editor that identifies MINIMAL changes needed for user requests.

## Your Task
Given a user request, analyze what needs to change and output JSON operations that can be applied to the existing configuration.

## Output Format
Return a JSON object with this structure:
{
  "editType": "simple" | "complex",
  "operations": [
    { "path": "title.text", "op": "replace", "value": "New Title" },
    { "path": "colors", "op": "replace", "value": ["#FF0000", "#00FF00"] },
    { "path": "legend.enabled", "op": "replace", "value": false }
  ],
  "explanation": "Brief description of changes made"
}

## Edit Type Classification

**Simple edits** (use patch approach):
- Title changes: "Change title to Sales Report"
- Color changes: "Make bars blue", "Use red theme"
- Legend changes: "Hide legend", "Move legend to bottom"
- Label changes: "Make labels bigger", "Show data labels"
- Layout: "Make chart taller", "Add more spacing"
- Grid lines: "Remove grid lines", "Show horizontal lines"
- Axis ticks: "Add tick marks", "Make ticks longer" (use xAxis.tickLength / yAxis.tickLength etc.)

**Complex edits** (fallback to full regeneration):
- Chart type changes: "Convert to pie chart"
- Major data restructuring: "Group by category", "Add new series"
- Complete redesign: "Make it look like a dashboard"

## Operation Types
- "replace": Set a new value at the path
- "add": Add a new property (for arrays or new objects)
- "remove": Remove a property

## Path Examples
- "title.text" → config.title.text
- "colors" → config.colors
- "legend.enabled" → config.legend.enabled
- "yAxis.plotLines" → config.yAxis.plotLines
- "series.0.data" → config.series[0].data
- "yAxis.gridLineWidth" → config.yAxis.gridLineWidth (set 0 to hide)
- "xAxis.tickLength" → config.xAxis.tickLength (set positive integer to show ticks)
- "yAxis.0.tickInterval" → config.yAxis[0].tickInterval

## Important Rules
1. Be precise with paths - use exact property names
2. For simple edits, provide specific operations
3. For complex edits, set editType: "complex" and minimal operations
4. Always include explanation of what changed
5. Use valid JSON values (strings, numbers, booleans, arrays, objects)
6. For removing grid lines, set gridLineWidth to 0 (do not remove the axis)
7. For showing tick marks, set tickLength (and optionally tickWidth/tickColor) to desired values
`

const CHART_EDITOR_PROMPT = `# Highcharts Chart Editor Agent

You are an expert at modifying Highcharts configurations based on user requests. You receive:
1. Current Highcharts configuration (JSON)
2. User's modification request (natural language)

Your job is to understand the request and output the COMPLETE modified Highcharts configuration.

## Common Modification Types

**Colors/Styling:**
- "Make the bars wider" → Increase pointWidth in plotOptions.column
- "Change colors to blue theme" → Update colors array and series colors
- "Add data labels" → Enable dataLabels in plotOptions.series
- "Remove grid lines" → Set yAxis.gridLineWidth to 0
- "Add tick marks" → Set xAxis.tickLength / yAxis.tickLength to desired length

**Data Display:**
- "Show only top 5" → Filter series data to top 5 points
- "Add target line at $5M" → Add plotLine to yAxis
- "Show percentages instead" → Change data label formatter
- "Hide legend" → Set legend.enabled to false

**Layout/Size:**
- "Make chart taller" → Increase chart.height
- "Add more spacing" → Increase chart.spacing values
- "Move legend to bottom" → Change legend.verticalAlign and layout
- "Adjust tick spacing" → Modify tickInterval / tickPositions on axes

**Text/Labels:**
- "Change title to..." → Update title.text
- "Make axis labels bigger" → Increase xAxis.labels.style.fontSize
- "Remove chart title" → Set title.text to empty string

## Output Format

You MUST output the COMPLETE modified Highcharts configuration as valid JSON.

Do NOT output partial configs or placeholder comments like "...rest of config".
Do NOT include explanations before or after the JSON.
Output ONLY the JSON configuration wrapped in \`\`\`json code fence.

## Critical Restrictions
- You MUST NOT return JavaScript functions anywhere in the JSON. Formatters must use Highcharts format strings or be omitted.
- Use null or remove the property if a formatter cannot be expressed as a valid format string.

Example:
\`\`\`json
{
  "chart": {
    "type": "column",
    "backgroundColor": "#FFFFFF",
    "spacing": [60, 80, 80, 80]
  },
  "title": {
    "text": "Updated Title",
    "style": { "fontSize": "20px" }
  },
  "xAxis": { /* complete xAxis config */ },
  "yAxis": { /* complete yAxis config */ },
  "series": [ /* all series */ ]
}
\`\`\`

Remember: Output the COMPLETE configuration, not just the changed parts.
`

/**
 * Apply JSON patch operations to a configuration object
 */
function sanitizeHighchartsJson(text: string): string {
  if (!text) return text

  let sanitized = text

  // Replace formatter/function definitions with null since JSON cannot contain functions
  sanitized = sanitized.replace(/:\s*function\s*\([^)]*\)\s*\{[\s\S]*?\}/g, ': null')

  // Remove trailing commas that may result from function removal
  sanitized = sanitized.replace(/,\s*(\}|\])/g, '$1')

  return sanitized
}

function applyJsonPatch(config: any, operations: Array<{path: string, op: string, value: any}>): any {
  // Deep clone the config to avoid mutations
  const modifiedConfig = JSON.parse(JSON.stringify(config))
  
  for (const operation of operations) {
    try {
      const { path, op, value } = operation
      
      if (op === 'replace') {
        setNestedProperty(modifiedConfig, path, value)
      } else if (op === 'add') {
        setNestedProperty(modifiedConfig, path, value)
      } else if (op === 'remove') {
        removeNestedProperty(modifiedConfig, path)
      }
    } catch (error) {
      console.warn(`Failed to apply operation ${operation.op} at path ${operation.path}:`, error)
    }
  }
  
  return modifiedConfig
}

/**
 * Set a nested property using dot notation path
 */
function setNestedProperty(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  let current = obj

  // Navigate to the parent of the target property
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]
    const nextIsIndex = nextKey !== undefined && !Number.isNaN(Number(nextKey))

    // Handle array indices (e.g., "series.0.data")
    if (!Number.isNaN(Number(key))) {
      const index = Number(key)
      if (!Array.isArray(current)) {
        throw new Error(`Expected array at path ${keys.slice(0, i + 1).join('.')}`)
      }
      if (!current[index]) {
        current[index] = nextIsIndex ? [] : {}
      }
      current = current[index]
    } else {
      const existingValue = current[key]

      if (existingValue === undefined || existingValue === null) {
        current[key] = nextIsIndex ? [] : {}
      } else if (typeof existingValue !== 'object') {
        current[key] = nextIsIndex ? [] : {}
      }
      current = current[key]
    }
  }

  // Set the final property
  const finalKey = keys[keys.length - 1]
  if (!Number.isNaN(Number(finalKey))) {
    const index = Number(finalKey)
    if (!Array.isArray(current)) {
      throw new Error(`Expected array at path ${path}`)
    }
    if (current.length <= index) {
      current.length = index + 1
    }
    current[index] = value
  } else {
    current[finalKey] = value
  }
}

/**
 * Remove a nested property using dot notation path
 */
function removeNestedProperty(obj: any, path: string): void {
  const keys = path.split('.')
  let current = obj
  
  // Navigate to the parent of the target property
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    
    if (!isNaN(Number(key))) {
      const index = Number(key)
      if (!Array.isArray(current) || !current[index]) {
        return // Property doesn't exist
      }
      current = current[index]
    } else {
      if (!current[key]) {
        return // Property doesn't exist
      }
      current = current[key]
    }
  }
  
  // Remove the final property
  const finalKey = keys[keys.length - 1]
  if (!isNaN(Number(finalKey))) {
    const index = Number(finalKey)
    if (Array.isArray(current)) {
      current.splice(index, 1)
    }
  } else {
    delete current[finalKey]
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { currentConfig, userRequest, chatHistory } = body

    if (!currentConfig || !userRequest) {
      return new Response(
        JSON.stringify({ error: 'Missing currentConfig or userRequest' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('✏️ Editing chart with request:', userRequest)

    // Build context with chat history if available (limit to last 5 messages)
    let conversationContext = ''
    if (chatHistory && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-5) // Only last 5 messages
      conversationContext = '\n\nPrevious conversation:\n' +
        recentHistory.map((msg: any) =>
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n')
    }

    // STAGE 1: Try patch-based editing first (fast path)
    console.log('🔍 Stage 1: Analyzing edit type and generating patches...')
    const startTime = Date.now()
    
    try {
      const patchResult = await generateObject({
        model: openai('gpt-4o-mini'), // Use mini for 2x speed
        system: CHART_PATCH_PROMPT,
        schema: chartPatchResultSchema,
        prompt: `Current Highcharts configuration:
\`\`\`json
${JSON.stringify(currentConfig, null, 2)}
\`\`\`

User Request: "${userRequest}"${conversationContext}

Identify the minimal JSON patch operations needed.`,
        temperature: 0.15,
      })

      const patchData = patchResult.object
      const operationsCount = patchData.operations?.length || 0
      console.log('📋 Patch analysis:', patchData.editType, operationsCount, 'operations')

      if (patchData.editType === 'simple' && operationsCount > 0) {
        // Apply patches to existing config
        const modifiedConfig = applyJsonPatch(currentConfig, patchData.operations)
        const patchTime = Date.now() - startTime

        console.log(`✅ Patch applied successfully in ${patchTime}ms`)

        const explanation = patchData.explanation ? [patchData.explanation] : ['Chart updated']

        return new Response(
          JSON.stringify({
            success: true,
            modifiedConfig,
            changesSummary: explanation,
            assistantMessage: generateAssistantMessage(userRequest, explanation),
            editMethod: 'patch',
            timing: patchTime
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      }
    } catch (patchError) {
      console.log('⚠️ Patch approach failed, falling back to full regeneration:', patchError)
    }

    // STAGE 2: Fallback to full regeneration (complex edits)
    console.log('🔄 Stage 2: Full regeneration for complex edit...')
    const regenerationStart = Date.now()
    
    const result = await generateText({
      model: openai('gpt-4o'),
      system: CHART_EDITOR_PROMPT,
      prompt: `Current Highcharts Configuration:
\`\`\`json
${JSON.stringify(currentConfig, null, 2)}
\`\`\`

User Request: "${userRequest}"${conversationContext}

Generate the COMPLETE modified Highcharts configuration:`,
      temperature: 0.3,
    })

    console.log('✅ Full regeneration complete')

    // Parse the modified config
    let modifiedConfig
    try {
      // Extract JSON from code fence
      const jsonMatch = result.text.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        modifiedConfig = JSON.parse(sanitizeHighchartsJson(jsonMatch[1]))
      } else {
        // Try to parse entire response
        modifiedConfig = JSON.parse(sanitizeHighchartsJson(result.text))
      }
    } catch (parseError) {
      console.error('Failed to parse modified config:', parseError)
      console.error('Agent output:', result.text)

      return new Response(
        JSON.stringify({
          error: 'Failed to parse modified configuration',
          details: parseError instanceof Error ? parseError.message : 'Unknown error',
          rawOutput: result.text
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const regenerationTime = Date.now() - regenerationStart
    console.log(`⏱️ Full regeneration took ${regenerationTime}ms`)

    // Extract what was changed (for user feedback)
    const changesSummary = extractChanges(currentConfig, modifiedConfig)

    return new Response(
      JSON.stringify({
        success: true,
        modifiedConfig,
        changesSummary,
        assistantMessage: generateAssistantMessage(userRequest, changesSummary),
        editMethod: 'full-regeneration',
        timing: regenerationTime
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Chart editing error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to edit chart',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Extract what changed between configs (for user feedback)
 */
function extractChanges(oldConfig: any, newConfig: any): string[] {
  const changes: string[] = []

  // Check common properties
  if (oldConfig.chart?.type !== newConfig.chart?.type) {
    changes.push(`Chart type changed to ${newConfig.chart.type}`)
  }

  if (oldConfig.title?.text !== newConfig.title?.text) {
    changes.push('Chart title updated')
  }

  if (JSON.stringify(oldConfig.colors) !== JSON.stringify(newConfig.colors)) {
    changes.push('Color scheme updated')
  }

  if (oldConfig.series?.length !== newConfig.series?.length) {
    changes.push(`Series count changed to ${newConfig.series?.length || 0}`)
  }

  if (oldConfig.legend?.enabled !== newConfig.legend?.enabled) {
    changes.push(newConfig.legend?.enabled ? 'Legend shown' : 'Legend hidden')
  }

  if (oldConfig.yAxis?.plotLines?.length !== newConfig.yAxis?.plotLines?.length) {
    changes.push('Reference lines updated')
  }

  // If no specific changes detected, return generic message
  if (changes.length === 0) {
    changes.push('Chart configuration updated')
  }

  return changes
}

/**
 * Generate friendly assistant message
 */
function generateAssistantMessage(userRequest: string, changes: string[]): string {
  const changesText = changes.join(', ')
  return `I've updated the chart: ${changesText}. ${
    changes.length > 1 ? 'The changes should be visible now.' : 'Let me know if you need any other adjustments!'
  }`
}
