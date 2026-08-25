// src/lib/db/car-source-queries.ts
import 'server-only'

/**
 * The staging layer, for application code.
 *
 * A re-export of car-source-store.ts behind the `server-only` guard. The split
 * exists because the crawler needs the same functions from a plain Node script,
 * where `server-only` throws on import — so the implementation lives in a module
 * without the guard, and this file is what the app imports.
 *
 * Import this from server components and server actions. Import the store
 * directly only from crawler scripts.
 */
export * from './car-source-store'
