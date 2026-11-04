// src/components/business/ChargerManager.tsx
'use client'

import { Loader2 } from '@/components/ui/icons'
import * as React from 'react'

import {
  btnClass,
  ConIco,
  Empty,
  FieldSelect,
  Fld,
  FormCard,
  FormError,
  Ico,
  IN,
  Note,
  Pill,
} from '@/components/admin/network-kit'
import { CONNECTOR_TYPES } from '@/lib/constants'
import { saveMyChargers, type DraftCharger } from '@/lib/db/business-actions'
import { deleteChargerPhoto, uploadChargerPhoto } from '@/lib/db/upload-actions'
import { gsap, prefersReduced } from '@/lib/gsap'
import { ACCEPTED_FORMATS, IMAGE_ACCEPT } from '@/lib/upload-urls'
import { cn } from '@/lib/utils'

import { BizStat, BizStrip, LIFT, SaveBar, SavedTick, Stepper, useBizEntrance, useIsoLayoutEffect } from './host/biz-kit'

/**
 * The chargers on the owner's listing.
 *
 * Previously this edited an in-memory array seeded from MOCK_BUSINESS: adding a
 * charger appeared to work, and refreshing put the fixture back. Edits now go
 * to the listing itself, which is also what the map reads — so a charger added
 * here shows up to drivers.
 *
 * The whole list is submitted at once rather than one row at a time. The
 * chargers live in a single JSON column, so sending the full intended list is
 * what keeps the column consistent with what is on screen.
 */

export interface ChargerManagerProps {
  businessId: string
  chargers: DraftCharger[]
  /** Approved listings are live; anything else is not yet visible to drivers. */
  isLive: boolean
}

const MAX_CHARGERS = 20

function blankCharger(): DraftCharger {
  return { connectorType: 'Type2', maxPowerKw: 22, ports: 1 }
}

/** A row and the key it keeps while rows above it come and go. */
interface Item {
  k: number
  row: DraftCharger
}

