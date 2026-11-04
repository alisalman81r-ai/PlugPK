// src/components/business/host/PayoutAccountsManager.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { btnClass, Ico } from '@/components/admin/network-kit'
import { Loader2 } from '@/components/ui/icons'
import { MAX_PAYOUT_ACCOUNTS, PAYOUT_METHOD_LABEL, type PayoutAccountView } from '@/lib/charger-host'
import { deletePayoutAccount, savePayoutAccount } from '@/lib/db/host-actions'

import { EMPTY_PAYOUT, PayoutAccountFields, payoutForm, payoutProblem, type PayoutDraft } from './PayoutAccountFields'

/**
 * The host's payout accounts, on their own portal page: listed, edited in place,
 * added, removed. Shown to drivers only while they book a live listing.
 */
export function PayoutAccountsManager({ businessId, accounts }: { businessId: string; accounts: PayoutAccountView[] }) {
  const router = useRouter()
  const [editing, setEditing] = React.useState<string | 'new' | null>(accounts.length === 0 ? 'new' : null)
  const [draft, setDraft] = React.useState<PayoutDraft>(EMPTY_PAYOUT)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const startEdit = (account: PayoutAccountView) => {
    setDraft({
      method: account.method,
      provider: account.provider ?? '',
      accountTitle: account.accountTitle,
      accountNumber: account.accountNumber,
      iban: account.iban ?? '',
    })
    setEditing(account.id)
    setError(null)
  }

  const save = async () => {
    const problem = payoutProblem(draft)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await savePayoutAccount(businessId, payoutForm(draft, editing === 'new' ? undefined : (editing ?? undefined)))
      if (!result.ok) {
        setError(result.message ?? 'Could not save the account.')
        return
      }
      setEditing(null)
      setDraft(EMPTY_PAYOUT)
      router.refresh()
    } catch {
      setError('Could not reach plugpk. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Remove this payout account?')) return
    setBusy(true)
    setError(null)
    const result = await deletePayoutAccount(businessId, id).catch(() => ({ ok: false, message: 'Could not reach plugpk.' }))
    setBusy(false)
    if (!result.ok) setError(result.message ?? 'Could not remove the account.')
    else router.refresh()
  }

  const editingAccount = accounts.find((account) => account.id === editing)

  return (
    <div className="flex flex-col gap-3">
      {accounts.map((account) =>
        editing === account.id ? null : (
          <div key={account.id} className="flex flex-wrap items-center gap-4 rounded-[18px] border border-ink/[.09] bg-white p-4 shadow-[0_1px_2px_rgba(11,12,14,.05),0_8px_24px_-14px_rgba(11,12,14,.16)] transition-[translate,box-shadow] duration-500 ease-out hover:[translate:0_-2px]">
            {account.hasQr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/payout-qr/${account.id}`} alt="Payment QR code" className="h-16 w-16 rounded-xl border border-ink/[.09] object-contain" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="m-0 font-display text-lg font-normal text-ink">
                {account.method === 'bank' ? account.provider : PAYOUT_METHOD_LABEL[account.method]}
              </p>
              <p className="m-0 text-sm text-muted">{account.accountTitle}</p>
              <p className="m-0 mt-1 font-mono text-sm font-semibold text-ink">{account.accountNumber}</p>
              {account.iban ? <p className="m-0 font-mono text-xs text-fog">{account.iban}</p> : null}
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={() => startEdit(account)} disabled={busy} aria-label="Edit account" className="grid h-9 w-9 place-items-center rounded-[10px] text-muted transition-colors hover:bg-chalk hover:text-ink [&_svg]:h-[18px] [&_svg]:w-[18px]">
                <Ico name="pen" />
              </button>
              <button type="button" onClick={() => remove(account.id)} disabled={busy} aria-label="Remove account" className="grid h-9 w-9 place-items-center rounded-[10px] text-muted transition-colors hover:bg-[rgba(255,90,31,.1)] hover:text-[#b23b0d] [&_svg]:h-[18px] [&_svg]:w-[18px]">
                <Ico name="trash" />
              </button>
            </div>
          </div>
        ),
      )}

      {editing ? (
        <div className="rounded-[18px] border border-ink/[.09] bg-paper p-[18px]">
          <PayoutAccountFields idPrefix="payout-edit" value={draft} onChange={setDraft} qrOnFile={editingAccount?.hasQr} />
          {error ? <p role="alert" className="mb-0 mt-3 text-sm text-[#b23b0d]">{error}</p> : null}
          <div className="mt-4 flex gap-2">
            {accounts.length > 0 ? (
              <button type="button" className={btnClass('line')} onClick={() => { setEditing(null); setError(null) }} disabled={busy}>
                Cancel
              </button>
            ) : null}
            <button type="button" className={btnClass('ink')} onClick={save} disabled={busy}>
              {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Ico name="check" />}
              Save account
            </button>
          </div>
        </div>
      ) : accounts.length < MAX_PAYOUT_ACCOUNTS ? (
        <button
          type="button"
          onClick={() => { setDraft(EMPTY_PAYOUT); setEditing('new'); setError(null) }}
          className="flex items-center justify-center gap-2 rounded-[18px] border-[1.5px] border-dashed border-ink/[.15] bg-white/60 py-4 text-sm font-semibold text-muted transition-colors duration-200 hover:border-ink/40 hover:bg-white hover:text-ink [&_svg]:h-[18px] [&_svg]:w-[18px]"
        >
          <Ico name="plus" />
          Add a payout account
        </button>
      ) : null}
      {!editing && error ? <p role="alert" className="m-0 text-sm text-[#b23b0d]">{error}</p> : null}
    </div>
  )
}
