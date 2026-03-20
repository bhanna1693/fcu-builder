import type { Part, PartType } from '../../schemas/partSchema'
import type { BuildConfig } from './evaluateCompatibility'
import { evaluateCompatibility } from './evaluateCompatibility'
import type { CompatibilityIssue } from './fitmentRules'

export type VariantParts = Partial<
  Record<'slide' | 'barrel' | 'grip' | 'magazine' | 'compensator', Part>
>

export type BuildVariant = {
  config: BuildConfig
  parts: VariantParts
  issues: CompatibilityIssue[]
}

function cartesianProduct<T>(arrays: T[][]): T[][] {
  // MVP helper; dataset is small so a naive cartesian product is sufficient.
  return arrays.reduce<T[][]>(
    (acc, curr) => {
      const next: T[][] = []
      for (const prev of acc) {
        for (const item of curr) {
          next.push([...prev, item])
        }
      }
      return next
    },
    [[]],
  )
}

export function enumerateVariants(
  fcuId: string | undefined,
  ownedPartIdsByType: Partial<Record<PartType, string[]>>,
  catalog: Part[],
): BuildVariant[] {
  if (!fcuId) return []

  const byId = new Map<string, Part>()
  for (const part of catalog) byId.set(part.id, part)

  const slideIds = ownedPartIdsByType.slide ?? []
  const barrelIds = ownedPartIdsByType.barrel ?? []
  const gripIds = ownedPartIdsByType.grip ?? []
  const magazineIds = ownedPartIdsByType.magazine ?? []
  const compensatorIds = ownedPartIdsByType.compensator ?? []

  // For MVP: only enumerate fully buildable variants.
  if (slideIds.length === 0) return []
  if (barrelIds.length === 0) return []
  if (gripIds.length === 0) return []
  if (magazineIds.length === 0) return []

  const compensatorChoices = compensatorIds.length > 0 ? compensatorIds : [undefined]

  const combos = cartesianProduct<string>([
    slideIds,
    barrelIds,
    gripIds,
    magazineIds,
    compensatorChoices as (string | undefined)[],
  ] as unknown as string[][])

  const variants: BuildVariant[] = []

  for (const combo of combos) {
    const [slideId, barrelId, gripId, magazineId, compensatorId] = combo as [
      string,
      string,
      string,
      string,
      string | undefined,
    ]

    const config: BuildConfig = {
      fcuId,
      slideId,
      barrelId,
      gripId,
      magazineId,
      compensatorId,
    }

    const evaluation = evaluateCompatibility(config, catalog)
    const hasErrors = evaluation.issues.some((i) => i.severity === 'error')
    if (hasErrors) continue

    const parts: VariantParts = {
      slide: byId.get(slideId),
      barrel: byId.get(barrelId),
      grip: byId.get(gripId),
      magazine: byId.get(magazineId),
      ...(compensatorId ? { compensator: byId.get(compensatorId) } : {}),
    }

    variants.push({
      config,
      parts,
      issues: evaluation.issues,
    })
  }

  return variants
}

