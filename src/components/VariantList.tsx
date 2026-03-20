import { useMemo } from 'react'
import type { BuildConfig } from '../lib/compatibility/evaluateCompatibility'
import { evaluateCompatibility } from '../lib/compatibility/evaluateCompatibility'
import { partsCatalog } from '../data/parts/partsCatalog'
import { useConfigStore } from '../store/configStore'
import type { PartType } from '../schemas/partSchema'
import type { BuildVariant } from '../lib/compatibility/enumerateVariants'
import type { Part } from '../schemas/partSchema'

const stackOrder: PartType[] = ['fcu', 'barrel', 'compensator', 'slide', 'grip', 'magazine']

function labelForPart(part: Part): string {
  const extra =
    part.type === 'slide' || part.type === 'barrel' || part.type === 'grip'
      ? ` (${part.length_inches.toFixed(1)}in)`
      : ''
  const aftermarketTag = part.source === 'Aftermarket' ? ' [Aftermarket]' : ''
  return `${part.brand} ${part.model_family}${extra}${aftermarketTag}`
}

function VariantCard(props: { variant: BuildVariant; idx: number }) {
  const { variant, idx } = props

  const parts = variant.parts
  const fcuPart = variant.config.fcuId
    ? partsCatalog.find((p) => p.id === variant.config.fcuId)
    : undefined

  return (
    <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-[var(--text-h)]">
            {idx === 0 ? 'Current Build' : `Build Option ${idx + 1}`}
          </div>
          <div className="mt-0.5 text-xs text-[var(--text)]/80">
            {parts.slide ? parts.slide.model_family : '—'} + {parts.barrel ? parts.barrel.model_family : '—'}
          </div>
        </div>
        <div className="text-xs font-medium text-[var(--text)]/90">Buildable</div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-[var(--text-h)]">Exploded View</div>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {stackOrder.map((type) => {
              if (type === 'fcu') {
                const label = fcuPart ? labelForPart(fcuPart) : 'FCU selected'
                return (
                  <div key={type} className="min-w-[210px] flex-1">
                    <div className="rounded-lg border border-green-500/40 bg-white/5 p-3">
                      <div className="text-xs font-medium text-[var(--text-h)]">{type.toUpperCase()}</div>
                      <div className="mt-1 text-xs text-[var(--text)]/90">
                        {label}
                      </div>
                    </div>
                  </div>
                )
              }

              const part = parts[type as Exclude<PartType, 'fcu'>]
              return (
                <div key={type} className="min-w-[210px] flex-1">
                  <div className="rounded-lg border border-green-500/40 bg-white/5 p-3">
                    <div className="text-xs font-medium text-[var(--text-h)]">{type.toUpperCase()}</div>
                    <div className="mt-1 text-xs text-[var(--text)]/90">
                      {part ? labelForPart(part as Part) : '—'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-[var(--text-h)]">Validation</div>
          {variant.issues.length > 0 ? (
            <div className="mt-2 space-y-1">
              {variant.issues.slice(0, 6).map((issue) => (
                <div key={issue.code + issue.message} className="text-[11px] text-[var(--text)]/80">
                  {issue.severity === 'error' ? 'Error: ' : 'Warning: '}
                  {issue.message}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function VariantList() {
  const fcuId = useConfigStore((s) => s.config.fcuId)
  const ownedPartIdsByType = useConfigStore((s) => s.ownedPartIdsByType)

  const variants = useConfigStore.getState().getCompatibleVariants()

  const requiredTypes: PartType[] = ['slide', 'barrel', 'grip', 'magazine']

  const missingRequired = requiredTypes.filter((t) => (ownedPartIdsByType[t]?.length ?? 0) === 0)

  const exampleIssues = useMemo(() => {
    if (!fcuId) return []
    if (variants.length > 0) return []
    if (missingRequired.length > 0) return []

    const slideId = ownedPartIdsByType.slide?.[0]
    const barrelId = ownedPartIdsByType.barrel?.[0]
    const gripId = ownedPartIdsByType.grip?.[0]
    const magazineId = ownedPartIdsByType.magazine?.[0]
    const compensatorId = ownedPartIdsByType.compensator?.[0]

    const config: BuildConfig = {
      fcuId,
      slideId,
      barrelId,
      gripId,
      magazineId,
      compensatorId,
    }

    const evaluation = evaluateCompatibility(config, partsCatalog)
    return evaluation.issues
  }, [fcuId, missingRequired.length, ownedPartIdsByType, variants.length])

  return (
    <section className="rounded-xl border border-[var(--border)]/80 bg-white/5 p-4">
      <div className="text-sm font-semibold text-[var(--text-h)]">Build Compatibility</div>
      <div className="mt-1 text-xs text-[var(--text)]/80">
        Select parts in order to evaluate whether your current setup is compatible.
      </div>

      <div className="mt-4 space-y-3">
        {!fcuId ? (
          <div className="text-xs text-[var(--text)]/70">Select an FCU family to start.</div>
        ) : missingRequired.length > 0 ? (
          <div className="text-xs text-[var(--text)]/70">
            Select at least one of: {missingRequired.join(', ')}.
          </div>
        ) : variants.length === 0 ? (
          <>
            <div className="text-xs text-[var(--text)]/70">
              Current selection is not buildable with the chosen parts.
            </div>
            {exampleIssues.length > 0 ? (
              <div className="mt-2 space-y-1">
                {exampleIssues
                  .filter((i) => i.severity === 'error')
                  .slice(0, 4)
                  .map((issue) => (
                    <div key={issue.code + issue.message} className="text-[11px] text-red-100/90">
                      {issue.message}
                    </div>
                  ))}
              </div>
            ) : null}
          </>
        ) : (
          variants.map((variant, idx) => (
            <VariantCard key={`${variant.config.slideId ?? 'no_slide'}_${idx}`} variant={variant} idx={idx} />
          ))
        )}
      </div>
    </section>
  )
}

