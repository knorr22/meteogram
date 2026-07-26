import type { Source } from '../lib/types'
import { t } from '../lib/i18n'

export function SourceLegend({ sources }: { sources: Source[] }) {
  return (
    <div className="sources">
      <div className="sources__head">
        <span className="sources__count">{sources.length}</span> {t.sourcesLabel}
      </div>
      <div className="sources__grid">
        {sources.map((s) => (
          <div className="chip" key={s.id} title={s.org}>
            <span className="chip__flag">{s.flag}</span>
            <span className="chip__label">{s.label}</span>
            <span className="chip__org">{s.org}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
