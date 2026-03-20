import type { Part, PartType } from '../schemas/partSchema'
import { useConfigStore } from '../store/configStore'

const stackOrder: PartType[] = ['fcu', 'barrel', 'compensator', 'slide', 'grip', 'magazine']

function labelForPart(part: Part): string {
  const extra =
    part.type === 'slide' || part.type === 'barrel' || part.type === 'grip'
      ? ` (${part.length_inches.toFixed(1)}in)`
      : ''
  const aftermarketTag = part.source === 'Aftermarket' ? ' [Aftermarket]' : ''
  return `${part.brand} ${part.model_family}${extra}${aftermarketTag}`
}

export function ExplodedView() {
  const config = useConfigStore((s) => s.config)
  const getPartById = useConfigStore((s) => s.getPartById)

  const selectedByType = {
    fcu: config.fcuId ? getPartById(config.fcuId) : undefined,
    slide: config.slideId ? getPartById(config.slideId) : undefined,
    barrel: config.barrelId ? getPartById(config.barrelId) : undefined,
    grip: config.gripId ? getPartById(config.gripId) : undefined,
    magazine: config.magazineId ? getPartById(config.magazineId) : undefined,
    compensator: config.compensatorId ? getPartById(config.compensatorId) : undefined,
  } satisfies Partial<Record<PartType, Part>>

  return (
    <section className="rounded-xl border border-[var(--border)]/80 bg-white/5 p-4">
      <div className="text-sm font-semibold text-[var(--text-h)]">Exploded View</div>
      <div className="mt-1 text-xs text-[var(--text)]/80">Parts snap together logically based on compatibility rules.</div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-stretch">
        {stackOrder.map((type, idx) => {
          const part = selectedByType[type]
          return (
            <div key={type} className="flex-1 min-w-[210px]">
              <div
                className={[
                  'rounded-lg border p-3',
                  part ? 'border-[var(--accent-border)]/40 bg-white/5' : 'border-[var(--border)]/60 bg-black/5',
                ].join(' ')}
              >
                <div className="text-xs font-medium text-[var(--text-h)]">{type.toUpperCase()}</div>
                <div className="mt-1 text-xs text-[var(--text)]/90">
                  {part ? labelForPart(part) : 'Not selected'}
                </div>
              </div>
              {idx < stackOrder.length - 1 ? (
                <div className="hidden md:block mt-2 text-center text-[var(--text)]/40">{'->'}</div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

