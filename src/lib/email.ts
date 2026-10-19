// src/lib/email.ts
import 'server-only'

import { SITE_CONFIG } from '@/lib/constants'

/**
 * Outgoing email, through Resend's HTTP API.
 *
 * A plain fetch rather than the SDK: one endpoint, one request shape, and no
 * dependency to keep current for it.
 *
 * Production needs RESEND_API_KEY and EMAIL_FROM, and fails closed without
 * them — sign-up refuses rather than create accounts nobody can verify. In
 * development, with no key, the message is printed to the server console
 * instead, so the whole flow can be clicked through locally.
 */

export interface OutgoingEmail {
  to: string
  subject: string
  text: string
  html: string
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/** Null when email can be sent (or printed, in development). */
export function getEmailConfigError(): string | null {
  if (!isProduction()) return null
  if (!process.env.RESEND_API_KEY) return 'RESEND_API_KEY is not set.'
  if (!process.env.EMAIL_FROM) return 'EMAIL_FROM is not set.'
  return null
}

/**
 * The origin links in emails point at.
 *
 * Never taken from the request's Host header: that is chosen by whoever sends
 * the request, and would let them have our server mail a real member a link
 * to their own site.
 */
export function appOrigin(): string {
  const configured = process.env.APP_URL?.trim().replace(/\/+$/, '')
  if (configured) return configured
  return isProduction() ? SITE_CONFIG.url : 'http://localhost:3000'
}

export async function sendEmail(message: OutgoingEmail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY

  if (!key) {
    if (isProduction()) {
      console.error('[email] not sent:', getEmailConfigError())
      return false
    }
    console.info(
      `\n[email] RESEND_API_KEY is not set, so this was not sent:\n` +
        `  to:      ${message.to}\n  subject: ${message.subject}\n\n${message.text}\n`,
    )
    return true
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? `Plug.pk <${SITE_CONFIG.email}>`,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      cache: 'no-store',
    })
    if (!response.ok) {
      console.error('[email] Resend refused the message:', response.status, await response.text())
      return false
    }
    return true
  } catch (error) {
    console.error('[email] could not reach Resend:', error)
    return false
  }
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c)
}
