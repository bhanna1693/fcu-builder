import { useMemo } from 'react'
import { evaluateCompatibility } from '../lib/compatibility/evaluateCompatibility'
import { partsCatalog } from '../data/parts/partsCatalog'
import { useConfigStore } from '../store/configStore'

export function ValidationPanel() {
  const config = useConfigStore((s) => s.config)

  const evaluation = useMemo(() => evaluateCompatibility(config, partsCatalog), [config])
  const errorIssues = evaluation.issues.filter((i) => i.severity === 'error')
  const warningIssues = evaluation.issues.filter((i) => i.severity === 'warning')

  const functional = Boolean(config.fcuId) && errorIssues.length === 0

  return (
    <aside
      className={[
        'rounded-xl border p-4',
        functional ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10',
      ].join(' ')}
    >
      <div className="text-sm font-semibold text-[var(--text-h)]">Validation</div>

      <div className="mt-1 text-xs text-[var(--text)]/80">
        {functional ? 'Build is functional' : 'Compatibility gaps detected'}
      </div>

      <div className="mt-3 space-y-2">
        {errorIssues.length > 0 ? (
          <>
            <div className="text-xs font-medium text-red-200/90">Errors</div>
            {errorIssues.slice(0, 8).map((issue) => (
              <div key={issue.code + issue.message} className="text-xs text-red-100/90">
                {issue.message}
              </div>
            ))}
          </>
        ) : null}

        {errorIssues.length === 0 && warningIssues.length > 0 ? (
          <>
            <div className="text-xs font-medium text-yellow-200/90">Warnings</div>
            {warningIssues.slice(0, 6).map((issue) => (
              <div key={issue.code + issue.message} className="text-xs text-yellow-100/90">
                {issue.message}
              </div>
            ))}
          </>
        ) : null}

        {functional ? (
          <div className="text-xs text-[var(--text)]/90">
            Green means all selected parts pass compatibility rules.
          </div>
        ) : null}
      </div>
    </aside>
  )
}

