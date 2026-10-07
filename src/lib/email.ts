// src/lib/email.ts
import 'server-only'

/**
 * Sending email, through Resend (https://resend.com).
 *
 * Called straight over its HTTP API with fetch, so there is no SDK to install
 * and nothing about it reaches the browser: this module is server-only and the
 * key is read from RESEND_API_KEY, never a NEXT_PUBLIC_ variable.
 *
 *   RESEND_API_KEY   the API key (server-only secret)
 *   EMAIL_FROM       who the mail is from, e.g. "Plug.pk <hello@plug.pk>".
 *                    The domain must be verified in Resend to send to anyone.
 *                    Without it, Resend's test sender is used, which only
 *                    delivers to the email address that owns the Resend account.
 *
 * With no key in local development the message is printed to the server
 * console instead — including the link — so the flow can be used and tested
 * without an account. Without a key in production nothing is sent and the
 * caller is told, so it can say so rather than claim an email went out.
 */

export interface OutgoingEmail {
  to: string
  subject: string
  html: string
  text: string
}

export type SendResult = { ok: true } | { ok: false; reason: 'not-configured' | 'failed' }

const DEFAULT_FROM = 'Plug.pk <onboarding@resend.dev>'

export async function sendEmail(email: OutgoingEmail): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(
        `\n[email] RESEND_API_KEY is not set, so this was not sent.\n` +
          `  To: ${email.to}\n  Subject: ${email.subject}\n\n${email.text}\n`,
      )
      return { ok: true }
    }
    console.error('[email] RESEND_API_KEY is not set; cannot send:', email.subject)
    return { ok: false, reason: 'not-configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
      // A slow provider must not hang sign-up indefinitely.
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      // The body explains the failure (unverified domain, bad key…). It goes
      // to the server log only; it never reaches the visitor.
      console.error('[email] Resend rejected the message:', response.status, await response.text())
      return { ok: false, reason: 'failed' }
    }
    return { ok: true }
  } catch (error) {
    console.error('[email] could not reach Resend:', error)
    return { ok: false, reason: 'failed' }
  }
}
