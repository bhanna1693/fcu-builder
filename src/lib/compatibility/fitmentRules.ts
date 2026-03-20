import type { Part, PartType } from '../../schemas/partSchema'
import {
  hasGripMagazineSchemaRule,
  hasKnownGripMagazineSchemaIds,
  hasKnownSlideGripSchemaIds,
  hasKnownSlideBarrelSchemaIds,
  hasSlideGripSchemaRule,
  hasSlideBarrelSchemaRule,
} from './schemaRelations'

export const OVERHANG_TOLERANCE_IN = 0.05
export const LENGTH_TOLERANCE_IN = 0.05

export type IssueSeverity = 'error' | 'warning'

export type CompatibilityIssueCode =
  | 'missing_fcu'
  | 'fitment_class_mismatch'
  | 'rail_type_mismatch'
  | 'barrel_slide_length_mismatch'
  | 'compensator_requires_barrel'
  | 'compensator_barrel_length_mismatch'
  | 'grip_overhang'
  | 'grip_underbite'
  | 'magazine_grip_size_mismatch'

export type CompatibilityIssue = {
  severity: IssueSeverity
  code: CompatibilityIssueCode
  message: string
}

export function formatInches(n: number): string {
  // Keep it stable for tests and UI.
  return Number(n.toFixed(1)).toString()
}

export function isWithinTolerance(a: number, b: number, toleranceIn: number): boolean {
  return Math.abs(a - b) <= toleranceIn
}

export function getCompensatorEffectiveSlideDeltaIn(
  compensator: Part | undefined,
): number {
  if (!compensator) return 0
  if (compensator.type !== 'compensator') return 0
  return compensator.effective_slide_length_delta_inches ?? 0
}

export function getCompensatorRequiredBarrelLengthIn(
  compensator: Part | undefined,
): number | undefined {
  if (!compensator) return undefined
  if (compensator.type !== 'compensator') return undefined
  return compensator.required_barrel_length_inches
}

export function assertFitmentClassCompatible(args: {
  fcu: Part
  part: Part
}): CompatibilityIssue | null {
  if (args.part.fitment_class !== args.fcu.fitment_class) {
    return {
      severity: 'error',
      code: 'fitment_class_mismatch',
      message: `${args.part.type} "${args.part.model_family}" cannot fit FCU "${args.fcu.model_family}" (fitment_class mismatch).`,
    }
  }
  return null
}

export function assertRailTypeCompatible(args: {
  a: Part
  b: Part
}): CompatibilityIssue | null {
  if (args.a.rail_type !== args.b.rail_type) {
    return {
      severity: 'error',
      code: 'rail_type_mismatch',
      message: `Rail type mismatch: "${args.a.model_family}" (${args.a.rail_type}) vs "${args.b.model_family}" (${args.b.rail_type}).`,
    }
  }
  return null
}

export function assertBarrelSlideLengthCompatible(args: {
  slide: Part
  barrel: Part
  compensator?: Part
}): CompatibilityIssue | null {
  // Prefer explicit schema relations when IDs are known by the FCU schema files.
  if (hasKnownSlideBarrelSchemaIds(args.slide.id, args.barrel.id)) {
    if (hasSlideBarrelSchemaRule(args.slide.id, args.barrel.id)) {
      return null
    }
    return {
      severity: 'error',
      code: 'barrel_slide_length_mismatch',
      message: `Error: ${args.barrel.model_family} cannot fit in ${args.slide.model_family}.`,
    }
  }

  const requiredBarrelLen = getCompensatorRequiredBarrelLengthIn(args.compensator)

  if (requiredBarrelLen !== undefined) {
    if (!isWithinTolerance(args.barrel.length_inches, requiredBarrelLen, LENGTH_TOLERANCE_IN)) {
      return {
        severity: 'error',
        code: 'compensator_barrel_length_mismatch',
        message: `Compensator requires a ${formatInches(requiredBarrelLen)}in barrel, but selected barrel is ${formatInches(args.barrel.length_inches)}in.`,
      }
    }
    return null
  }

  if (!isWithinTolerance(args.barrel.length_inches, args.slide.length_inches, LENGTH_TOLERANCE_IN)) {
    return {
      severity: 'error',
      code: 'barrel_slide_length_mismatch',
      message: `Error: ${formatInches(args.barrel.length_inches)}in barrel cannot fit in ${formatInches(args.slide.length_inches)}in slide.`,
    }
  }

  return null
}

export function assertCompensatorRequiresBarrel(args: {
  compensator: Part
  barrel: Part | undefined
}): CompatibilityIssue | null {
  const requiredBarrelLen = getCompensatorRequiredBarrelLengthIn(args.compensator)
  if (requiredBarrelLen === undefined) return null
  if (!args.barrel) {
    return {
      severity: 'error',
      code: 'compensator_requires_barrel',
      message: `Compensator requires a ${formatInches(requiredBarrelLen)}in barrel.`,
    }
  }
  return null
}

export function assertGripOverhangCompatible(args: {
  slide: Part
  grip: Part
  compensator?: Part
}): CompatibilityIssue[] {
  // JSON is source of truth: validate against explicit slide<->grip compatibility pairs.
  if (hasKnownSlideGripSchemaIds(args.slide.id, args.grip.id)) {
    if (hasSlideGripSchemaRule(args.slide.id, args.grip.id)) return []
    return [
      {
        severity: 'error',
        code: 'grip_overhang',
        message: `Error: ${args.slide.model_family} is not compatible with ${args.grip.model_family}.`,
      },
    ]
  }

  return []
}

export function assertMagazineGripCompatible(args: {
  grip: Part
  magazine: Part
}): CompatibilityIssue | null {
  // For known schema IDs, require an explicit grip<->mag pair mapping.
  if (hasKnownGripMagazineSchemaIds(args.grip.id, args.magazine.id)) {
    if (hasGripMagazineSchemaRule(args.grip.id, args.magazine.id)) {
      return null
    }
    return {
      severity: 'error',
      code: 'magazine_grip_size_mismatch',
      message: `Magazine "${args.magazine.model_family}" is not compatible with grip "${args.grip.model_family}".`,
    }
  }

  return null
}

export function getPartTypesToFilter(): PartType[] {
  return ['slide', 'barrel', 'grip', 'magazine', 'compensator']
}

