// src/lib/db/client.ts
import { PrismaClient } from '@prisma/client'

/**
 * A single PrismaClient for the process.
 *
 * Next's dev server hot-reloads modules on every edit. Without this cache,
 * each reload constructs another client and opens another connection pool,
 * and after a few dozen saves the database starts refusing connections. The
 * global is skipped in production, where modules are loaded once.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
