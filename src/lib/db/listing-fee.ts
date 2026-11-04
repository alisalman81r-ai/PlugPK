// src/lib/db/listing-fee.ts
import 'server-only'

import type { PaymentMethod } from '@/lib/listing-application'

/**
 * What a listing costs and where the money goes.
 *
 * Both come from the environment, not from code. The fee defaults to the
 * Standard plan already published on /partners (PKR 4,999); an account number
 * has no default at all, because a made-up one would send a partner's money
 * nowhere. A method appears on the payment step only once its details are set,
 * and with none set the step says payment is unavailable rather than inventing
 * somewhere to pay.
 *
 *   LISTING_FEE_PKR                     whole rupees, default 4999
 *   PAYMENT_BANK_NAME                   e.g. Meezan Bank
 *   PAYMENT_BANK_ACCOUNT_TITLE
 *   PAYMENT_BANK_ACCOUNT_NUMBER
 *   PAYMENT_BANK_IBAN                   optional
 *   PAYMENT_JAZZCASH_NUMBER  / PAYMENT_JAZZCASH_TITLE
 *   PAYMENT_EASYPAISA_NUMBER / PAYMENT_EASYPAISA_TITLE
 */

const DEFAULT_FEE_PKR = 4999

export interface PaymentAccount<M extends PaymentMethod = PaymentMethod> {
  method: M
  /** Bank name, or the wallet's name. */
  provider: string
  accountTitle: string
  accountNumber: string
  iban: string | null
}

const env = (name: string) => process.env[name]?.trim() || null

export function getListingFee(): number {
  const raw = Number(env('LISTING_FEE_PKR'))
  return Number.isInteger(raw) && raw > 0 ? raw : DEFAULT_FEE_PKR
}

export function getPaymentAccounts(): PaymentAccount<Exclude<PaymentMethod, 'demo'>>[] {
  const accounts: PaymentAccount<Exclude<PaymentMethod, 'demo'>>[] = []

  const bankNumber = env('PAYMENT_BANK_ACCOUNT_NUMBER')
  const bankTitle = env('PAYMENT_BANK_ACCOUNT_TITLE')
  if (bankNumber && bankTitle) {
    accounts.push({
      method: 'bank',
      provider: env('PAYMENT_BANK_NAME') ?? 'Bank transfer',
      accountTitle: bankTitle,
      accountNumber: bankNumber,
      iban: env('PAYMENT_BANK_IBAN'),
    })
  }

  for (const [method, provider] of [
    ['jazzcash', 'JazzCash'],
    ['easypaisa', 'Easypaisa'],
  ] as const) {
    const number = env(`PAYMENT_${method.toUpperCase()}_NUMBER`)
    const title = env(`PAYMENT_${method.toUpperCase()}_TITLE`)
    if (number && title) {
      accounts.push({ method, provider, accountTitle: title, accountNumber: number, iban: null })
    }
  }

  return accounts
}

/** True when the test-only demo payment is switched on (DEMO_PAYMENT_ENABLED=true). */
export function isDemoPaymentEnabled(): boolean {
  return env('DEMO_PAYMENT_ENABLED') === 'true'
}

/**
 * Where a listing fee can be paid: the real accounts, plus the demo payment
 * while DEMO_PAYMENT_ENABLED=true. For testing only, until a card gateway is
 * connected — never switch it on in production.
 */
export function getListingPaymentAccounts(): PaymentAccount[] {
  const accounts: PaymentAccount[] = [...getPaymentAccounts()]
  if (isDemoPaymentEnabled()) {
    accounts.push({ method: 'demo', provider: 'Test mode', accountTitle: 'plugpk test', accountNumber: '0000', iban: null })
  }
  return accounts
}
