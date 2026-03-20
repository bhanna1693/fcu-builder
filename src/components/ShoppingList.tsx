import { useConfigStore } from '../store/configStore'

function labelForItem(itemLabel: string): string {
  return itemLabel
}

export function ShoppingList() {
  const setOwned = useConfigStore((s) => s.setOwned)

  // Avoid calling `getShoppingList()` inside a Zustand selector (can cause loops).
  // Computing during render is safe because this component is not the source of state writes.
  const shoppingList = useConfigStore.getState().getShoppingList()

  const hasItems = shoppingList.length > 0

  return (
    <section className="rounded-xl border border-[var(--border)]/80 bg-white/5 p-4">
      <div className="text-sm font-semibold text-[var(--text-h)]">Shopping List</div>
      <div className="mt-1 text-xs text-[var(--text)]/80">
        Missing parts derived from your current (and compatible) build.
      </div>

      <div className="mt-4 space-y-3">
        {!hasItems ? (
          <div className="text-xs text-[var(--text)]/90">
            You have all required parts marked as owned for the current functional build.
          </div>
        ) : null}

        {shoppingList.map((item) => (
          <div
            key={item.part.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)]/60 bg-black/5 p-3"
          >
            <div>
              <div className="text-xs font-medium text-[var(--text-h)]">
                {labelForItem(item.part.model_family)}
              </div>
              <div className="mt-1 text-[11px] text-[var(--text)]/80">
                {item.part.brand} • {item.part.type}{' '}
                <span className="text-[var(--text)]/70">
                  {item.part.source === 'Aftermarket' ? 'Aftermarket' : 'OEM'}
                </span>
              </div>
              {item.reason === 'selected' ? (
                <div className="mt-1 text-[11px] text-[var(--text)]/70">Selected but not owned</div>
              ) : (
                <div className="mt-1 text-[11px] text-[var(--text)]/70">Suggested but not owned</div>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-h)]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--accent)]"
                checked={item.owned}
                onChange={() => setOwned(item.part.id, true)}
              />
              Mark owned
            </label>
          </div>
        ))}
      </div>
    </section>
  )
}

