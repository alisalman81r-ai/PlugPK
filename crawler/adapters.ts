// crawler/adapters.ts

import { openEvAdapter } from './sources/openev'
import { evdbAdapter } from './sources/evdb'
import { evspecsxAdapter } from './sources/evspecsx'
import { vehdbAdapter } from './sources/vehdb'
import type { SourceAdapter } from './sources/types'

/**
 * The adapter registry, in a module that does nothing when imported.
 *
 * It used to live in run.ts, which calls main() at module scope — so importing
 * the registry from the daily orchestrator would have run the single-source
 * command as a side effect of starting the scheduled one. A registry has to be
 * importable without consequences.
 */
export const ADAPTERS: Record<string, SourceAdapter> = {
  openev: openEvAdapter,
  evdb: evdbAdapter,
  vehdb: vehdbAdapter,
  evspecsx: evspecsxAdapter,
}

export function adapterFor(id: string): SourceAdapter | undefined {
  return ADAPTERS[id]
}

/**
 * Re-exported so existing callers keep working.
 *
 * The implementation moved to match-input.ts, which imports no source modules —
 * see the note there. Nothing about the mapping changed.
 */
export { toMatchInput } from './match-input'
