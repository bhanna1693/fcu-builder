import { create } from 'zustand'
import {
  evaluateCompatibility,
  type BuildConfig,
  type CompatibilityEvaluation,
} from '../lib/compatibility/evaluateCompatibility'
import { partsCatalog } from '../data/parts/partsCatalog'
import type { Part, PartType } from '../schemas/partSchema'
import { enumerateVariants } from '../lib/compatibility/enumerateVariants'

type OwnedPartsByTypeState = Partial<Record<PartType, string[]>>

const configKeyByType: Record<PartType, keyof BuildConfig> = {
  fcu: 'fcuId',
  slide: 'slideId',
  barrel: 'barrelId',
  grip: 'gripId',
  magazine: 'magazineId',
  compensator: 'compensatorId',
}

const downstreamTypesByType: Partial<Record<PartType, PartType[]>> = {
  grip: ['slide', 'barrel', 'magazine', 'compensator'],
  slide: ['barrel', 'compensator'],
  barrel: ['compensator'],
}

export type ShoppingListItem = {
  part: Part
  reason: 'selected' | 'suggested'
  owned: boolean
}

export type ConfigState = {
  config: BuildConfig

  setPart: (type: PartType, partId: string | undefined) => void
  setOwned: (partId: string, owned: boolean) => void
  toggleOwned: (partId: string) => void
  clearOwned: () => void

  getEvaluation: () => CompatibilityEvaluation
  isBuildFunctional: () => boolean

  ownedPartIds: string[]
  ownedPartIdsByType: OwnedPartsByTypeState

  toggleOwnedPartId: (type: PartType, partId: string) => void
  setOwnedPartId: (type: PartType, partId: string, owned: boolean) => void

  // Reverse-workflow: list buildable variants derived from multi-selected owned parts.
  getCompatibleVariants: () => ReturnType<typeof enumerateVariants>

  getShoppingList: () => ShoppingListItem[]
  getPartById: (id: string) => Part | undefined
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: {},
  ownedPartIdsByType: {},
  ownedPartIds: [],

  setPart: (type, partId) => {
    const key = configKeyByType[type]
    set((state) => {
      const nextOwnedByType: OwnedPartsByTypeState = { ...state.ownedPartIdsByType }
      if (type !== 'fcu') {
        nextOwnedByType[type] = partId ? [partId] : []
      }

      const nextOwnedPartIds = Array.from(
        new Set(Object.values(nextOwnedByType).flatMap((ids) => ids ?? [])),
      )

      return {
        config: {
          ...state.config,
          [key]: partId,
        },
        ownedPartIdsByType: nextOwnedByType,
        ownedPartIds: nextOwnedPartIds,
      }
    })
  },

  setOwned: (partId, owned) => {
    const part = partsCatalog.find((p) => p.id === partId)
    if (!part) return
    const type = part.type
    set((state) => {
      const current = state.ownedPartIdsByType[type] ?? []
      // Single-select per part type: keep at most one selected ID.
      const next = owned ? [partId] : current.filter((id) => id !== partId)
      const nextOwnedByType: OwnedPartsByTypeState = {
        ...state.ownedPartIdsByType,
        [type]: next,
      }
      // If empty array, drop key to keep serialized state compact.
      if (next.length === 0) delete nextOwnedByType[type]

      const nextOwnedPartIds = Array.from(
        new Set(Object.values(nextOwnedByType).flatMap((ids) => ids ?? [])),
      )

      const nextConfig: BuildConfig = { ...state.config }
      if (type !== 'fcu') {
        const cfgKey = configKeyByType[type]
        nextConfig[cfgKey] = next[0]
      }

      return {
        ownedPartIdsByType: nextOwnedByType,
        ownedPartIds: nextOwnedPartIds,
        config: nextConfig,
      }
    })
  },

  toggleOwned: (partId) => {
    const currentlyOwned = get().ownedPartIds.includes(partId)
    get().setOwned(partId, !currentlyOwned)
  },

  clearOwned: () =>
    set((state) => {
      const nextConfig: BuildConfig = { ...state.config }
      for (const type of Object.keys(configKeyByType) as PartType[]) {
        if (type === 'fcu') continue
        const key = configKeyByType[type]
        nextConfig[key] = undefined
      }
      return { ownedPartIdsByType: {}, ownedPartIds: [], config: nextConfig }
    }),

  getPartById: (id) => partsCatalog.find((p) => p.id === id),

  getEvaluation: () => evaluateCompatibility(get().config, partsCatalog),

  isBuildFunctional: () => {
    const variants = get().getCompatibleVariants()
    return Boolean(get().config.fcuId) && variants.length > 0
  },

  getShoppingList: () => {
    const state = get()
    const evaluation = state.getEvaluation()

    const requiredTypes: PartType[] = ['slide', 'barrel', 'grip', 'magazine']
    if (state.config.compensatorId) requiredTypes.push('compensator')

    const items: ShoppingListItem[] = []
    for (const type of requiredTypes) {
      const key = configKeyByType[type]
      const selectedId = state.config[key]
      const suggestedId = evaluation.suggestedPartIdsByType[type]?.[0]
      const chosenId = (selectedId ?? suggestedId) as string | undefined
      if (!chosenId) continue

      const part = partsCatalog.find((p) => p.id === chosenId)
      if (!part) continue

      const owned = state.ownedPartIds.includes(chosenId)
      if (!owned) {
        items.push({
          part,
          reason: selectedId ? 'selected' : 'suggested',
          owned: false,
        })
      }
    }

    return items
  },

  toggleOwnedPartId: (type, partId) => {
    const current = get().ownedPartIdsByType[type] ?? []
    const owned = current.includes(partId)
    get().setOwnedPartId(type, partId, !owned)
  },

  setOwnedPartId: (type, partId, owned) => {
    set((state) => {
      const current = state.ownedPartIdsByType[type] ?? []
      // Single-select per part type: selecting one replaces previous selection.
      const next = owned ? [partId] : current.filter((id) => id !== partId)
      const nextOwnedByType: OwnedPartsByTypeState = { ...state.ownedPartIdsByType }
      if (next.length === 0) delete nextOwnedByType[type]
      else nextOwnedByType[type] = next

      // Keep dependency order consistent by clearing downstream selections
      // when an upstream selection changes.
      const didChangePrimarySelection = current[0] !== next[0]
      if (didChangePrimarySelection) {
        for (const downstreamType of downstreamTypesByType[type] ?? []) {
          delete nextOwnedByType[downstreamType]
        }
      }

      const nextOwnedPartIds = Array.from(
        new Set(Object.values(nextOwnedByType).flatMap((ids) => ids ?? [])),
      )

      const nextConfig: BuildConfig = { ...state.config }
      if (type !== 'fcu') {
        const cfgKey = configKeyByType[type]
        nextConfig[cfgKey] = next[0]
      }
      if (didChangePrimarySelection) {
        for (const downstreamType of downstreamTypesByType[type] ?? []) {
          const cfgKey = configKeyByType[downstreamType]
          nextConfig[cfgKey] = undefined
        }
      }

      return {
        ownedPartIdsByType: nextOwnedByType,
        ownedPartIds: nextOwnedPartIds,
        config: nextConfig,
      }
    })
  },

  getCompatibleVariants: () =>
    enumerateVariants(get().config.fcuId, get().ownedPartIdsByType, partsCatalog),
}))