export function ChargerManager({ businessId, chargers, isLive }: ChargerManagerProps) {
  const nextKey = React.useRef(chargers.length)
  const [items, setItems] = React.useState<Item[]>(() => chargers.map((row, k) => ({ k, row })))
  const rows = items.map((item) => item.row)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  // The rows added on this visit, which ease in; the ones on load stagger in with the page.
  const [added, setAdded] = React.useState<Set<number>>(() => new Set())

  // What was last written, so the save button can tell whether anything
  // actually changed rather than offering to save a list nobody touched.
  const [saved, setSaved] = React.useState<string>(() => JSON.stringify(chargers))
  const isDirty = JSON.stringify(rows) !== saved

  // Which row's photo is in flight. Held by index so two uploads cannot both
  // claim the spinner.
  const [uploading, setUploading] = React.useState<number | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)

  const root = React.useRef<HTMLDivElement>(null)
  useBizEntrance(root)

  /*
    Uploads made on this screen that no saved listing points at yet.

    Only these may be deleted from here. This screen used to delete the old
    file the moment a photo was replaced or removed — before Save — so leaving
    without saving left the live listing pointing at a deleted image. Removing
    a saved photo now happens on the server when the new list is saved; a
    fresh upload that is replaced again before Save is the one thing cleaned
    up here, since nothing else would ever reference it.
  */
  const fresh = React.useRef(new Set<string>())
  const discardFresh = (url: string | undefined) => {
    if (!url || !fresh.current.has(url)) return
    fresh.current.delete(url)
    void deleteChargerPhoto(businessId, url).catch(() => {})
  }

  const patch = (index: number, next: Partial<DraftCharger>) => {
    setItems((current) =>
      current.map((item, position) => (position === index ? { ...item, row: { ...item.row, ...next } } : item)),
    )
    setError(null)
  }

  /**
   * Uploads a photo and attaches it to one charger.
   *
   * The file goes up as soon as it is chosen rather than waiting for Save,
   * because a picture needs to be visible to be worth keeping — you cannot
   * judge a thumbnail you have not seen. The path it returns is held in the
   * row like any other field, so it is Save that commits it to the listing.
   */
  const attachPhoto = async (index: number, file: File, target: 'photo' | 'portPhoto') => {
    setUploading(index)
    setError(null)

    const form = new FormData()
    form.set('file', file)

    const result = await uploadChargerPhoto(businessId, form)
    setUploading(null)

    if (!result.ok || !result.url) {
      setError(result.message ?? 'Could not upload that image.')
      return
    }

    fresh.current.add(result.url)
    discardFresh(rows[index]?.[target])

    patch(index, {
      [target]: result.url,
      [target === 'photo' ? 'photoStatus' : 'portPhotoStatus']: 'pending',
    })
  }

  const removePhoto = (index: number, target: 'photo' | 'portPhoto') => {
    discardFresh(rows[index]?.[target])
    patch(
      index,
      target === 'photo'
        ? { photo: undefined, photoStatus: undefined, photoLabel: undefined }
        : { portPhoto: undefined, portPhotoStatus: undefined },
    )
  }

  const addRow = () => {
    const k = nextKey.current++
    setItems((current) => [...current, { k, row: blankCharger() }])
    setAdded((current) => new Set(current).add(k))
    setError(null)
  }

  const removeRow = (k: number, el: HTMLElement | null) => {
    const drop = () => {
      setItems((current) => current.filter((item) => item.k !== k))
      setError(null)
    }
    if (!el || prefersReduced()) return drop()
    gsap.to(el, {
      autoAlpha: 0,
      height: 0,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: -14,
      overflow: 'hidden',
      duration: 0.38,
      ease: 'power2.inOut',
      onComplete: drop,
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setNotice(null)

    const result = await saveMyChargers(businessId, rows)
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message ?? 'Could not save your chargers.')
      return
    }

    // Saved uploads are the listing's now; the server owns their cleanup.
    fresh.current.clear()
    if (result.backToReview) {
      setNotice('Saved. Your listing has gone back to the review queue for another look.')
    }
    setSaved(JSON.stringify(rows))
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  const totalPorts = rows.reduce((sum, row) => sum + (Number(row.ports) || 0), 0)
  const topKw = rows.reduce((max, row) => Math.max(max, Number(row.maxPowerKw) || 0), 0)
  const photos = rows.flatMap((row) => [
    row.photo ? row.photoStatus : null,
    row.portPhoto ? row.portPhotoStatus : null,
  ]).filter((status) => status !== null)
  const awaiting = photos.filter((status) => status === 'pending').length
  const retake = photos.filter((status) => status === 'needs-better-photo').length

  return (
    <div ref={root} className="grid max-w-[1100px] gap-[18px]">
      <BizStrip label="Your chargers at a glance" cells={5}>
        <BizStat label="Chargers" dot="ok" value={rows.length} sub={`Up to ${MAX_CHARGERS} on one listing`} />
        <BizStat label="Ports" dot="blue" value={totalPorts} sub="Cars that can charge at once" />
        <BizStat label="Fastest" value={topKw} unit="kW" sub={topKw >= 50 ? 'DC fast charging' : topKw > 0 ? 'AC charging' : 'No power set'} />
        <BizStat
          label="Photos in review"
          dot={retake > 0 ? 'bad' : awaiting > 0 ? 'warn' : 'none'}
          value={awaiting + retake}
          sub={retake > 0 ? `${retake} need a better photo` : awaiting > 0 ? 'Checked by a person' : 'Nothing waiting'}
        />
        <BizStat
          label="On the map"
          lit
          text={isLive ? 'Live' : 'Not yet'}
          sub={isLive ? 'Drivers can find these' : 'Visible once approved'}
        />
      </BizStrip>

      <FormCard
        title="Your chargers"
        sub={
          rows.length === 0
            ? 'None listed yet.'
            : `${rows.length} charger${rows.length === 1 ? '' : 's'} · ${totalPorts} port${totalPorts === 1 ? '' : 's'}. Drivers filter the map by these.`
        }
        action={
          <button type="button" onClick={addRow} disabled={rows.length >= MAX_CHARGERS} className={btnClass('ink')}>
            <Ico name="plus" />
            Add charger
          </button>
        }
      >
        {rows.length === 0 ? (
          <div className="mt-6 rounded-[18px] border border-dashed border-ink/[.12] bg-paper">
            <Empty
              icon="plug"
              title="No chargers yet"
              text="Add the chargers at this location so drivers can filter for them."
            >
              <button type="button" onClick={addRow} className={cn(btnClass('line', 'sm'), 'mt-4')}>
                <Ico name="plus" />
                Add your first charger
              </button>
            </Empty>
          </div>
        ) : (
          <ul className="m-0 mt-6 grid list-none gap-3.5 p-0">
            {items.map((item, index) => (
              <ChargerRow
                key={item.k}
                index={index}
                row={item.row}
                fresh={added.has(item.k)}
                uploading={uploading === index}
                onPatch={(next) => patch(index, next)}
                onRemove={(el) => removeRow(item.k, el)}
                onPhoto={(file, target) => void attachPhoto(index, file, target)}
                onRemovePhoto={(target) => removePhoto(index, target)}
              />
            ))}
          </ul>
        )}

        {rows.length >= MAX_CHARGERS ? (
          <p className="mb-0 mt-3 text-sm text-muted">That is the maximum of {MAX_CHARGERS} chargers on one listing.</p>
        ) : null}
      </FormCard>

      {error ? <FormError>{error}</FormError> : null}
      {notice ? <Note tone="warn">{notice}</Note> : null}

      <SaveBar>
        <button type="button" onClick={handleSave} disabled={isSaving || !isDirty} className={btnClass('ink')}>
          {isSaving ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Ico name="check" />}
          {isSaving ? 'Saving' : 'Save chargers'}
        </button>
        {isSaved ? <SavedTick /> : null}
        <span className="text-[13px] text-muted">
          {isDirty
            ? 'You have unsaved changes.'
            : !isLive
              ? 'Visible to drivers once the listing is approved.'
              : 'New photos are checked by a person before drivers see them.'}
        </span>
      </SaveBar>
    </div>
  )
}

