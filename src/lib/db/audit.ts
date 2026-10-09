// src/lib/db/audit.ts
import 'server-only'

import { randomUUID } from 'node:crypto'

import type { AdminActor } from './admin-access'
import { prisma } from './client'

/**
 * The operator audit trail.
 *
 * Every admin action that changes data calls this after the change succeeds,
 * with the actor that assertAdmin() returned. Writing it never fails the
 * action: the change has already happened, and refusing to report success
 * because the log row could not be written would invite a retry that does the
 * change twice.
 */

export type AuditTarget =
  | 'station'
  | 'connector'
  | 'service'
  | 'business'
  | 'car'
  | 'post'
  | 'comment'
  | 'review'
  | 'meeting'
  | 'member'
  | 'app-release'

export async function logAdminAction(
  actor: AdminActor,
  action: string,
  targetType: AuditTarget,
  targetId: string | null,
  summary?: string,
): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        id: randomUUID(),
        actorId: actor.id,
        actorEmail: actor.email,
        action,
        targetType,
        targetId,
        summary: summary?.slice(0, 500) ?? null,
      },
    })
  } catch (error) {
    console.error('[audit] could not record admin action', { action, targetType, targetId }, error)
  }
}

export interface AuditEntry {
  id: string
  actorEmail: string | null
  action: string
  targetType: string
  targetId: string | null
  summary: string | null
  createdAt: string
}

export async function listAuditLog(options: {
  take?: number
  skip?: number
  targetType?: string
  targetId?: string
} = {}): Promise<{ entries: AuditEntry[]; total: number }> {
  const where = {
    ...(options.targetType ? { targetType: options.targetType } : {}),
    ...(options.targetId ? { targetId: options.targetId } : {}),
  }
  const [rows, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.take ?? 50,
      skip: options.skip ?? 0,
    }),
    prisma.adminAuditLog.count({ where }),
  ])
  return {
    total,
    entries: rows.map((row) => ({
      id: row.id,
      actorEmail: row.actorEmail,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      summary: row.summary,
      createdAt: row.createdAt.toISOString(),
    })),
  }
}
