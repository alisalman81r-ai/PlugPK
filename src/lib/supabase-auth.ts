// src/lib/supabase-auth.ts
import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { SITE_CONFIG } from '@/lib/constants'

/**
 * Supabase Auth, used from the server only.
 *
 * Supabase holds every password and sends the confirmation and reset emails.
 * The website never hands a Supabase session to the browser: once Supabase
 * says who someone is, the website issues its own session cookie
 * (src/lib/db/session.ts), so admin access, the mobile app API and every
 * server action keep working exactly as before.
 *
 *   SUPABASE_URL               https://<project>.supabase.co
 *   SUPABASE_ANON_KEY          the public "anon" / publishable key
 *   SUPABASE_SERVICE_ROLE_KEY  the secret key, for admin calls (password set by
 *                              an operator, deleting an account). Never sent to
 *                              a browser and never prefixed NEXT_PUBLIC_.
 *
 * A fresh client per call, with no session persistence: a client that kept a
 * signed-in user in memory could leak one request's identity into the next.
 */

const CLIENT_OPTIONS = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
} as const

export function getSupabaseAuthConfigError(): string | null {
  if (!process.env.SUPABASE_URL) return 'SUPABASE_URL is not set.'
  if (!process.env.SUPABASE_ANON_KEY) return 'SUPABASE_ANON_KEY is not set.'
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return 'SUPABASE_SERVICE_ROLE_KEY is not set.'
  return null
}

/** Acts as an anonymous visitor: sign up, sign in, confirm, resend, reset. */
export function supabasePublic(): SupabaseClient {
  return createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_ANON_KEY ?? '', CLIENT_OPTIONS)
}

/** Service-role client for auth.admin calls. Bypasses every Supabase rule. */
export function supabaseAdmin(): SupabaseClient {
  return createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '', CLIENT_OPTIONS)
}

/**
 * The origin emailed links come back to.
 *
 * Never taken from the request's Host header: whoever sends a request chooses
 * it, and could have Supabase mail a real member a link to their own site.
 * Supabase also refuses any redirect not on the project's allow list.
 */
export function appOrigin(): string {
  const configured = process.env.APP_URL?.trim().replace(/\/+$/, '')
  if (configured) return configured
  return process.env.NODE_ENV === 'production' ? SITE_CONFIG.url : 'http://localhost:3000'
}

/** Supabase's error code, when it sent one. */
export function authErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code
  }
  return undefined
}

/** Plain-language messages for the Supabase errors a person can act on. */
export function authErrorMessage(error: unknown): string | null {
  switch (authErrorCode(error)) {
    case 'weak_password':
      return 'Choose a stronger password: at least 8 characters with a letter and a number.'
    case 'same_password':
      return 'Choose a password different from your current one.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many emails were sent just now. Please wait a few minutes and try again.'
    case 'email_address_invalid':
      return 'Enter a valid email address.'
    case 'signup_disabled':
      return 'Creating accounts is unavailable right now. Please try again later.'
    default:
      return null
  }
}
