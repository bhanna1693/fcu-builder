import type { Part, PartType } from '../../schemas/partSchema'
import {
  assertBarrelSlideLengthCompatible,
  assertCompensatorRequiresBarrel,
  assertGripOverhangCompatible,
  assertMagazineGripCompatible,
  assertRailTypeCompatible,
  assertFitmentClassCompatible,
  getPartTypesToFilter,
  type CompatibilityIssue,
  OVERHANG_TOLERANCE_IN,
  LENGTH_TOLERANCE_IN,
} from './fitmentRules'

export type BuildConfig = {
  fcuId?: string
  slideId?: string
  barrelId?: string
  gripId?: string
  magazineId?: string
  compensatorId?: string
}

const configKeyByType: Record<PartType, keyof BuildConfig> = {
  fcu: 'fcuId',
  slide: 'slideId',
  barrel: 'barrelId',
  grip: 'gripId',
  magazine: 'magazineId',
  compensator: 'compensatorId',
}

export type CompatibilityEvaluation = {
  issues: CompatibilityIssue[]
  compatiblePartIdsByType: Partial<Record<PartType, string[]>>
  suggestedPartIdsByType: Partial<Record<PartType, string[]>>
}

function getSelectedParts(config: BuildConfig, partsById: Map<string, Part>): {
  fcu?: Part
  byType: Partial<Record<PartType, Part>>
} {
  const byType: Partial<Record<PartType, Part>> = {}
  const fcu = config.fcuId ? partsById.get(config.fcuId) : undefined
  if (fcu) byType.fcu = fcu

  for (const type of getPartTypesToFilter()) {
    const key = configKeyByType[type]
    const id = config[key]
    if (id) {
      const part = partsById.get(id)
      if (part) byType[type] = part
    }
  }

  return { fcu, byType }
}

function computeIssues(config: BuildConfig, partsById: Map<string, Part>): CompatibilityIssue[] {
  const { fcu, byType } = getSelectedParts(config, partsById)
  const issues: CompatibilityIssue[] = []

  if (!fcu) {
    issues.push({
      severity: 'warning',
      code: 'missing_fcu',
      message: 'Select an FCU to evaluate compatibility.',
    })
    return issues
  }

  for (const type of Object.keys(byType) as PartType[]) {
    if (type === 'fcu') continue
    const part = byType[type]
    if (!part) continue
    const fitmentIssue = assertFitmentClassCompatible({ fcu, part })
    if (fitmentIssue) issues.push(fitmentIssue)
  }

  const slide = byType.slide
  const barrel = byType.barrel
  const grip = byType.grip
  const magazine = byType.magazine
  const compensator = byType.compensator

  // Rail type sanity (slide<->barrel, slide<->grip, grip<->barrel if needed).
  if (slide && barrel) {
    const railIssue = assertRailTypeCompatible({ a: slide, b: barrel })
    if (railIssue) issues.push(railIssue)
  }
  if (slide && grip) {
    const railIssue = assertRailTypeCompatible({ a: slide, b: grip })
    if (railIssue) issues.push(railIssue)
  }

  // Compensator barrel requirement (if compensator defines it).
  if (compensator) {
    const compIssue = assertCompensatorRequiresBarrel({ compensator, barrel })
    if (compIssue) issues.push(compIssue)
  }

  // Barrel vs slide length, with compensator acting as an override.
  if (slide && barrel) {
    const lenIssue = assertBarrelSlideLengthCompatible({
      slide,
      barrel,
      compensator,
    })
    if (lenIssue) issues.push(lenIssue)
  }

  // Slide vs grip overhang/underbite uses compensator's effective delta.
  if (slide && grip) {
    const gripIssues = assertGripOverhangCompatible({ slide, grip, compensator })
    issues.push(...gripIssues)
  }

  // Magazine capacity vs grip size.
  if (grip && magazine) {
    const magGripIssue = assertMagazineGripCompatible({ grip, magazine })
    if (magGripIssue) issues.push(magGripIssue)
  }

  return issues
}

function sourcePriority(source: Part['source']): number {
  return source === 'OEM' ? 0 : 1
}

export function evaluateCompatibility(
  config: BuildConfig,
  catalog: Part[],
  options?: {
    overhangToleranceIn?: number
    lengthToleranceIn?: number
  },
): CompatibilityEvaluation {
  // For MVP: we keep constants in one place; options are placeholders for later tuning.
  void options

  const partsById = new Map<string, Part>()
  for (const part of catalog) partsById.set(part.id, part)

  const issues = computeIssues(config, partsById)

  const fcu = config.fcuId ? partsById.get(config.fcuId) : undefined

  const compatiblePartIdsByType: Partial<Record<PartType, string[]>> = {}

  // If no FCU, compatibility filtering can't be FCU-centric yet.
  if (fcu) {
    for (const type of getPartTypesToFilter()) {
      const candidates = catalog.filter((p) => p.type === type)
      const compatible: string[] = []

      for (const candidate of candidates) {
        const nextConfig: BuildConfig = {
          ...config,
          [configKeyByType[type]]: candidate.id,
        }

        const candidateIssues = computeIssues(nextConfig, partsById)
        const hasErrors = candidateIssues.some((i) => i.severity === 'error')
        if (!hasErrors) compatible.push(candidate.id)
      }

      compatiblePartIdsByType[type] = compatible
    }
  }

  const suggestedPartIdsByType: Partial<Record<PartType, string[]>> = {}
  for (const type of getPartTypesToFilter()) {
    const key = configKeyByType[type]
    const alreadySelected = config[key]
    if (alreadySelected) {
      suggestedPartIdsByType[type] = [alreadySelected as string]
      continue
    }

    const compatibleIds = compatiblePartIdsByType[type] ?? []
    if (compatibleIds.length === 0) continue

    const compatibleParts = compatibleIds
      .map((id) => partsById.get(id))
      .filter((p): p is Part => Boolean(p))

    compatibleParts.sort((a, b) => {
      const sp = sourcePriority(a.source) - sourcePriority(b.source)
      if (sp !== 0) return sp
      const fam = a.model_family.localeCompare(b.model_family)
      if (fam !== 0) return fam
      return a.brand.localeCompare(b.brand)
    })

    suggestedPartIdsByType[type] = [compatibleParts[0].id]
  }

  return {
    issues,
    compatiblePartIdsByType,
    suggestedPartIdsByType,
  }
}

export const compatibilityConstants = {
  OVERHANG_TOLERANCE_IN,
  LENGTH_TOLERANCE_IN,
}

