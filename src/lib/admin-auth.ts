// src/lib/admin-auth.ts
import 'server-only'

/**
 * Whether the operator portal exists at all.
 *
 * ENABLE_ADMIN is enforced in middleware, before any page code runs, so with
 * the flag unset /admin 404s exactly like an unknown path.
 *
 * Who may use the portal is decided by User.isAdmin on a normal account
 * session (src/lib/db/admin-access.ts). The shared-password cookie that used
 * to sit beside it is retired: it carried no identity, could not be revoked,
 * and let a demoted operator keep access by deleting their account cookie.
 */

/** Name of the retired shared-password cookie, kept so sign-out still clears it. */
export const LEGACY_ADMIN_COOKIE_NAME = 'plugpk_admin'

export function isAdminEnabled(): boolean {
  return process.env.ENABLE_ADMIN === 'true'
}