function ChargerRow({
  index,
  row,
  fresh,
  uploading,
  onPatch,
  onRemove,
  onPhoto,
  onRemovePhoto,
}: {
  index: number
  row: DraftCharger
  fresh: boolean
  uploading: boolean
  onPatch: (next: Partial<DraftCharger>) => void
  onRemove: (el: HTMLElement | null) => void
  onPhoto: (file: File, target: 'photo' | 'portPhoto') => void
  onRemovePhoto: (target: 'photo' | 'portPhoto') => void
}) {
  const ref = React.useRef<HTMLLIElement>(null)
  const n = index + 1

  // A charger added on this visit eases open; the ones on load came in with the page.
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!fresh || !el || prefersReduced()) return
    gsap.from(el, {
      height: 0,
      autoAlpha: 0,
      y: -8,
      overflow: 'hidden',
      duration: 0.7,
      ease: 'expo.out',
      clearProps: 'height,opacity,visibility,transform,overflow',
    })
    // Once only, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <li
      ref={ref}
      data-biz-in={fresh ? undefined : ''}
      className={cn('rounded-[18px] border border-ink/[.09] bg-paper p-[18px]', LIFT, 'hover:border-ink/20')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-ink text-volt">
            <ConIco type={row.connectorType} className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0">
            <b className="block font-display text-lg font-normal leading-tight text-ink">Charger {n}</b>
            <span className="mt-0.5 block font-mono text-xs font-medium text-fog">
              {row.connectorType} · {Number(row.maxPowerKw) || 0} kW · {row.ports} port{row.ports === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(ref.current)}
          aria-label={`Remove charger ${n}`}
          className="grid h-10 w-10 place-items-center rounded-[10px] text-muted transition-colors duration-200 hover:bg-[rgba(255,90,31,.1)] hover:text-[#b23b0d] [&_svg]:h-[18px] [&_svg]:w-[18px]"
        >
          <Ico name="trash" />
        </button>
      </div>

      <div className="mt-[18px] grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-x-4 gap-y-[18px] max-[760px]:grid-cols-2">
        <Fld label="Connector" htmlFor={`charger-type-${index}`}>
          <FieldSelect
            id={`charger-type-${index}`}
            value={row.connectorType}
            onChange={(event) => onPatch({ connectorType: event.target.value })}
          >
            {CONNECTOR_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FieldSelect>
        </Fld>

        <Fld label="Power" htmlFor={`charger-kw-${index}`}>
          <span className="relative block">
            <input
              id={`charger-kw-${index}`}
              type="number"
              min={0}
              max={400}
              value={row.maxPowerKw}
              onChange={(event) => onPatch({ maxPowerKw: Number(event.target.value) })}
              className={cn(IN, 'pr-12 font-mono')}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-muted">
              kW
            </span>
          </span>
        </Fld>

        <Fld label="Ports" htmlFor={`charger-ports-${index}`} className="max-[760px]:col-span-2">
          <Stepper
            id={`charger-ports-${index}`}
            value={row.ports}
            min={1}
            max={50}
            label={`port on charger ${n}`}
            onChange={(ports) => onPatch({ ports })}
          />
        </Fld>
      </div>

      <div className="mt-[18px] grid grid-cols-[repeat(2,minmax(0,280px))] gap-3.5 max-[520px]:grid-cols-2 max-[520px]:gap-2.5">
        <PhotoTile
          src={row.photo}
          status={row.photoStatus}
          alt={`Charger ${n}`}
          caption="Charger photo"
          need="Required"
          hint={`The whole unit. ${ACCEPTED_FORMATS}, up to 4MB.`}
          uploading={uploading}
          removeLabel={`Remove the photo of charger ${n}`}
          onFile={(file) => onPhoto(file, 'photo')}
          onRemove={() => onRemovePhoto('photo')}
        />
        <PhotoTile
          src={row.portPhoto}
          status={row.portPhotoStatus}
          alt={`Port type for charger ${n}`}
          caption="Port close-up"
          need="Recommended"
          hint="A close-up of the connector."
          uploading={uploading}
          removeLabel={`Remove the port photo of charger ${n}`}
          onFile={(file) => onPhoto(file, 'portPhoto')}
          onRemove={() => onRemovePhoto('portPhoto')}
        />
      </div>
    </li>
  )
}

