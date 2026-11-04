// src/components/business/host/PayoutAccountFields.tsx
'use client'

import { Banknote, Smartphone } from '@/components/ui/icons'

import { PAYOUT_METHOD_LABEL, PAYOUT_METHODS, type PayoutMethod } from '@/lib/charger-host'
import { IN } from '@/components/admin/network-kit'
import { cn } from '@/lib/utils'

import { DocumentPicker } from '../application/DocumentPicker'

export interface PayoutDraft {
  method: PayoutMethod
  provider: string
  accountTitle: string
  accountNumber: string
  iban: string
  qr?: File
}

export const EMPTY_PAYOUT: PayoutDraft = { method: 'jazzcash', provider: '', accountTitle: '', accountNumber: '', iban: '' }

const FIELD = IN

/** The form's own check, matching the server's. */
export function payoutProblem(value: PayoutDraft): string | null {
  if (!value.accountTitle.trim()) return 'Enter the account title — the name the account is registered to.'
  if (value.method === 'bank') {
    if (!value.provider.trim()) return 'Enter the bank name.'
    if (!/^[A-Za-z0-9 -]{6,34}$/.test(value.accountNumber.trim())) return 'Enter the bank account number.'
    const iban = value.iban.replace(/\s/g, '').toUpperCase()
    if (iban && !/^PK\d{2}[A-Z]{4}[A-Z0-9]{16}$/.test(iban)) return 'That IBAN does not look right.'
  } else if (!/^03\d{2}-?\d{7}$/.test(value.accountNumber.replace(/\s/g, ''))) {
    return 'Enter the mobile account number, like 0300-1234567.'
  }
  return null
}

export function payoutForm(value: PayoutDraft, id?: string): FormData {
  const form = new FormData()
  if (id) form.set('id', id)
  form.set('method', value.method)
  form.set('provider', value.provider)
  form.set('accountTitle', value.accountTitle)
  form.set('accountNumber', value.accountNumber)
  form.set('iban', value.iban)
  if (value.qr) form.set('qr', value.qr)
  return form
}

/**
 * Where a host is paid booking advances. A QR code is optional but makes
 * paying from a phone one scan instead of typing a number.
 */
export function PayoutAccountFields({
  value,
  onChange,
  idPrefix,
  qrOnFile,
}: {
  value: PayoutDraft
  onChange: (next: PayoutDraft) => void
  idPrefix: string
  qrOnFile?: boolean
}) {
  const set = <K extends keyof PayoutDraft>(key: K, next: PayoutDraft[K]) => onChange({ ...value, [key]: next })
  const isBank = value.method === 'bank'

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Account type">
        {PAYOUT_METHODS.map((method) => {
          const on = value.method === method
          const Icon = method === 'bank' ? Banknote : Smartphone
          return (
            <button
              key={method}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => set('method', method)}
              className={cn(
                'flex min-h-12 items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] px-2 text-[13px] font-semibold transition-colors duration-200',
                on ? 'border-ink bg-ink text-white [&_svg]:text-volt' : 'border-ink/[.09] bg-white text-muted hover:border-ink/30 hover:text-ink',
              )}
            >
              <Icon size={15} aria-hidden="true" />
              {PAYOUT_METHOD_LABEL[method]}
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {isBank ? (
          <div>
            <label htmlFor={`${idPrefix}-provider`} className="mb-2 block text-sm font-medium text-ink">
              Bank name
            </label>
            <input id={`${idPrefix}-provider`} maxLength={80} value={value.provider} onChange={(e) => set('provider', e.target.value)} placeholder="e.g. Meezan Bank" className={FIELD} />
          </div>
        ) : null}
        <div>
          <label htmlFor={`${idPrefix}-title`} className="mb-2 block text-sm font-medium text-ink">
            Account title
          </label>
          <input id={`${idPrefix}-title`} maxLength={120} value={value.accountTitle} onChange={(e) => set('accountTitle', e.target.value)} placeholder="Name on the account" className={FIELD} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-number`} className="mb-2 block text-sm font-medium text-ink">
            {isBank ? 'Account number' : `${PAYOUT_METHOD_LABEL[value.method]} number`}
          </label>
          <input
            id={`${idPrefix}-number`}
            inputMode={isBank ? 'text' : 'tel'}
            maxLength={34}
            value={value.accountNumber}
            onChange={(e) => set('accountNumber', e.target.value)}
            placeholder={isBank ? '0123 4567 8901' : '0300-1234567'}
            className={cn(FIELD, 'font-mono')}
          />
        </div>
        {isBank ? (
          <div>
            <label htmlFor={`${idPrefix}-iban`} className="mb-2 block text-sm font-medium text-ink">
              IBAN (optional)
            </label>
            <input id={`${idPrefix}-iban`} maxLength={34} value={value.iban} onChange={(e) => set('iban', e.target.value.toUpperCase())} placeholder="PK36SCBL0000001123456702" className={cn(FIELD, 'font-mono')} />
          </div>
        ) : null}
      </div>

      <DocumentPicker
        id={`${idPrefix}-qr`}
        label="Payment QR code (optional)"
        hint="A screenshot of your Raast, JazzCash or Easypaisa QR, so drivers can pay in one scan"
        file={value.qr}
        onFile={qrOnFile}
        onChange={(file) => set('qr', file)}
      />
    </div>
  )
}
