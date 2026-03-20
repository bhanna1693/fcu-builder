import { z } from 'zod'

export const partTypeSchema = z.enum([
  'fcu',
  'slide',
  'barrel',
  'grip',
  'magazine',
  'compensator',
])

export type PartType = z.infer<typeof partTypeSchema>

export const partSourceSchema = z.enum(['OEM', 'Aftermarket'])
export type PartSource = z.infer<typeof partSourceSchema>

/**
 * Core “Parts” record used by the compatibility engine.
 *
 * Note: For the MVP we treat `length_inches` as:
 * - `slide`/`barrel`: physical length
 * - `grip`: effective fitment reference length for overhang checks
 * - other types: allow `0` where not applicable
 */
export const partSchema = z
  .object({
    id: z.string().min(1),
    type: partTypeSchema,

    brand: z.string().min(1),
    model_family: z.string().min(1),

    // Primary many-to-many compatibility key across FCU and parts.
    fitment_class: z.string().min(1),

    // Used by compatibility rules (slide/barrel length, slide/grip overhang, etc).
    length_inches: z.number().finite(),

    rail_type: z.string().min(1),

    source: partSourceSchema.default('OEM'),
    tags: z.array(z.string()).optional().default([]),

    // Compensator special-case overrides.
    required_barrel_length_inches: z.number().finite().optional(),
    effective_slide_length_delta_inches: z.number().finite().optional(),

  })
  .superRefine((part, ctx) => {
    const isComp = part.type === 'compensator'

    // Keep the data model simple: these rule fields should only exist on compensators.
    if (!isComp) {
      if (part.required_barrel_length_inches !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['required_barrel_length_inches'],
          message: 'Only compensators can define required_barrel_length_inches.',
        })
      }
      if (part.effective_slide_length_delta_inches !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['effective_slide_length_delta_inches'],
          message: 'Only compensators can define effective_slide_length_delta_inches.',
        })
      }
    }
  })

export type Part = z.infer<typeof partSchema>

// Explicit JSON schema object for interoperability/documentation.
export const partJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://example.com/schemas/part.schema.json',
  title: 'Part',
  type: 'object',
  required: [
    'id',
    'type',
    'brand',
    'model_family',
    'fitment_class',
    'length_inches',
    'rail_type',
    'source',
    'tags',
  ],
  properties: {
    id: { type: 'string', minLength: 1 },
    type: { type: 'string', enum: ['fcu', 'slide', 'barrel', 'grip', 'magazine', 'compensator'] },
    brand: { type: 'string', minLength: 1 },
    model_family: { type: 'string', minLength: 1 },
    fitment_class: { type: 'string', minLength: 1 },
    length_inches: { type: 'number' },
    rail_type: { type: 'string', minLength: 1 },
    source: { type: 'string', enum: ['OEM', 'Aftermarket'] },
    tags: { type: 'array', items: { type: 'string' } },

    required_barrel_length_inches: { type: 'number' },
    effective_slide_length_delta_inches: { type: 'number' },
  },
  additionalProperties: false,
}

export function parsePartsCatalog(parts: unknown): Part[] {
  const parsed = z.array(partSchema).parse(parts)
  return parsed
}