function PhotoTile({
  src,
  status,
  alt,
  caption,
  need,
  hint,
  uploading,
  removeLabel,
  onFile,
  onRemove,
}: {
  src?: string
  status: DraftCharger['photoStatus']
  alt: string
  caption: string
  need: string
  hint: string
  uploading: boolean
  removeLabel: string
  onFile: (file: File) => void
  onRemove: () => void
}) {
  const input = (
    <input
      type="file"
      accept={IMAGE_ACCEPT}
      className="sr-only"
      disabled={uploading}
      onChange={(event) => {
        const file = event.target.files?.[0]
        // Cleared so choosing the same file twice in a row still fires a change event.
        event.target.value = ''
        if (file) onFile(file)
      }}
    />
  )

  return (
    <figure className="m-0 min-w-0">
      {src ? (
        <span className="group relative block overflow-hidden rounded-[14px] border border-ink/[.09] bg-chalk">
          {/* A plain img, not next/image: the file was uploaded a moment ago and
              its dimensions are unknown, and the optimizer adds nothing here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="block aspect-[16/10] w-full object-cover transition-[scale] duration-700 ease-out group-hover:scale-[1.03]"
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-muted shadow-e1 backdrop-blur transition-colors hover:bg-white hover:text-[#b23b0d] [&_svg]:h-4 [&_svg]:w-4"
          >
            <Ico name="x" />
          </button>
          <label
            className={cn(
              'absolute bottom-2 left-2 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-ink/85 px-3 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-ink [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-volt',
              uploading && 'pointer-events-none opacity-60',
            )}
          >
            {uploading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Ico name="img" />}
            {uploading ? 'Uploading…' : 'Replace'}
            {input}
          </label>
        </span>
      ) : (
        <label
          className={cn(
            'grid aspect-[16/10] w-full cursor-pointer place-items-center content-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-ink/[.15] bg-chalk text-center text-[13px] text-muted transition-colors duration-200 hover:border-ink/40 hover:bg-white [&_svg]:h-[22px] [&_svg]:w-[22px] [&_svg]:text-fog',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          {uploading ? <Loader2 size={22} className="animate-spin text-fog" aria-hidden="true" /> : <Ico name="img" />}
          <span className="font-semibold text-ink">{uploading ? 'Uploading…' : `Add ${caption.toLowerCase()}`}</span>
          {input}
        </label>
      )}
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 text-xs text-muted">
          <b className="font-semibold text-ink">{caption}</b> · {need}
          {!src ? <span className="block text-fog">{hint}</span> : null}
        </span>
        {src ? <PhotoStatusPill status={status} /> : null}
      </figcaption>
    </figure>
  )
}

/**
 * Where one photo stands in review. "Approved" for a photo with no status is
 * a row saved before photo review existed, when approving the listing was the
 * review.
 */
function PhotoStatusPill({ status }: { status: DraftCharger['photoStatus'] }) {
  if (status === 'needs-better-photo') return <Pill tone="bad" icon="alert" className="h-7 text-xs">Needs a better photo</Pill>
  if (status === 'pending') return <Pill tone="warn" icon="clock" className="h-7 text-xs">Awaiting review</Pill>
  return <Pill tone="ok" icon="okc" className="h-7 text-xs">Approved</Pill>
}
