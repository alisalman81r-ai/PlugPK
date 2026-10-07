// src/lib/emails/verify-email.ts
import 'server-only'

/**
 * The "verify your email" message.
 *
 * Tables and inline styles, because that is what email clients render
 * reliably; the colours are the site's (pine #05241E, turquoise #4FDCC4).
 * Every value interpolated into the HTML is escaped. The plain-text part
 * carries the same link for clients that block HTML.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function verificationEmail({
  name,
  url,
  expiresInHours,
}: {
  name: string
  url: string
  expiresInHours: number
}): { subject: string; html: string; text: string } {
  const firstName = name.trim().split(/\s+/)[0] || 'there'
  const safeName = escapeHtml(firstName)
  const safeUrl = escapeHtml(url)
  const subject = 'Verify your email for Plug.pk'

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F4;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;">
      <tr><td style="background:#05241E;padding:24px 32px;">
        <span style="font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.02em;">&#9889; plug<span style="color:#4FDCC4;">.pk</span></span>
      </td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#05241E;">Verify your email address</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Hi ${safeName},</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">
          Thanks for creating a Plug.pk account. Press the button below to confirm that this email address belongs to you. You can sign in once it is verified.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:12px;background:#4FDCC4;">
          <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:700;color:#05241E;text-decoration:none;border-radius:12px;">Verify Email</a>
        </td></tr></table>
        <p style="margin:24px 0 8px;font-size:13px;line-height:1.6;color:#64748B;">
          This link expires in ${expiresInHours} hours and can be used once. If the button does not work, copy this address into your browser:
        </p>
        <p style="margin:0 0 24px;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${safeUrl}" style="color:#0F766E;">${safeUrl}</a></p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748B;">
          If you did not create a Plug.pk account, you can ignore this email — nothing will happen.
        </p>
      </td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid #E2E8F0;font-size:12px;color:#94A3B8;">
        Plug.pk — EV chargers, route planning and cars in Pakistan.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`

  const text = [
    `Hi ${firstName},`,
    '',
    'Thanks for creating a Plug.pk account. Open the link below to confirm that this email address belongs to you. You can sign in once it is verified.',
    '',
    url,
    '',
    `This link expires in ${expiresInHours} hours and can be used once.`,
    '',
    'If you did not create a Plug.pk account, you can ignore this email.',
    '',
    '— Plug.pk',
  ].join('\n')

  return { subject, html, text }
}
