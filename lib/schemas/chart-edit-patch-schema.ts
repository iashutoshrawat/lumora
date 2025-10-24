import { z } from 'zod'

const jsonPatchOperationSchema = z.object({
  path: z.string().min(1),
  op: z.enum(['replace', 'add', 'remove']),
  value: z.any().optional()
}).refine(
  (operation) => operation.op === 'remove' || operation.value !== undefined,
  {
    message: 'Add and replace operations require a value',
    path: ['value']
  }
)

export const chartPatchResultSchema = z.object({
  editType: z.enum(['simple', 'complex']).default('complex'),
  operations: z.array(jsonPatchOperationSchema).default([]),
  explanation: z.string().optional()
})

export type ChartPatchResult = z.infer<typeof chartPatchResultSchema>
export type ChartPatchOperation = z.infer<typeof jsonPatchOperationSchema>
