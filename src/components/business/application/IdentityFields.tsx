// src/components/business/application/IdentityFields.tsx
'use client'

import { Lock } from '@/components/ui/icons'

import {
  LICENCE_KINDS,
  normalizeCnic,
  normalizeIdAddress,
  normalizeLicenceNumber,
  REQUIRED_DOCUMENTS,
  type DocumentKind,
  type IdType,
} from '@/lib/listing-application'
import { cn } from '@/lib/utils'

import { DocumentPicker } from './DocumentPicker'

export interface IdentityDraft {
  idNumber: string
  idDetail: string
  /** The address printed on the CNIC, or the registered address on the licence. */
  address: string
  files: Partial<Record<DocumentKind, File>>
}

export const EMPTY_IDENTITY: IdentityDraft = { idNumber: '', idDetail: '', address: '', files: {} }

const FIELD =
  'h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-ui text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-plug-blue-500 focus:shadow-focus'

/** Groups digits as they are typed: 35202-1234567-1. */
function formatCnicInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 13)
  if (digits.length <= 5) return digits
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
}

export interface IdentityFieldsProps {
  idType: IdType
  value: IdentityDraft
  onChange: (next: IdentityDraft) => void
  /** Document kinds already on record, when finishing an application. */
  onFile?: string[]
  idPrefix: string
}

/**
 * Proof of who is listing. A home charger is a person, so it is their CNIC;
 * anything else is a business, so it is a licence or registration. Said up
 * front that none of it is published — a CNIC is not something people hand
 * over without knowing where it goes.
 */
export function IdentityFields({ idType, value, onChange, onFile = [], idPrefix }: IdentityFieldsProps) {
  const setFile = (kind: DocumentKind, file: File | undefined) =>
    onChange({ ...value, files: { ...value.files, [kind]: file } })

  /*
    The owner's own address, as the document states it. Asked for here, with
    the rest of the proof, and kept private — where the chargers are installed
    is asked for on the next step and is the address drivers see.
  */
  const addressField = (
    <div>
      <label htmlFor={`${idPrefix}-id-address`} className="mb-2 block text-sm font-semibold text-slate-700">
        {idType === 'cnic' ? 'Address on your CNIC *' : 'Registered address *'}
      </label>
      <textarea
        id={`${idPrefix}-id-address`}
        maxLength={300}
        value={value.address}
        onChange={(e) => onChange({ ...value, address: e.target.value })}
        placeholder={idType === 'cnic' ? 'House 12, Street 4, Model Town, Lahore' : 'As shown on the licence or certificate'}
        className="min-h-[80px] w-full resize-y rounded-xl border-[1.5px] border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none focus:border-plug-blue-500"
      />
      <p className="mt-1.5 text-ui-sm text-slate-500">
        {idType === 'cnic'
          ? 'Exactly as printed on the card. Private — not where your charger is, and never shown on your listing.'
          : 'As shown on the document. Private — never shown on your listing.'}
      </p>
    </div>
  )

  return (
    <section aria-labelledby={`${idPrefix}-identity`} className="rounded-2xl border-[1.5px] border-slate-200 bg-slate-50/60 p-5">
      <h3 id={`${idPrefix}-identity`} className="text-base font-bold text-slate-900">
        {idType === 'cnic' ? 'Verify your identity' : 'Verify your business'}
      </h3>
      <p className="mt-1 flex items-start gap-1.5 text-ui-sm text-slate-500">
        <Lock size={14} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
        {idType === 'cnic'
          ? 'Your CNIC is used only to confirm who owns this charger. It is never shown on your listing and only the plugpk review team can see it.'
          : 'Used only to confirm the business is real. It is never shown on your listing and only the plugpk review team can see it.'}
      </p>

      <div className="mt-5 grid gap-5">
        {idType === 'cnic' ? (
          <>
            <div>
              <label htmlFor={`${idPrefix}-cnic`} className="mb-2 block text-sm font-semibold text-slate-700">
                CNIC number *
              </label>
              <input
                id={`${idPrefix}-cnic`}
                inputMode="numeric"
                autoComplete="off"
                value={value.idNumber}
                onChange={(e) => onChange({ ...value, idNumber: formatCnicInput(e.target.value) })}
                placeholder="35202-1234567-1"
                className={cn(FIELD, 'font-mono tracking-wide')}
              />
              <p className="mt-1.5 text-ui-sm text-slate-500">As printed on your card. The name on it should match your plugpk account.</p>
            </div>
            {addressField}
            <div className="grid gap-4 sm:grid-cols-2">
              <DocumentPicker
                id={`${idPrefix}-cnic-front`}
                label="CNIC — front"
                required
                file={value.files['cnic-front']}
                onFile={onFile.includes('cnic-front')}
                onChange={(file) => setFile('cnic-front', file)}
              />
              <DocumentPicker
                id={`${idPrefix}-cnic-back`}
                label="CNIC — back"
                required
                file={value.files['cnic-back']}
                onFile={onFile.includes('cnic-back')}
                onChange={(file) => setFile('cnic-back', file)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${idPrefix}-licence-kind`} className="mb-2 block text-sm font-semibold text-slate-700">
                  Document type *
                </label>
                <select
                  id={`${idPrefix}-licence-kind`}
                  value={value.idDetail}
                  onChange={(e) => onChange({ ...value, idDetail: e.target.value })}
                  className={cn(FIELD, 'cursor-pointer')}
                >
                  <option value="">Choose one</option>
                  {LICENCE_KINDS.map((kind) => (
                    <option key={kind.value} value={kind.value}>
                      {kind.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${idPrefix}-licence-number`} className="mb-2 block text-sm font-semibold text-slate-700">
                  Licence / registration number *
                </label>
                <input
                  id={`${idPrefix}-licence-number`}
                  autoComplete="off"
                  maxLength={40}
                  value={value.idNumber}
                  onChange={(e) => onChange({ ...value, idNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. 1234567-8"
                  className={cn(FIELD, 'font-mono')}
                />
              </div>
            </div>
            {addressField}
            <DocumentPicker
              id={`${idPrefix}-licence-file`}
              label="Licence or certificate"
              hint="A photo or scan of the certificate, up to 4 MB"
              required
              allowPdf
              file={value.files.licence}
              onFile={onFile.includes('licence')}
              onChange={(file) => setFile('licence', file)}
            />
          </>
        )}
      </div>
    </section>
  )
}

/** The form's own check, matching the server's, so mistakes show before sending. */
export function identityProblem(idType: IdType, value: IdentityDraft, onFile: string[] = []): string | null {
  if (idType === 'cnic') {
    if (!normalizeCnic(value.idNumber)) return 'Enter your 13-digit CNIC number, like 35202-1234567-1.'
  } else {
    if (!value.idDetail) return 'Choose what kind of licence or registration you have.'
    if (!normalizeLicenceNumber(value.idNumber)) return 'Enter the licence or registration number as printed.'
  }
  if (!normalizeIdAddress(value.address)) {
    return idType === 'cnic' ? 'Enter the address printed on your CNIC.' : 'Enter the registered address shown on the licence.'
  }
  const missing = REQUIRED_DOCUMENTS[idType].filter((kind) => !value.files[kind] && !onFile.includes(kind))
  if (missing.length > 0) {
    return idType === 'cnic' ? 'Upload a photo of both sides of your CNIC.' : 'Upload a copy of your licence or certificate.'
  }
  return null
}
