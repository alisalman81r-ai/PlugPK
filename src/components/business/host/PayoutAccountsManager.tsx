// src/components/business/host/PayoutAccountsManager.tsx
'use client'

import { Pencil, Plus, Trash2 } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui'
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
          <div key={account.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
            {account.hasQr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/payout-qr/${account.id}`} alt="Payment QR code" className="h-16 w-16 rounded-lg border border-slate-200 object-contain" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-ui-sm font-semibold text-slate-900">
                {account.method === 'bank' ? account.provider : PAYOUT_METHOD_LABEL[account.method]}
              </p>
              <p className="text-ui-sm text-slate-600">{account.accountTitle}</p>
              <p className="font-mono text-ui-sm text-slate-800">{account.accountNumber}</p>
              {account.iban ? <p className="font-mono text-ui-xs text-slate-500">{account.iban}</p> : null}
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={() => startEdit(account)} disabled={busy} aria-label="Edit account" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <Pencil size={16} />
              </button>
              <button type="button" onClick={() => remove(account.id)} disabled={busy} aria-label="Remove account" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ),
      )}

      {editing ? (
        <div className="rounded-xl border-[1.5px] border-plug-blue-200 bg-plug-blue-50/40 p-4">
          <PayoutAccountFields idPrefix="payout-edit" value={draft} onChange={setDraft} qrOnFile={editingAccount?.hasQr} />
          {error ? <p role="alert" className="mt-3 text-ui-sm text-red-600">{error}</p> : null}
          <div className="mt-4 flex gap-2">
            {accounts.length > 0 ? (
              <Button variant="secondary" onClick={() => { setEditing(null); setError(null) }} disabled={busy}>
                Cancel
              </Button>
            ) : null}
            <Button onClick={save} isLoading={busy}>
              Save account
            </Button>
          </div>
        </div>
      ) : accounts.length < MAX_PAYOUT_ACCOUNTS ? (
        <button
          type="button"
          onClick={() => { setDraft(EMPTY_PAYOUT); setEditing('new'); setError(null) }}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-4 text-ui-sm font-semibold text-slate-500 hover:border-plug-blue-300 hover:bg-plug-blue-50"
        >
          <Plus size={16} aria-hidden="true" />
          Add a payout account
        </button>
      ) : null}
      {!editing && error ? <p role="alert" className="text-ui-sm text-red-600">{error}</p> : null}
    </div>
  )
}
