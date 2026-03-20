import type { Part } from '../../schemas/partSchema'

type SchemaSlide = {
  id: string
  name: string
  length?: number
  compatible_barrels?: string[]
}

type SchemaBarrel = {
  id: string
  name: string
  length: number
}

type SchemaGrip = {
  id: string
  name: string
  flush_mag_cap?: number
}

type SchemaMagazine = {
  id: string
  capacity: number
  compatible_grips?: string[]
  fits_grips?: string[]
}

type PlatformSchema = {
  platform: string
  components: {
    slides: SchemaSlide[]
    barrels: SchemaBarrel[]
    grip_modules: SchemaGrip[]
    magazines: SchemaMagazine[]
  }
}

function brandForPlatform(platform: string): string {
  if (platform === 'SIG_P365') return 'Sig Sauer'
  if (platform === 'RUGER_RXM') return 'Ruger'
  return platform
}

function modelForPlatform(platform: string): string {
  return platform.replaceAll('_', ' ')
}

function fitmentClassForPlatform(platform: string): string {
  return platform.toLowerCase().replaceAll('_', '-')
}

function getSlideLengthIn(slide: SchemaSlide, barrelById: Map<string, SchemaBarrel>): number {
  if (typeof slide.length === 'number' && Number.isFinite(slide.length)) {
    return slide.length
  }

  const firstFromList = slide.compatible_barrels?.[0]
  if (firstFromList) {
    const len = barrelById.get(firstFromList)?.length
    if (len !== undefined) return len
  }
  return 0
}

export function convertFcuSchemaToParts(schema: PlatformSchema): Part[] {
  const fitmentClass = fitmentClassForPlatform(schema.platform)
  const brand = brandForPlatform(schema.platform)
  const modelFamily = modelForPlatform(schema.platform)
  const railType = `${fitmentClass}-rail`
  const parts: Part[] = []

  parts.push({
    id: `fcu_${fitmentClass}`,
    type: 'fcu',
    brand,
    model_family: modelFamily,
    fitment_class: fitmentClass,
    length_inches: 0,
    rail_type: railType,
    source: 'OEM',
    tags: ['OEM'],
  })

  const barrelById = new Map<string, SchemaBarrel>()
  for (const barrel of schema.components.barrels) {
    barrelById.set(barrel.id, barrel)
    parts.push({
      id: barrel.id,
      type: 'barrel',
      brand,
      model_family: barrel.name,
      fitment_class: fitmentClass,
      length_inches: barrel.length,
      rail_type: railType,
      source: 'OEM',
      tags: ['OEM'],
    })
  }

  for (const slide of schema.components.slides) {
    parts.push({
      id: slide.id,
      type: 'slide',
      brand,
      model_family: slide.name,
      fitment_class: fitmentClass,
      length_inches: getSlideLengthIn(slide, barrelById),
      rail_type: railType,
      source: 'OEM',
      tags: ['OEM'],
    })
  }

  for (const grip of schema.components.grip_modules) {
    parts.push({
      id: grip.id,
      type: 'grip',
      brand,
      model_family: grip.name,
      fitment_class: fitmentClass,
      // Grip length is not used by rules; keep neutral value.
      length_inches: 0,
      rail_type: railType,
      source: 'OEM',
      tags: ['OEM'],
    })
  }

  for (const mag of schema.components.magazines) {
    parts.push({
      id: mag.id,
      type: 'magazine',
      brand,
      model_family: `${modelFamily} ${mag.capacity}rd`,
      fitment_class: fitmentClass,
      length_inches: 0,
      rail_type: railType,
      source: 'OEM',
      tags: ['OEM', `${mag.capacity}rd`],
    })
  }

  return parts
}
