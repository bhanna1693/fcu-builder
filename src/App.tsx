import { partsCatalog } from './data/parts/partsCatalog'
import { p365Presets } from './presets/p365Presets'
import { rxmPresets } from './presets/rxmPresets'
import { useConfigStore } from './store/configStore'
import { FCUFamilyPicker } from './components/FCUFamilyPicker'
import { OwnedPartsPicker } from './components/OwnedPartsPicker'
import { VariantList } from './components/VariantList'
import type { PartType } from './schemas/partSchema'

const allPresets = [...p365Presets, ...rxmPresets]

function App() {
  const parts = partsCatalog

  const hasCompensators = parts.some((p) => p.type === 'compensator')
  const setPart = useConfigStore((s) => s.setPart)
  const clearOwned = useConfigStore((s) => s.clearOwned)

  return (
    <div className="min-h-[100svh] bg-[var(--bg)] p-4">
      <header className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-h)]">
              Modular Firearm Configuration Engine
            </h1>
            <div className="mt-1 text-sm text-[var(--text)]/80">
              Select an FCU and build a compatible parts set. Validation runs live.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {allPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="rounded-lg border border-[var(--border)]/80 bg-white/5 px-3 py-2 text-sm text-[var(--text-h)] hover:bg-white/10"
                title={preset.description}
                onClick={() => {
                  clearOwned()

                  if (preset.selections.fcu) {
                    setPart('fcu', preset.selections.fcu)
                  }

                  for (const [type, partId] of Object.entries(preset.selections) as Array<[PartType, string | undefined]>) {
                    if (type === 'fcu') continue
                    if (!partId) continue
                    setPart(type, partId)
                  }
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-6xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <FCUFamilyPicker />

            <OwnedPartsPicker type="grip" title="Grips" />
            <OwnedPartsPicker type="slide" title="Slides" />
            <OwnedPartsPicker type="barrel" title="Barrels" />
            <OwnedPartsPicker type="magazine" title="Magazines" />

            {hasCompensators ? <OwnedPartsPicker type="compensator" title="Compensators (Optional)" /> : null}
          </div>

          <VariantList />
        </div>
      </main>
    </div>
  )
}

export default App
