// src/components/business/BusinessSignUpForm.tsx
'use client'

import {
  Building2,
  Car,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  Home as HomeIcon,
  Hotel,
  Mail,
  Phone,
  Plus,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  ImagePlus,
  Utensils,
  Wrench,
  type IconType,
} from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { Button } from '@/components/ui'
import { LocationPicker } from './LocationPicker'
import { EMPTY_IDENTITY, IdentityFields, identityProblem, type IdentityDraft } from './application/IdentityFields'
import {
  emptyPayment,
  PaymentFields,
  paymentProblem,
  type PaymentAccountView,
  type PaymentDraft,
} from './application/PaymentFields'
import { sendApplication } from './application/send-application'
import { CONNECTOR_TYPES, PAKISTAN_CITIES } from '@/lib/constants'
import { registerBusiness, saveMyChargers } from '@/lib/db/business-actions'
import { deleteChargerPhoto, uploadChargerPhoto } from '@/lib/db/upload-actions'
import {
  formatPkr,
  idTypeFor,
  licenceKindLabel,
  maskCnic,
  normalizeCnic,
  PAYMENT_METHOD_LABEL,
} from '@/lib/listing-application'
import type { BusinessType, ConnectorType } from '@/lib/types'
import { IMAGE_ACCEPT } from '@/lib/upload-urls'
import { cn } from '@/lib/utils'

interface DraftCharger {
  connectorType: ConnectorType
  maxPowerKw: number
  ports: number
  photoFile?: File
  portPhotoFile?: File
}

export interface BusinessSignUpFormProps {
  /**
   * Who is signed in. Supplied by the page, which redirects to /login when
   * nobody is — so this component never has to ask for an email or a password,
   * and a listing can only ever be attached to a real, verified session.
   */
  account: { name: string; email: string; phone: string | null }
  /** The listing fee in force, in whole rupees. Shown, never sent back. */
  fee: number
  /** Where the fee can be paid. Empty when no account is configured. */
  accounts: PaymentAccountView[]
}

interface FormData {
  phone: string
  businessName: string
  businessType: BusinessType | ''
  city: string
  address: string
  website: string
  lat: number | null
  lng: number | null
  chargers: DraftCharger[]
}

/*
  Business first, because what it is decides what the rest of the form asks:
  a home charger is listed by a person and proved with a CNIC, anything else by
  a business and proved with a licence. Payment comes after the chargers, once
  the owner has seen everything they are paying to list, and nothing reaches
  the review queue until it has been sent.
*/
const STEPS = ['Business', 'Details', 'Chargers', 'Payment', 'Review'] as const

const TYPE_OPTIONS: { value: BusinessType; label: string; icon: IconType; note: string }[] = [
  { value: 'hotel', label: 'Hotel', icon: Hotel, note: 'Guests charge overnight' },
  { value: 'restaurant', label: 'Restaurant', icon: Utensils, note: 'Charge over a meal' },
  { value: 'mall', label: 'Shopping Mall', icon: ShoppingBag, note: 'Charge while shopping' },
  { value: 'office', label: 'Office', icon: Building2, note: 'Workplace charging' },
  { value: 'dealership', label: 'Dealership', icon: Car, note: 'Showroom and service' },
  { value: 'service-center', label: 'Service Center', icon: Wrench, note: 'Repairs and servicing' },
  { value: 'home', label: 'Home Charger', icon: HomeIcon, note: 'Share the charger at your home' },
]

const TYPE_LABEL = Object.fromEntries(TYPE_OPTIONS.map((option) => [option.value, option.label]))

const FIELD =
  'h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-ui text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-plug-blue-500 focus:shadow-focus'

const MAX_CHARGERS = 10

