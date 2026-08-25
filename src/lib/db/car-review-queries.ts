// src/lib/db/car-review-queries.ts
import 'server-only'

/**
 * The review layer, for application code.
 *
 * A re-export of car-review-store.ts behind the `server-only` guard, matching
 * car-source-queries.ts. The crawler needs the same functions from a plain Node
 * script, where `server-only` throws on import — so the implementation lives
 * unguarded and this is what server components and actions import.
 */
export * from './car-review-store'
