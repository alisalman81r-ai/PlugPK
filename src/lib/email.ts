// src/lib/email.ts
import 'server-only'

import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

import nodemailer from 'nodemailer'

/**
 * Outgoing email over SMTP — Gmail (smtp.gmail.com:587 with an app password)
 * or any other provider.
 *
 *   SMTP_HOST   e.g. smtp.gmail.com
 *   SMTP_PORT   587 (STARTTLS) or 465 (TLS from the first byte)
 *   SMTP_USER   the mailbox to sign in as
 *   SMTP_PASS   its password — for Gmail, a 16-character app password
 *   MAIL_FROM   sender shown to recipients, e.g. "Plug.pk <you@gmail.com>"
 *
 * Every variable is required in every environment. There is no "print it to
 * the console instead" fallback: a verification code in a log is a code
 * anyone with log access can use. Sign-up refuses while email is not set up.
 *
 * Nothing secret is ever logged — not the password, not the message body
 * (which carries the code). Failures log the SMTP error code and response only.
 */

export interface OutgoingEmail {
  to: string
  subject: string
  text: string
  html: string
}

export interface SendResult {
  ok: boolean
  /** SMTP's reply to the message, e.g. "250 2.0.0 OK …", when it was accepted. */
  response?: string
}

/** Null when email can be sent; otherwise which setting is missing. */
export function getEmailConfigError(): string | null {
  for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'] as const) {
    if (!process.env[key]?.trim()) return `${key} is not set.`
  }
  const port = Number(process.env.SMTP_PORT)
  if (!Number.isInteger(port) || port <= 0 || port > 65535) return 'SMTP_PORT is not a port number.'
  return null
}

/**
 * Connects over IPv4.
 *
 * On some Windows machines smtp.gmail.com resolves to an IPv6 address first
 * and the connection fails with ECONNREFUSED on port 587, because the network
 * has no working IPv6 route. Every SMTP host also answers on IPv4, so the name
 * is resolved to an IPv4 address here, and the original name is kept as the
 * TLS servername — the certificate is still checked against smtp.gmail.com,
 * not against an IP address. On Vercel, IPv4 is what it would use anyway.
 */
async function ipv4For(host: string): Promise<string> {
  if (isIP(host)) return host
  try {
    const { address } = await lookup(host, { family: 4 })
    return address
  } catch {
    // No IPv4 record: let the connection resolve the name normally.
    return host
  }
}

export async function sendEmail(message: OutgoingEmail): Promise<SendResult> {
  const configError = getEmailConfigError()
  if (configError) {
    console.error('[email] not sent:', configError)
    return { ok: false }
  }

  const host = process.env.SMTP_HOST!.trim()
  const port = Number(process.env.SMTP_PORT)

  try {
    const transport = nodemailer.createTransport({
      host: await ipv4For(host),
      port,
      // 465 is TLS from the start; 587 upgrades with STARTTLS.
      secure: port === 465,
      // Refuse to send credentials over a connection that did not upgrade.
      // SMTP_REQUIRE_TLS=false exists only for a local test server.
      requireTLS: port !== 465 && process.env.SMTP_REQUIRE_TLS !== 'false',
      auth: { user: process.env.SMTP_USER!.trim(), pass: process.env.SMTP_PASS! },
      tls: { servername: isIP(host) ? undefined : host },
      connectionTimeout: 15_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    })

    const info = await transport.sendMail({
      from: process.env.MAIL_FROM!.trim(),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    })
    transport.close()

    if (info.rejected.length > 0 || info.accepted.length === 0) {
      console.error('[email] recipient refused by SMTP:', info.response)
      return { ok: false }
    }
    return { ok: true, response: info.response }
  } catch (error) {
    const e = error as { code?: string; responseCode?: number; response?: string; command?: string }
    console.error('[email] SMTP send failed:', e.code ?? 'error', e.responseCode ?? '', e.command ?? '', e.response ?? '')
    return { ok: false }
  }
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c)
}