export function BusinessSignUpForm({ account, fee, accounts }: BusinessSignUpFormProps) {
  const [currentStep, setCurrentStep] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isComplete, setIsComplete] = React.useState(false)
  const [agreed, setAgreed] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [progress, setProgress] = React.useState<string | null>(null)

  /*
    What an earlier press of Submit already achieved.

    Submitting is several steps — create the listing, upload each photo,
    attach them, then the identity documents and the payment — and on a phone
    connection any of the later ones can fail. Each retry used to start again
    from nothing, so a bad signal left a trail of half-made pending listings
    for the reviewer and a re-upload of every photo. The listing id and what
    has already been uploaded are kept here, so pressing Submit again picks up
    where the last attempt stopped.
  */
  const draftId = React.useRef<string | null>(null)
  const uploaded = React.useRef(new Map<File, string>())
  const sentDocuments = React.useRef(new WeakSet<File>())

  /** Throws away an uploaded file the form no longer uses. */
  const forgetUpload = (file: File | undefined) => {
    if (!file) return
    const url = uploaded.current.get(file)
    if (!url) return
    uploaded.current.delete(file)
    // Only ever deletes a file no saved listing points at — see upload-actions.
    if (draftId.current) void deleteChargerPhoto(draftId.current, url).catch(() => {})
  }

  const [data, setData] = React.useState<FormData>({
    phone: account.phone ?? '',
    businessName: '',
    businessType: '',
    city: '',
    address: '',
    website: '',
    lat: null,
    lng: null,
    chargers: [],
  })
  const [identity, setIdentity] = React.useState<IdentityDraft>(EMPTY_IDENTITY)
  const [payment, setPayment] = React.useState<PaymentDraft>(emptyPayment)

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((current) => ({ ...current, [key]: value }))
    setError(null)
  }

  /**
   * A home charger is not a business, and the form should not insist it is.
   * Same fields and same record — only the words change, so somebody sharing
   * the charger on their driveway is not asked for a "business name" or a
   * company website.
   */
  const isHome = data.businessType === 'home'
  const idType = idTypeFor(data.businessType)
  const nameLabel = isHome ? 'Listing Name' : 'Business Name'
  const namePlaceholder = isHome ? 'Ahmed’s home charger, DHA Phase 5' : 'Mall Road Premium Hotel'

  const chooseType = (value: BusinessType) => {
    // Switching between a home and a business changes the proof asked for, so
    // what was typed for the other kind is cleared rather than half-reused.
    if (idTypeFor(value) !== idType) setIdentity(EMPTY_IDENTITY)
    update('businessType', value)
  }

  const validateStep = (step: number): string | null => {
    if (step === 1) {
      if (!data.businessType) return 'Choose what you are listing.'
    }
    if (step === 2) {
      if (!data.businessName.trim()) return isHome ? 'Give your listing a name.' : 'Enter your business name.'
      // A business's public contact number is a different thing from the one
      // on the account, so it is asked for here.
      if (!/^03\d{2}-?\d{7}$/.test(data.phone.replace(/\s/g, '')))
        return 'Enter a valid phone number, e.g. 0300-1234567.'
      const identityError = identityProblem(idType, identity)
      if (identityError) return identityError
    }
    if (step === 3) {
      if (!data.city) return 'Select the city your chargers are in.'
      if (!data.address.trim()) return 'Enter the address where your chargers are installed.'
      // Required, because the point of listing is to be found. An address
      // without coordinates cannot be put on the map, and a listing that is
      // not on the map does nothing for the business that submitted it.
      if (data.lat === null || data.lng === null)
        return 'Set the chargers’ location — use the current-location button or type the coordinates.'
      if (data.chargers.length === 0) return 'Add at least one charger to your listing.'
      if (data.chargers.some((charger) => !charger.photoFile)) {
        return 'Add a primary photo of every charger before continuing.'
      }
    }
    if (step === 4) {
      if (accounts.length === 0) return 'Payment is not available right now, so the listing cannot be submitted yet.'
      const paymentError = paymentProblem(payment)
      if (paymentError) return paymentError
    }
    return null
  }

  const goTo = (step: number) => {
    setError(null)
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goNext = () => {
    const found = validateStep(currentStep)
    if (found) {
      setError(found)
      return
    }
    goTo(Math.min(currentStep + 1, STEPS.length))
  }

  const handleSubmit = async () => {
    // Every step is checked again: an Edit link from the review can have
    // changed something after it was first validated.
    for (let step = 1; step < STEPS.length; step += 1) {
      const found = validateStep(step)
      if (found) {
        setCurrentStep(step)
        setError(found)
        return
      }
    }
    if (!agreed) {
      setError('Please accept the Business Terms to continue.')
      return
    }

    setIsLoading(true)
    setError(null)

    // Said on every failure after the first step: the details are already
    // saved, and the next attempt resumes rather than duplicating them.
    const retryHint = ' Your details are saved — press Submit again to carry on. Nothing will be listed or charged twice.'

    try {
      // No identity is sent: the action reads it from the session. A retry
      // passes the draft's id, so the server updates it instead of creating
      // another.
      setProgress('Saving your listing…')
      const result = await registerBusiness({
        phone: data.phone,
        businessName: data.businessName,
        businessType: data.businessType,
        city: data.city,
        address: data.address,
        website: isHome ? '' : data.website,
        lat: data.lat,
        lng: data.lng,
        chargers: data.chargers.map((charger) => ({
          connectorType: charger.connectorType,
          maxPowerKw: charger.maxPowerKw,
          ports: charger.ports,
        })),
        businessId: draftId.current ?? undefined,
      })

      if (!result.ok || !result.businessId) {
        setError(result.message ?? 'Could not submit your listing. Please try again.')
        return
      }
      const businessId = result.businessId
      draftId.current = businessId

      const files = data.chargers.flatMap((charger) =>
        [charger.photoFile, charger.portPhotoFile].filter((file): file is File => file instanceof File),
      )
      let sent = 0

      const urlFor = async (file: File): Promise<{ url?: string; message?: string }> => {
        sent += 1
        const cached = uploaded.current.get(file)
        if (cached) return { url: cached }

        setProgress(`Uploading charger photo ${sent} of ${files.length}…`)
        const form = new FormData()
        form.set('file', file)
        const upload = await uploadChargerPhoto(businessId, form)
        if (!upload.ok || !upload.url) return { message: upload.message ?? 'Could not upload a photo.' }
        uploaded.current.set(file, upload.url)
        return { url: upload.url }
      }

      const withPhotos = []
      for (const [index, charger] of data.chargers.entries()) {
        const primary = await urlFor(charger.photoFile as File)
        if (!primary.url) {
          setError(`Charger ${index + 1}: ${primary.message}${retryHint}`)
          return
        }

        let portPhoto: string | undefined
        if (charger.portPhotoFile) {
          const port = await urlFor(charger.portPhotoFile)
          if (!port.url) {
            setError(`Charger ${index + 1} port photo: ${port.message}${retryHint}`)
            return
          }
          portPhoto = port.url
        }

        // No photo status is sent. Every new photo starts as awaiting review,
        // and that is the server's decision, not the form's.
        withPhotos.push({
          connectorType: charger.connectorType,
          maxPowerKw: charger.maxPowerKw,
          ports: charger.ports,
          photo: primary.url,
          photoLabel: 'charger' as const,
          ...(portPhoto ? { portPhoto } : {}),
        })
      }

      setProgress('Attaching your photos…')
      const saved = await saveMyChargers(businessId, withPhotos)
      if (!saved.ok) {
        setError(`${saved.message ?? 'Could not attach the charger photos.'}${retryHint}`)
        return
      }

      const application = await sendApplication(
        businessId,
        { idType, identity, payment },
        sentDocuments.current,
        setProgress,
      )
      if (!application.ok) {
        setError(`${application.message ?? 'Could not send your verification and payment.'}${retryHint}`)
        return
      }

      setIsComplete(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      // A dropped connection rejects the action's promise rather than
      // returning a result. Whatever got as far as the server is kept.
      setError(
        `Could not reach plugpk. Check your connection and press Submit again.${draftId.current ? ' Nothing will be listed twice.' : ''}`,
      )
    } finally {
      setIsLoading(false)
      setProgress(null)
    }
  }

  if (isComplete) {
    return (
      <div className="animate-scale-in rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
        <div className="text-center">
          <CheckCircle2 size={72} className="mx-auto text-green-500" aria-hidden="true" />
          {/* No turnaround is promised because none is measured, and the outcome
              is shown where it really appears: on the dashboard. */}
          <h2 className="mb-3 mt-6 text-3xl font-black text-slate-900">Application submitted</h2>
          <p className="mx-auto max-w-lg text-slate-500">
            Thank you. Your listing, verification documents and payment details have reached the plugpk team.
          </p>
        </div>

        <ol className="mx-auto mt-8 max-w-lg space-y-4">
          {[
            {
              icon: ShieldCheck,
              title: 'Payment check',
              body: `We match your ${formatPkr(fee)} payment against our account.`,
            },
            {
              icon: Clock,
              title: 'Listing review',
              body: 'A person checks your details, documents and every charger photo.',
            },
            {
              icon: CheckCircle2,
              title: 'Live on the map',
              body: 'Once approved, drivers can find and navigate to your chargers.',
            },
          ].map((item, index) => (
            <li key={item.title} className="flex items-start gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-plug-blue-50 text-sm font-bold text-plug-blue-700">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-ui-sm text-slate-500">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-8 max-w-lg rounded-xl bg-slate-50 px-4 py-3 text-center text-ui-sm text-slate-600">
          Each step&apos;s outcome appears on your dashboard. If anything needs changing, you will see why there.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/business/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-plug-blue-600 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700"
          >
            Go to your dashboard
          </Link>
          <Link
            href={draftId.current ? `/business/profile?listing=${draftId.current}` : '/business/profile'}
            className="inline-flex h-12 items-center justify-center rounded-xl border-[1.5px] border-slate-300 bg-white px-6 text-ui font-semibold text-slate-800 transition-colors hover:border-slate-900"
          >
            Add a description
          </Link>
        </div>
      </div>
    )
  }

  const errorLine = error ? (
    <p role="alert" className="mb-4 text-sm text-red-600">
      {error}
    </p>
  ) : null

  const navigation = (back: number | null, label = 'Continue') => (
    <div className="mt-8 flex gap-3">
      {back ? (
        <Button variant="secondary" size="lg" className="h-12" onClick={() => goTo(back)}>
          Back
        </Button>
      ) : null}
      <Button fullWidth size="lg" className="h-12 bg-gradient-brand" onClick={goNext}>
        {label} &rarr;
      </Button>
    </div>
  )

  return (
    <div>
      {/* ── Step indicator ───────────────────────────────────── */}
      <ol className="mb-10 flex items-start" aria-label="Application steps">
        {STEPS.map((label, index) => {
          const step = index + 1
          const isDone = step < currentStep
          const isCurrent = step === currentStep

          return (
            <React.Fragment key={label}>
              <li className="flex flex-col items-center gap-2" aria-current={isCurrent ? 'step' : undefined}>
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300',
                    isDone || isCurrent ? 'bg-plug-blue-600 text-white' : 'bg-slate-100 text-slate-400',
                    isCurrent && 'ring-4 ring-plug-blue-100',
                  )}
                >
                  {isDone ? <Check size={16} aria-hidden="true" /> : step}
                </span>
                <span
                  className={cn(
                    'whitespace-nowrap text-xs font-medium',
                    isDone || isCurrent ? 'text-slate-900' : 'text-slate-400',
                  )}
                >
                  {label}
                </span>
              </li>

              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-[18px] h-0.5 flex-1 transition-colors duration-500',
                    step < currentStep ? 'bg-plug-blue-600' : 'bg-slate-200',
                  )}
                />
              ) : null}
            </React.Fragment>
          )
        })}
      </ol>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        {/* ── Step 1 — What is being listed ──────────────────── */}
        {currentStep === 1 ? (
          <>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">What are you listing?</h2>
            <p className="mb-8 text-slate-500">
              This decides what we ask for next — a home charger is verified with your CNIC, a business with its
              licence or registration.
            </p>

            <fieldset className="mb-6">
              <legend className="sr-only">Business type</legend>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const selected = data.businessType === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => chooseType(option.value)}
                      aria-pressed={selected}
                      className={cn(
                        'rounded-2xl border-[1.5px] p-4 text-left transition-all duration-150',
                        selected ? 'border-plug-blue-500 bg-plug-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50',
                      )}
                    >
                      <Icon size={20} className={cn('mb-2', selected ? 'text-plug-blue-600' : 'text-slate-400')} aria-hidden="true" />
                      <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                      <span className="block text-xs text-slate-400">{option.note}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {data.businessType ? (
              <p className="mb-6 flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-ui-sm text-slate-600">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-plug-blue-600" aria-hidden="true" />
                {isHome
                  ? 'Next you will need your CNIC — a photo of the front and the back.'
                  : 'Next you will need your business licence or registration — NTN, SECP or trade licence.'}
              </p>
            ) : null}

            {/*
              Shown the moment "Home Charger" is picked, before a single
              personal detail has been typed.

              A shop putting its address on a map is publishing business
              contact details. A person doing the same is publishing where they
              live, and that is a different decision — one they should be able
              to make before filling the form in, not after submitting it. The
              wording names the three specific things that become public rather
              than gesturing at "your information".
            */}
            {isHome ? (
              <div role="note" className="mb-6 flex items-start gap-3 rounded-2xl border-[1.5px] border-amber-200 bg-amber-50 p-4">
                <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">This puts your home on a public map</p>
                  <p className="mt-1 text-sm leading-relaxed text-amber-800">
                    Your <strong>address</strong>, <strong>exact location</strong> and <strong>phone number</strong>{' '}
                    will be visible to anyone using plugpk once your listing is approved. Only list a home charger you
                    are happy for strangers to drive to.
                  </p>
                </div>
              </div>
            ) : null}

            {errorLine}
            {navigation(null)}
          </>
        ) : null}

        {/* ── Step 2 — Details and verification ──────────────── */}
        {currentStep === 2 ? (
          <>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              {isHome ? 'Your charger’s details' : 'Your business details'}
            </h2>
            <p className="mb-6 text-slate-500">Who is listing, and how we confirm it is genuine</p>

            {/*
              Read-only, and deliberately so. These fields used to be typed in,
              which created the account as a side effect of listing a business —
              and anyone who knew a registered address could take that account
              over from this form. The identity is the session's now.
            */}
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border-[1.5px] border-slate-200 bg-slate-50 px-4 py-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white"
              >
                {account.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-ui-sm font-semibold text-slate-900">{account.name}</p>
                <p className="flex items-center gap-1.5 truncate text-ui-xs text-slate-500">
                  <Mail size={12} className="shrink-0 text-slate-400" aria-hidden="true" />
                  {account.email}
                </p>
              </div>
              <Link href="/login?redirect=/business/signup" className="text-ui-xs font-semibold text-plug-blue-600 hover:underline">
                Not you?
              </Link>
            </div>

            <div className="mb-5">
              <label htmlFor="biz-name-signup" className="mb-2 block text-sm font-semibold text-slate-700">{nameLabel} *</label>
              <input id="biz-name-signup" type="text" maxLength={120} value={data.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder={namePlaceholder} className={FIELD} />
            </div>

            <div className="mb-5">
              <label htmlFor="biz-phone-signup" className="mb-2 block text-sm font-semibold text-slate-700">
                {isHome ? 'Contact phone *' : 'Business phone *'}
              </label>
              <div className="relative sm:max-w-sm">
                <Phone size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input id="biz-phone-signup" type="tel" value={data.phone} onChange={(e) => update('phone', e.target.value)} placeholder="0300-1234567" className={cn(FIELD, 'pl-11')} />
              </div>
              <p className="mt-1.5 text-ui-sm text-slate-500">Shown on your listing, so drivers can reach you.</p>
            </div>

            {!isHome ? (
              <div className="mb-6">
                <label htmlFor="biz-web-signup" className="mb-2 block text-sm font-semibold text-slate-700">Website (optional)</label>
                <input id="biz-web-signup" type="url" maxLength={300} value={data.website} onChange={(e) => update('website', e.target.value)} placeholder="https://yourbusiness.pk" className={FIELD} />
              </div>
            ) : null}

            <div className="mb-6">
              <IdentityFields
                idPrefix="biz-signup"
                idType={idType}
                value={identity}
                onChange={(next) => {
                  setIdentity(next)
                  setError(null)
                }}
              />
            </div>

            {errorLine}
            {navigation(1)}
          </>
        ) : null}

        {/* ── Step 3 — Chargers ──────────────────────────────── */}
        {currentStep === 3 ? (
          <>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Your chargers</h2>
            <p className="mb-8 text-slate-500">Where they are installed, and a clear photo of each one</p>

            {/*
              Where the chargers physically are: the address and pin drivers
              navigate to. Kept apart from the owner's own address on the
              previous step — a charger at a shop is not where its owner lives,
              and only this one is ever published.
            */}
            <section aria-labelledby="biz-signup-site" className="mb-8 rounded-2xl border-[1.5px] border-slate-200 bg-slate-50/60 p-5">
              <h3 id="biz-signup-site" className="text-base font-bold text-slate-900">Where are your chargers installed?</h3>
              <p className="mb-5 mt-1 text-ui-sm text-slate-500">
                This is the address and pin drivers see on the map and navigate to.
              </p>

              <div className="mb-5">
                <label htmlFor="biz-city-signup" className="mb-2 block text-sm font-semibold text-slate-700">City *</label>
                <select id="biz-city-signup" value={data.city} onChange={(e) => update('city', e.target.value)} className={cn(FIELD, 'cursor-pointer sm:max-w-sm')}>
                  <option value="">Select the city</option>
                  {PAKISTAN_CITIES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="mb-5">
                <label htmlFor="biz-addr-signup" className="mb-2 block text-sm font-semibold text-slate-700">Installation address *</label>
                <textarea id="biz-addr-signup" maxLength={300} value={data.address} onChange={(e) => update('address', e.target.value)} placeholder="24 Mall Road, Gulberg" className="min-h-[80px] w-full resize-y rounded-xl border-[1.5px] border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none focus:border-plug-blue-500" />
              </div>

              <div>
                <p className="mb-1 text-sm font-semibold text-slate-700">Exact location *</p>
                <p className="mb-3 text-ui-sm text-slate-500">
                  The pin EV drivers will navigate to. Stand at your chargers and tap the button, or type the
                  coordinates.
                </p>
                <LocationPicker
                  idPrefix="biz-signup"
                  lat={data.lat}
                  lng={data.lng}
                  onChange={({ lat, lng }) => {
                    setData((current) => ({ ...current, lat, lng }))
                    setError(null)
                  }}
                  currentAddress={data.address}
                  onAddressFound={({ address, city }) => {
                    setData((current) => ({
                      ...current,
                      address,
                      // The city moves only when the lookup matched one on our list,
                      // and never clears a choice already made.
                      city: city ?? current.city,
                    }))
                    setError(null)
                  }}
                />
              </div>
            </section>

            <p className="mb-3 text-sm font-semibold text-slate-700">Chargers *</p>
            <p className="mb-4 text-ui-sm text-slate-500">Add one clear photo of every charger. A port close-up is recommended.</p>

            <div className="mb-5 flex flex-col gap-3">
              {data.chargers.map((charger, index) => (
                <div key={index} className="relative rounded-2xl border border-slate-200 bg-white p-5">
                  <button
                    type="button"
                    onClick={() => {
                      forgetUpload(charger.photoFile)
                      forgetUpload(charger.portPhotoFile)
                      update('chargers', data.chargers.filter((_, i) => i !== index))
                    }}
                    aria-label={`Remove charger ${index + 1}`}
                    className="absolute right-4 top-4 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>

                  <p className="mb-3 text-sm font-bold text-slate-900">Charger {index + 1}</p>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block">
                      <span className="mb-1.5 block text-xs text-slate-500">Connector</span>
                      <select
                        value={charger.connectorType}
                        onChange={(e) => {
                          const next = [...data.chargers]
                          next[index] = { ...charger, connectorType: e.target.value as ConnectorType }
                          update('chargers', next)
                        }}
                        className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 px-3 text-sm"
                      >
                        {CONNECTOR_TYPES.map((type) => (<option key={type} value={type}>{type}</option>))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs text-slate-500">Power (kW)</span>
                      <input
                        type="number"
                        min={1}
                        value={charger.maxPowerKw}
                        onChange={(e) => {
                          const next = [...data.chargers]
                          next[index] = { ...charger, maxPowerKw: Number(e.target.value) }
                          update('chargers', next)
                        }}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs text-slate-500">Ports</span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={charger.ports}
                        onChange={(e) => {
                          const next = [...data.chargers]
                          next[index] = { ...charger, ports: Number(e.target.value) }
                          update('chargers', next)
                        }}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm font-medium text-slate-600 hover:border-plug-blue-300 hover:bg-plug-blue-50">
                      <ImagePlus size={17} aria-hidden="true" />
                      <span className="truncate">{charger.photoFile ? charger.photoFile.name : 'Add charger photo *'}</span>
                      <input
                        type="file"
                        accept={IMAGE_ACCEPT}
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          event.target.value = ''
                          if (!file) return
                          forgetUpload(charger.photoFile)
                          const next = [...data.chargers]
                          next[index] = { ...charger, photoFile: file }
                          update('chargers', next)
                        }}
                      />
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm font-medium text-slate-600 hover:border-plug-blue-300 hover:bg-plug-blue-50">
                      <ImagePlus size={17} aria-hidden="true" />
                      <span className="truncate">{charger.portPhotoFile ? charger.portPhotoFile.name : 'Add port close-up (recommended)'}</span>
                      <input
                        type="file"
                        accept={IMAGE_ACCEPT}
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          event.target.value = ''
                          if (!file) return
                          forgetUpload(charger.portPhotoFile)
                          const next = [...data.chargers]
                          next[index] = { ...charger, portPhotoFile: file }
                          update('chargers', next)
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {data.chargers.length < MAX_CHARGERS ? (
              <button
                type="button"
                onClick={() =>
                  update('chargers', [...data.chargers, { connectorType: 'CCS2', maxPowerKw: 50, ports: 1 }])
                }
                className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-8 transition-all hover:border-plug-blue-300 hover:bg-plug-blue-50"
              >
                <Plus size={32} className="text-slate-300" aria-hidden="true" />
                <span className="mt-2 text-sm font-medium text-slate-500">Add a Charger</span>
              </button>
            ) : null}

            <div className="mt-6">{errorLine}</div>
            {navigation(2, 'Continue to payment')}
          </>
        ) : null}

        {/* ── Step 4 — Payment ───────────────────────────────── */}
        {currentStep === 4 ? (
          <>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Pay the listing fee</h2>
            <p className="mb-8 text-slate-500">
              Your listing goes to our review team once the payment is sent. Nothing is published before it is
              confirmed and approved.
            </p>

            <PaymentFields
              idPrefix="biz-signup"
              fee={fee}
              accounts={accounts}
              value={payment}
              onChange={(next) => {
                setPayment(next)
                setError(null)
              }}
            />

            <div className="mt-6">{errorLine}</div>
            {accounts.length > 0 ? navigation(3, 'Review application') : (
              <div className="mt-8">
                <Button variant="secondary" size="lg" className="h-12" onClick={() => goTo(3)}>
                  Back
                </Button>
              </div>
            )}
          </>
        ) : null}

        {/* ── Step 5 — Review and submit ─────────────────────── */}
        {currentStep === 5 ? (
          <>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Review and submit</h2>
            <p className="mb-8 text-slate-500">Check everything before it goes to the plugpk review team</p>

            <div className="mb-6 divide-y divide-slate-200 rounded-2xl bg-slate-50 px-6">
              {[
                {
                  title: isHome ? 'Listing' : 'Business',
                  step: 2,
                  rows: [
                    ['Type', TYPE_LABEL[data.businessType] ?? '—'],
                    [nameLabel.replace(' Name', ''), data.businessName],
                    ['Phone', data.phone],
                  ],
                },
                {
                  title: 'Verification',
                  step: 2,
                  rows:
                    idType === 'cnic'
                      ? [
                          ['CNIC', normalizeCnic(identity.idNumber) ? maskCnic(normalizeCnic(identity.idNumber) as string) : '—'],
                          ['Address on CNIC', identity.address.trim()],
                          ['Documents', 'Front and back of CNIC'],
                        ]
                      : [
                          ['Document', licenceKindLabel(identity.idDetail)],
                          ['Number', identity.idNumber],
                          ['Registered address', identity.address.trim()],
                        ],
                },
                {
                  title: 'Chargers',
                  step: 3,
                  rows: [
                    ['Installed at', [data.address, data.city].filter(Boolean).join(', ')],
                    ...data.chargers.map((charger, index) => [
                      `Charger ${index + 1}`,
                      `${charger.connectorType} · ${charger.maxPowerKw} kW · ${charger.ports} port${charger.ports === 1 ? '' : 's'}`,
                    ]),
                  ],
                },
                {
                  title: 'Payment',
                  step: 4,
                  rows: [
                    ['Amount', formatPkr(fee)],
                    ['Method', payment.method ? PAYMENT_METHOD_LABEL[payment.method] : '—'],
                    ['Transaction ID', payment.reference],
                    ['Paid on', payment.paidOn],
                  ],
                },
              ].map((section) => (
                <div key={section.title} className="py-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">{section.title}</h3>
                    <button type="button" onClick={() => goTo(section.step)} className="text-xs font-medium text-plug-blue-600 hover:underline">
                      Edit
                    </button>
                  </div>
                  {section.rows.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 py-1">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="text-right text-sm font-medium text-slate-900">{value || '—'}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Repeated at the point of submission. Step 1 is where the choice
                is made, but this is where it becomes irreversible. */}
            {isHome ? (
              <div role="note" className="mb-5 flex items-start gap-3 rounded-2xl border-[1.5px] border-amber-200 bg-amber-50 p-4">
                <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-amber-800">
                  Once approved, <strong>{data.address || 'your address'}</strong>, its exact coordinates and{' '}
                  <strong>{data.phone || 'your phone number'}</strong> will be visible to everyone on the plugpk map.
                  Your CNIC is never shown.
                </p>
              </div>
            ) : null}

            <label className="mb-6 flex items-start gap-3">
              <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setError(null) }} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-plug-blue-600" />
              <span className="text-sm text-slate-600">
                I agree to the{' '}
                <a href="/terms#partners" target="_blank" rel="noopener" className="font-semibold text-plug-blue-600 hover:underline">
                  plugpk Business Terms
                </a>
                , confirm my information and documents are genuine
                {isHome ? ', and understand my home address and phone number will be shown publicly' : ''}.
              </span>
            </label>

            {errorLine}
            {progress ? (
              <p aria-live="polite" className="mb-4 text-sm text-slate-500">
                {progress}
              </p>
            ) : null}

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" className="h-14" onClick={() => goTo(4)}>Back</Button>
              <Button fullWidth size="lg" className="h-14 bg-gradient-brand" isLoading={isLoading} onClick={handleSubmit}>
                Submit for review
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
