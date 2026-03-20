import { useMemo } from 'react'
import type { Part, PartType } from '../schemas/partSchema'
import { useConfigStore } from '../store/configStore'
import { partsCatalog } from '../data/parts/partsCatalog'
import { evaluateCompatibility, type BuildConfig } from '../lib/compatibility/evaluateCompatibility'

const cfgKeyMap: Record<PartType, keyof BuildConfig> = {
  fcu: 'fcuId',
  slide: 'slideId',
  barrel: 'barrelId',
  grip: 'gripId',
  magazine: 'magazineId',
  compensator: 'compensatorId',
}

const dependencyTypesByType: Record<Exclude<PartType, 'fcu'>, PartType[]> = {
  grip: [],
  slide: ['grip'],
  barrel: ['slide'],
  magazine: ['grip'],
  compensator: ['barrel'],
}

function missingDependencyReason(
  type: Exclude<PartType, 'fcu'>,
  ownedPartIdsByType: Partial<Record<PartType, string[]>>,
): string | null {
  const requiredTypes = dependencyTypesByType[type]
  for (const requiredType of requiredTypes) {
    if ((ownedPartIdsByType[requiredType]?.length ?? 0) === 0) {
      return `Select ${requiredType} first.`
    }
  }
  return null
}

/**
 * For `candidateId` of `type`, check whether it has a compatibility error
 * against selected upstream dependencies for this type.
 *
 * Returns the first error message if a conflict exists, null otherwise.
 */
function getConflictReason(
  candidateId: string,
  type: Exclude<PartType, 'fcu'>,
  fcuId: string,
  ownedPartIdsByType: Partial<Record<PartType, string[]>>,
): string | null {
  const requiredTypes = dependencyTypesByType[type]

  for (const otherType of requiredTypes) {
    for (const otherPartId of ownedPartIdsByType[otherType] ?? []) {
      const config: BuildConfig = {
        fcuId,
        [cfgKeyMap[type]]: candidateId,
        [cfgKeyMap[otherType]]: otherPartId,
      }
      const evaluation = evaluateCompatibility(config, partsCatalog)
      const firstError = evaluation.issues.find((i) => i.severity === 'error')
      if (firstError) return firstError.message
    }
  }

  return null
}

export function OwnedPartsPicker(props: {
  type: Exclude<PartType, 'fcu'>
  title: string
}) {
  const { type, title } = props

  const fcuId = useConfigStore((s) => s.config.fcuId)
  const fcu = useConfigStore((s) => (s.config.fcuId ? s.getPartById(s.config.fcuId) : undefined))
  const ownedPartIdsByType = useConfigStore((s) => s.ownedPartIdsByType)
  const setOwnedPartId = useConfigStore((s) => s.setOwnedPartId)
  const setPart = useConfigStore((s) => s.setPart)

  const partsOfType = useMemo(() => {
    if (!fcu) return []
    const fitmentClass = fcu.fitment_class
    return (partsCatalog.filter((p) => p.type === type && p.fitment_class === fitmentClass) as Part[]).sort((a, b) => {
      const aSrc = a.source === 'OEM' ? 0 : 1
      const bSrc = b.source === 'OEM' ? 0 : 1
      if (aSrc !== bSrc) return aSrc - bSrc
      return a.model_family.localeCompare(b.model_family)
    })
  }, [fcu, type])

  // Stable reference: the array from the store (or undefined), used in the dep array.
  const ownedIdsForType = ownedPartIdsByType[type]
  const ownedIds = ownedIdsForType ?? []

  // Compute conflict reasons for every candidate up front so the render is simple.
  const conflictReasonById = useMemo(() => {
    if (!fcuId) return new Map<string, string | null>()
    const dependencyReason = missingDependencyReason(type, ownedPartIdsByType)
    const map = new Map<string, string | null>()
    const currentOwned = ownedIdsForType ?? []
    for (const part of partsOfType) {
      if (currentOwned.includes(part.id)) {
        // Already checked — no point blocking it.
        map.set(part.id, null)
      } else if (dependencyReason) {
        map.set(part.id, dependencyReason)
      } else {
        map.set(part.id, getConflictReason(part.id, type, fcuId, ownedPartIdsByType))
      }
    }
    return map
  }, [fcuId, partsOfType, ownedIdsForType, type, ownedPartIdsByType])

  return (
    <section className="rounded-xl border border-[var(--border)]/80 bg-white/5 p-4">
      <div className="text-sm font-semibold text-[var(--text-h)]">{title}</div>
      <div className="mt-1 text-xs text-[var(--text)]/80">Choose one part. Incompatible options are disabled.</div>

      {!fcuId ? (
        <div className="mt-3 text-xs text-[var(--text)]/70">Select an FCU family to see compatible parts.</div>
      ) : (
        <div className="mt-3 space-y-2">
          {partsOfType.length === 0 ? (
            <div className="text-xs text-[var(--text)]/70">No parts found for this FCU family yet.</div>
          ) : null}
          {partsOfType.map((part) => {
            const selectedId = ownedIds[0]
            const checked = selectedId === part.id
            const conflictReason = conflictReasonById.get(part.id) ?? null
            const isDisabled = !checked && conflictReason !== null

            return (
              <label
                key={part.id}
                title={conflictReason ?? part.fitment_class}
                className={[
                  'flex items-center justify-between gap-3 rounded-lg border px-3 py-2',
                  isDisabled
                    ? 'cursor-not-allowed border-[var(--border)]/30 bg-black/5 opacity-40'
                    : 'cursor-pointer border-[var(--border)]/50 bg-black/5 hover:border-[var(--border)]',
                ].join(' ')}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-xs text-[var(--text-h)]">
                    {part.model_family}{' '}
                    {part.source === 'Aftermarket' ? (
                      <span className="text-[10px] text-[var(--accent)]/80">[Aftermarket]</span>
                    ) : null}
                  </span>
                  {isDisabled && conflictReason ? (
                    <span className="text-[10px] text-red-400/80">{conflictReason}</span>
                  ) : null}
                </div>
                <input
                  type="radio"
                  name={`part-${type}`}
                  checked={checked}
                  disabled={isDisabled}
                  onChange={() => {
                    if (!isDisabled) setOwnedPartId(type, part.id, true)
                  }}
                  className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                />
              </label>
            )
          })}
          {type === 'compensator' ? (
            <button
              type="button"
              className="mt-1 text-xs text-[var(--text)]/70 underline decoration-dotted underline-offset-2 hover:text-[var(--text)]"
              onClick={() => setPart(type, undefined)}
            >
              Clear compensator selection
            </button>
          ) : null}
        </div>
      )}
    </section>
  )
}
