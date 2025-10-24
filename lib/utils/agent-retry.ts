import { z } from 'zod'

/**
 * Result of agent retry operation
 */
export interface RetryResult<T> {
  success: boolean
  data: T | null
  attempts: number
  error?: string
}

/**
 * Options for agent retry behavior
 */
export interface RetryOptions {
  maxRetries: number
  agentName: string
  onRetry?: (attempt: number, error: string) => void
}

/**
 * Sanitize AI-generated JSON by removing comments and fixing common issues
 */
function sanitizeJSON(jsonString: string): string {
  let cleaned = jsonString

  // Remove single-line comments
  cleaned = cleaned.replace(/\/\/.*$/gm, '')

  // Remove multi-line comments
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '')

  // Remove trailing commas before closing brackets/braces
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1')

  return cleaned.trim()
}

/**
 * Extract first JSON block from text (with or without code fence)
 */
function extractJsonFromText(text: string): string | null {
  // Try to find JSON in code fence first
  const fencedMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  if (fencedMatch && fencedMatch[1]) {
    return fencedMatch[1]
  }

  // Try to find raw JSON object
  const rawMatch = text.match(/\{[\s\S]*\}/)
  if (rawMatch) {
    return rawMatch[0]
  }

  return null
}

/**
 * Wait for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry agent with JSON parsing and Zod validation
 *
 * @param agentFn - Function that calls the agent and returns text output
 * @param schema - Zod schema to validate the parsed JSON
 * @param options - Retry configuration options
 * @returns Promise with validation result and metadata
 *
 * @example
 * const result = await retryAgentWithValidation(
 *   async () => (await generateText({ model, system, prompt })).text,
 *   dataTransformerOutputSchema,
 *   { maxRetries: 2, agentName: 'Data Transformer' }
 * )
 *
 * if (result.success) {
 *   console.log('Validated data:', result.data)
 * }
 */
export async function retryAgentWithValidation<T>(
  agentFn: () => Promise<string>,
  schema: z.ZodSchema<T>,
  options: RetryOptions
): Promise<RetryResult<T>> {
  const { maxRetries, agentName, onRetry } = options
  const totalAttempts = maxRetries + 1 // maxRetries=2 means 3 total attempts

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      console.log(`⚙️ [${agentName}] Attempt ${attempt}/${totalAttempts}...`)

      // Call the agent
      const agentOutput = await agentFn()

      // Extract JSON from output
      const jsonString = extractJsonFromText(agentOutput)

      if (!jsonString) {
        const error = 'No JSON found in agent output'
        console.warn(`⚠️ [${agentName}] Attempt ${attempt} failed: ${error}`)

        if (attempt < totalAttempts) {
          const waitTime = Math.pow(2, attempt - 1) * 1000 // Exponential backoff: 0s, 2s, 4s
          if (waitTime > 0) {
            console.log(`⏳ [${agentName}] Retrying in ${waitTime / 1000}s...`)
            if (onRetry) onRetry(attempt, error)
            await delay(waitTime)
          }
          continue
        }

        return {
          success: false,
          data: null,
          attempts: attempt,
          error
        }
      }

      // Sanitize and parse JSON
      const sanitized = sanitizeJSON(jsonString)
      let parsed: any

      try {
        parsed = JSON.parse(sanitized)
      } catch (parseError) {
        const error = `JSON parse error: ${parseError instanceof Error ? parseError.message : 'Unknown'}`
        console.warn(`⚠️ [${agentName}] Attempt ${attempt} failed: ${error}`)

        if (attempt < totalAttempts) {
          const waitTime = Math.pow(2, attempt - 1) * 1000
          if (waitTime > 0) {
            console.log(`⏳ [${agentName}] Retrying in ${waitTime / 1000}s...`)
            if (onRetry) onRetry(attempt, error)
            await delay(waitTime)
          }
          continue
        }

        return {
          success: false,
          data: null,
          attempts: attempt,
          error
        }
      }

      // Validate with Zod schema
      const validationResult = schema.safeParse(parsed)

      if (validationResult.success) {
        console.log(`✅ [${agentName}] Success on attempt ${attempt}`)
        return {
          success: true,
          data: validationResult.data,
          attempts: attempt
        }
      } else {
        const error = 'Schema validation failed'
        console.error(`❌ [${agentName}] Attempt ${attempt} failed: ${error}`)
        console.error(`Validation errors:`, validationResult.error.format())

        if (attempt < totalAttempts) {
          const waitTime = Math.pow(2, attempt - 1) * 1000
          if (waitTime > 0) {
            console.log(`⏳ [${agentName}] Retrying in ${waitTime / 1000}s...`)
            if (onRetry) onRetry(attempt, error)
            await delay(waitTime)
          }
          continue
        }

        return {
          success: false,
          data: null,
          attempts: attempt,
          error: `${error}: ${JSON.stringify(validationResult.error.format())}`
        }
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ [${agentName}] Attempt ${attempt} threw error:`, errorMsg)

      if (attempt < totalAttempts) {
        const waitTime = Math.pow(2, attempt - 1) * 1000
        if (waitTime > 0) {
          console.log(`⏳ [${agentName}] Retrying in ${waitTime / 1000}s...`)
          if (onRetry) onRetry(attempt, errorMsg)
          await delay(waitTime)
        }
        continue
      }

      return {
        success: false,
        data: null,
        attempts: attempt,
        error: errorMsg
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  return {
    success: false,
    data: null,
    attempts: totalAttempts,
    error: 'Max retries exceeded'
  }
}

/**
 * Simpler retry function for parsing already-fetched agent text output
 * Useful when you already have the agent output and just need to parse/validate
 */
export function parseAndValidateAgentOutput<T>(
  agentOutput: string,
  schema: z.ZodSchema<T>,
  agentName: string
): RetryResult<T> {
  try {
    // Extract JSON from output
    const jsonString = extractJsonFromText(agentOutput)

    if (!jsonString) {
      console.warn(`⚠️ [${agentName}] No JSON found in output`)
      return {
        success: false,
        data: null,
        attempts: 1,
        error: 'No JSON found in agent output'
      }
    }

    // Sanitize and parse JSON
    const sanitized = sanitizeJSON(jsonString)
    const parsed = JSON.parse(sanitized)

    // Validate with Zod schema
    const validationResult = schema.safeParse(parsed)

    if (validationResult.success) {
      console.log(`✅ [${agentName}] Output validated successfully`)
      return {
        success: true,
        data: validationResult.data,
        attempts: 1
      }
    } else {
      console.error(`❌ [${agentName}] Validation failed:`, validationResult.error.format())
      return {
        success: false,
        data: null,
        attempts: 1,
        error: `Schema validation failed: ${JSON.stringify(validationResult.error.format())}`
      }
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ [${agentName}] Parse error:`, errorMsg)
    return {
      success: false,
      data: null,
      attempts: 1,
      error: errorMsg
    }
  }
}
