import { useMemo } from 'react'
import { partsCatalog } from '../data/parts/partsCatalog'
import { useConfigStore } from '../store/configStore'
import type { Part } from '../schemas/partSchema'

type FamilyOption = {
  familyKey: string
  representativeFcuId: string
  label: string
}

function labelForFcuFamily(option: FamilyOption): string {
  return option.label
}

export function FCUFamilyPicker() {
  const fcuId = useConfigStore((s) => s.config.fcuId)
  const setPart = useConfigStore((s) => s.setPart)
  const clearOwned = useConfigStore((s) => s.clearOwned)

  const familyOptions = useMemo(() => {
    const fcuParts = partsCatalog.filter((p) => p.type === 'fcu') as Part[]
    const byFamily = new Map<string, Part>()
    for (const part of fcuParts) {
      if (!byFamily.has(part.model_family)) byFamily.set(part.model_family, part)
    }
    const options: FamilyOption[] = []
    for (const [familyKey, representative] of byFamily.entries()) {
      options.push({
        familyKey,
        representativeFcuId: representative.id,
        label: familyKey,
      })
    }
    options.sort((a, b) => a.label.localeCompare(b.label))
    return options
  }, [])

  const selectedFamilyKey = useMemo(() => {
    if (!fcuId) return undefined
    const part = partsCatalog.find((p) => p.id === fcuId)
    return part?.model_family
  }, [fcuId])

  return (
    <section className="rounded-xl border border-[var(--border)]/80 bg-white/5 p-4">
      <div className="text-sm font-semibold text-[var(--text-h)]">FCU Family</div>
      <div className="mt-1 text-xs text-[var(--text)]/80">
        Choose the FCU family first; parts are filtered by `fitment_class`.
      </div>

      <div className="mt-3">
        <select
          className="w-full rounded-lg border border-[var(--border)]/80 bg-white/5 px-3 py-2 text-sm text-[var(--text-h)] outline-none focus:border-[var(--accent-border)]"
          value={selectedFamilyKey ?? ''}
          onChange={(e) => {
            const nextFamilyKey = e.target.value
            const option = familyOptions.find((o) => o.familyKey === nextFamilyKey)
            if (!option) return

            // Reset the user's selected components when changing the FCU family.
            clearOwned()
            setPart('fcu', option.representativeFcuId)
          }}
        >
          <option value="" disabled>
            Select family...
          </option>
          {familyOptions.map((option) => (
            <option key={option.familyKey} value={option.familyKey}>
              {labelForFcuFamily(option)}
            </option>
          ))}
        </select>
      </div>
    </section>
  )
}

