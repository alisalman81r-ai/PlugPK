// src/components/admin/audit-format.ts

/**
 * How an audit row reads on screen.
 *
 * Action names are written by the server actions as `<target>.<verb>`. The
 * table translates the ones this portal writes and falls back to the raw name
 * for anything else, so an action added elsewhere still shows up — just less
 * prettily — rather than vanishing from the log.
 */
const ACTION_LABELS: Record<string, string> = {
  'station.create': 'Created station',
  'station.update': 'Edited station',
  'station.delete': 'Deleted station',
  'connector.create': 'Added connector',
  'connector.update': 'Edited connector',
  'connector.delete': 'Deleted connector',
  'connector.availability': 'Changed free ports',
  'service.create': 'Created service',
  'service.update': 'Edited service',
  'service.delete': 'Deleted service',
  'post.review': 'Marked post reviewed',
  'post.delete': 'Deleted post',
  'comment.delete': 'Deleted comment',
  'review.delete': 'Deleted review',
  'car.create': 'Added car',
  'car.update': 'Edited car',
  'car.delete': 'Deleted car',
  'car.photo-set': 'Changed car photo',
  'car.photo-remove': 'Removed car photo',
  'member.delete': 'Deleted member',
  'member.anonymise': 'Anonymised member',
  'member.password-reset': 'Reset password',
  'member.grant-admin': 'Granted admin',
  'member.revoke-admin': 'Revoked admin',
  'app-release.create': 'Drafted app update',
  'app-release.update': 'Edited app update',
  'app-release.send': 'Sent app update to users',
  'app-release.delete': 'Deleted app update',
}

export function actionLabel(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action]
  const [target, verb] = action.split('.')
  if (!verb) return action
  return `${verb.charAt(0).toUpperCase()}${verb.slice(1).replace(/-/g, ' ')} ${target}`
}

/** Where the record lives in the portal, when it has a page of its own. */
export function targetHref(targetType: string, targetId: string | null): string | null {
  if (!targetId) return null
  switch (targetType) {
    case 'station':
      return `/admin/stations/${targetId}`
    case 'connector':
      return `/admin/connectors/${targetId}`
    case 'service':
      return `/admin/services/${targetId}`
    case 'business':
      return `/admin/businesses/${targetId}`
    // A car's id mirrors its slug, which is what its admin URL uses.
    case 'car':
      return `/admin/cars/${targetId}`
    case 'member':
      return `/admin/members/${targetId}`
    case 'meeting':
      return '/admin/meetings'
    case 'app-release':
      return '/admin/app/releases'
    default:
      // Posts, comments and reviews are moderated from their lists and have
      // no page of their own.
      return null
  }
}

/** A deleted record has no page to open; the link would only 404. */
export function isDeletion(action: string): boolean {
  return action.endsWith('.delete')
}

export const AUDIT_TARGETS = [
  'station',
  'connector',
  'service',
  'business',
  'car',
  'post',
  'comment',
  'review',
  'meeting',
  'member',
  'app-release',
] as const

/** Absolute time in Pakistan, so the log reads the same from any server. */
export function formatAuditTime(iso: string): string {
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
