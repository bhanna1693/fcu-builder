import p365Schema from '../../data/fcu_schemas/p365.json'
import rxmSchema from '../../data/fcu_schemas/rxm.json'

type SchemaSlide = {
  id: string
  compatible_grips?: string[]
}

type SchemaBarrel = {
  id: string
  compatible_slides?: string[]
}

type SchemaGrip = {
  id: string
  compatible_mags?: string[]
  compatible_slides?: string[]
}

type SchemaMagazine = {
  id: string
  compatible_grips?: string[]
  fits_grips?: string[]
}

type PlatformSchema = {
  components: {
    slides: SchemaSlide[]
    barrels: SchemaBarrel[]
    grip_modules: SchemaGrip[]
    magazines: SchemaMagazine[]
  }
}

function getSchemas(): PlatformSchema[] {
  return [p365Schema as PlatformSchema, rxmSchema as PlatformSchema]
}

function buildSlideBarrelPairSet(): Set<string> {
  const pairs = new Set<string>()
  for (const schema of getSchemas()) {
    for (const barrel of schema.components.barrels) {
      for (const slideId of barrel.compatible_slides ?? []) {
        pairs.add(`${slideId}::${barrel.id}`)
      }
    }
  }
  return pairs
}

function buildGripMagazinePairSet(): Set<string> {
  const pairs = new Set<string>()
  for (const schema of getSchemas()) {
    const magsById = new Map<string, SchemaMagazine>()
    for (const mag of schema.components.magazines) magsById.set(mag.id, mag)

    for (const grip of schema.components.grip_modules) {
      for (const magId of grip.compatible_mags ?? []) {
        pairs.add(`${grip.id}::${magId}`)
      }
    }

    for (const mag of schema.components.magazines) {
      const gripIds = mag.compatible_grips ?? mag.fits_grips ?? []
      for (const gripId of gripIds) {
        pairs.add(`${gripId}::${mag.id}`)
      }
    }

    // Keep only grip/mag pairs where both IDs are known.
    for (const pair of Array.from(pairs)) {
      const [, magId] = pair.split('::')
      if (!magsById.has(magId)) continue
    }
  }
  return pairs
}

function buildSlideGripPairSet(): Set<string> {
  const pairs = new Set<string>()
  for (const schema of getSchemas()) {
    for (const slide of schema.components.slides) {
      for (const gripId of slide.compatible_grips ?? []) {
        pairs.add(`${slide.id}::${gripId}`)
      }
    }
    for (const grip of schema.components.grip_modules) {
      for (const slideId of grip.compatible_slides ?? []) {
        pairs.add(`${slideId}::${grip.id}`)
      }
    }
  }
  return pairs
}

const slideBarrelPairs = buildSlideBarrelPairSet()
const gripMagazinePairs = buildGripMagazinePairSet()
const slideGripPairs = buildSlideGripPairSet()
const knownSchemaSlideIds = new Set(Array.from(slideBarrelPairs, (pair) => pair.split('::')[0]))
const knownSchemaBarrelIds = new Set(Array.from(slideBarrelPairs, (pair) => pair.split('::')[1]))
const knownSchemaGripIds = new Set(Array.from(gripMagazinePairs, (pair) => pair.split('::')[0]))
const knownSchemaMagazineIds = new Set(Array.from(gripMagazinePairs, (pair) => pair.split('::')[1]))
for (const pair of slideGripPairs) {
  const [slideId, gripId] = pair.split('::')
  knownSchemaSlideIds.add(slideId)
  knownSchemaGripIds.add(gripId)
}

export function hasSlideBarrelSchemaRule(slideId: string, barrelId: string): boolean {
  return slideBarrelPairs.has(`${slideId}::${barrelId}`)
}

export function hasKnownSlideBarrelSchemaIds(slideId: string, barrelId: string): boolean {
  return knownSchemaSlideIds.has(slideId) && knownSchemaBarrelIds.has(barrelId)
}

export function hasGripMagazineSchemaRule(gripId: string, magazineId: string): boolean {
  return gripMagazinePairs.has(`${gripId}::${magazineId}`)
}

export function hasKnownGripMagazineSchemaIds(gripId: string, magazineId: string): boolean {
  return knownSchemaGripIds.has(gripId) && knownSchemaMagazineIds.has(magazineId)
}

export function hasSlideGripSchemaRule(slideId: string, gripId: string): boolean {
  return slideGripPairs.has(`${slideId}::${gripId}`)
}

export function hasKnownSlideGripSchemaIds(slideId: string, gripId: string): boolean {
  return knownSchemaSlideIds.has(slideId) && knownSchemaGripIds.has(gripId)
}
