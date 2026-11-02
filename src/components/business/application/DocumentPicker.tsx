// src/components/business/application/DocumentPicker.tsx
'use client'

import { Check, FileQuestion, Upload, X } from '@/components/ui/icons'
import * as React from 'react'

import { DOCUMENT_MAX_BYTES } from '@/lib/listing-application'
import { IMAGE_ACCEPT } from '@/lib/upload-urls'
import { cn } from '@/lib/utils'

export interface DocumentPickerProps {
  id: string
  label: string
  hint?: string
  file: File | undefined
  onChange: (file: File | undefined) => void
  /** Allows a PDF as well as a photo. */
  allowPdf?: boolean
  /** A file of this kind is already on record (the owner is replacing it). */
  onFile?: boolean
  required?: boolean
}

/**
 * One document slot: a tap target that becomes a preview once a file is
 * chosen. Size is checked here so a 9MB photo is refused before it is sent,
 * with the same limit the server enforces.
 */
export function DocumentPicker({ id, label, hint, file, onChange, allowPdf, onFile, required }: DocumentPickerProps) {
  const [error, setError] = React.useState<string | null>(null)
  const preview = React.useMemo(
    () => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null),
    [file],
  )
  React.useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview])

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">
        {label}
        {required ? ' *' : ''}
      </p>

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-emerald-200 bg-emerald-50/60 p-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-14 w-20 shrink-0 rounded-lg border border-slate-200 object-cover" />
          ) : (
            <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-ui-xs font-bold text-slate-500">
              PDF
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-ui-sm font-medium text-slate-900">{file.name}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-ui-xs text-emerald-700">
              <Check size={12} aria-hidden="true" />
              Ready to upload · {file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label={`Remove ${label}`}
            className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-500"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-dashed border-slate-300 bg-white px-4 py-4 transition-colors hover:border-plug-blue-300 hover:bg-plug-blue-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            {onFile ? <FileQuestion size={18} aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />}
          </span>
          <span className="min-w-0">
            <span className="block text-ui-sm font-semibold text-slate-800">
              {onFile ? 'On file — choose a new one to replace it' : `Upload ${allowPdf ? 'a photo or PDF' : 'a photo'}`}
            </span>
            <span className="block text-ui-xs text-slate-500">{hint ?? `Clear and readable, up to 4 MB`}</span>
          </span>
        </label>
      )}

      <input
        id={id}
        type="file"
        accept={allowPdf ? `${IMAGE_ACCEPT},application/pdf` : IMAGE_ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const picked = event.target.files?.[0]
          event.target.value = ''
          if (!picked) return
          if (picked.size > DOCUMENT_MAX_BYTES) {
            setError('That file is larger than 4 MB. Take a new photo or choose a smaller file.')
            return
          }
          setError(null)
          onChange(picked)
        }}
      />
      {error ? <p className={cn('mt-1.5 text-ui-sm text-red-600')}>{error}</p> : null}
    </div>
  )
}
