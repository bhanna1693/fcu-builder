import { useMemo } from 'react'
import type { Part, PartType } from '../schemas/partSchema'
import { useConfigStore } from '../store/configStore'
import { evaluateCompatibility, type BuildConfig } from '../lib/compatibility/evaluateCompatibility'
import { partsCatalog } from '../data/parts/partsCatalog'

const configKeyByType: Record<PartType, keyof BuildConfig> = {
  fcu: 'fcuId',
  slide: 'slideId',
  barrel: 'barrelId',
  grip: 'gripId',
  magazine: 'magazineId',
  compensator: 'compensatorId',
}

export function PartSelector(props: {
  type: PartType
  title: string
  partsOfType: Part[]
}) {
  const { type, title, partsOfType } = props

  const config = useConfigStore((s) => s.config)
  const setPart = useConfigStore((s) => s.setPart)
  const ownedPartIds = useConfigStore((s) => s.ownedPartIds)
  const toggleOwned = useConfigStore((s) => s.toggleOwned)
  const selectedId = config[configKeyByType[type]] as string | undefined

  const evaluation = useMemo(() => {
    return evaluateCompatibility(config, partsCatalog)
  }, [config])

  const isFcuSelected = Boolean(config.fcuId)

  const { compatibleIds, reasonById } = useMemo(() => {
    if (!isFcuSelected) {
      return {
        compatibleIds: new Set(partsOfType.map((p) => p.id)),
        reasonById: new Map<string, string>(),
      }
    }

    const ids = evaluation.compatiblePartIdsByType[type] ?? []
    const compatSet = new Set(ids)

    const reasonMap = new Map<string, string>()
    for (const candidate of partsOfType) {
      if (compatSet.has(candidate.id)) continue

      const nextConfig = {
        ...config,
        [configKeyByType[type]]: candidate.id,
      }
      const nextEval = evaluateCompatibility(nextConfig, partsCatalog)
      const firstError = nextEval.issues.find((i) => i.severity === 'error')
      if (firstError) reasonMap.set(candidate.id, firstError.message)
    }

    return { compatibleIds: compatSet, reasonById: reasonMap }
  }, [evaluation, config, isFcuSelected, partsOfType, type])

  return (
    <div className="rounded-xl border border-[var(--border)]/80 bg-white/5 p-4 dark:bg-black/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-[var(--text-h)]">{title}</div>
          <div className="mt-1 text-xs text-[var(--text)]/70">Pick a compatible part for the selected FCU.</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <select
          className="w-full rounded-lg border border-[var(--border)]/80 bg-white/5 px-3 py-2 text-sm text-[var(--text-h)] outline-none focus:border-[var(--accent-border)]"
          value={selectedId ?? ''}
          onChange={(e) => {
            const next = e.target.value || undefined
            setPart(type, next)
          }}
        >
          <option value="" disabled>
            Select...
          </option>
          {partsOfType.map((part) => {
            const isSelected = part.id === selectedId
            const enabled = isSelected || compatibleIds.has(part.id)
            const reason = reasonById.get(part.id)

            return (
              <option
                key={part.id}
                value={part.id}
                disabled={!enabled}
                title={reason ?? ''}
              >
                {part.model_family} ({part.type}) {part.source === 'Aftermarket' ? '[Aftermarket]' : ''}
              </option>
            )
          })}
        </select>
      </div>

      {selectedId ? (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-[var(--text-h)]">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--accent)]"
            checked={ownedPartIds.includes(selectedId)}
            onChange={() => toggleOwned(selectedId)}
          />
          Mark as owned
        </label>
      ) : null}
    </div>
  )
}

