// src/components/business/BusinessSignUpForm.tsx
'use client'

import {
  Building2,
  Car,
  Check,
  CheckCircle2,
  Coffee,
  Eye,
  EyeOff,
  Hotel,
  Lock,
  Mail,
  Phone,
  Plus,
  ShoppingBag,
  Trash2,
  User as UserIcon,
  Utensils,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { Button } from '@/components/ui'
import { CONNECTOR_TYPES, PAKISTAN_CITIES } from '@/lib/constants'
import type { BusinessType, ConnectorType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DraftCharger {
  connectorType: ConnectorType
  maxPowerKw: number
  ports: number
}

interface FormData {
  ownerName: string
  email: string
  password: string
  phone: string
  businessName: string
  businessType: BusinessType | ''
  city: string
  address: string
  website: string
  chargers: DraftCharger[]
}

const STEPS = ['Account', 'Business', 'Chargers', 'Review'] as const

const TYPE_OPTIONS: { value: BusinessType; label: string; icon: LucideIcon; note: string }[] = [
  { value: 'hotel', label: 'Hotel', icon: Hotel, note: 'Guests charge overnight' },
  { value: 'restaurant', label: 'Restaurant', icon: Utensils, note: 'Charge over a meal' },
  { value: 'mall', label: 'Shopping Mall', icon: ShoppingBag, note: 'Charge while shopping' },
  { value: 'office', label: 'Office', icon: Building2, note: 'Workplace charging' },
  { value: 'dealership', label: 'Dealership', icon: Car, note: 'Showroom and service' },
  { value: 'service-center', label: 'Service Center', icon: Wrench, note: 'Repairs and servicing' },
]

const FIELD =
  'h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-ui text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-plug-blue-500 focus:shadow-focus'

const MAX_CHARGERS = 10

export function BusinessSignUpForm() {
  const [currentStep, setCurrentStep] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isComplete, setIsComplete] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [agreed, setAgreed] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [data, setData] = React.useState<FormData>({
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    businessType: '',
    city: '',
    address: '',
    website: '',
    chargers: [],
  })

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((current) => ({ ...current, [key]: value }))
    setError(null)
  }

  const validateStep = (step: number): string | null => {
    if (step === 1) {
      if (!data.ownerName.trim()) return 'Enter your full name.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return 'Enter a valid email.'
      if (data.password.length < 8) return 'Password must be at least 8 characters.'
      if (!/^03\d{2}-?\d{7}$/.test(data.phone.replace(/\s/g, '')))
        return 'Enter a valid phone number, e.g. 0300-1234567.'
    }
    if (step === 2) {
      if (!data.businessName.trim()) return 'Enter your business name.'
      if (!data.businessType) return 'Select a business type.'
      if (!data.city) return 'Select your city.'
      if (!data.address.trim()) return 'Enter your full address.'
    }
    return null
  }

  const goNext = () => {
    const found = validateStep(currentStep)
    if (found) {
      setError(found)
      return
    }
    setError(null)
    setCurrentStep((step) => Math.min(step + 1, 4))
  }

  const handleSubmit = async () => {
    if (!agreed) {
      setError('Please accept the Business Terms to continue.')
      return
    }
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2500))
    setIsLoading(false)
    setIsComplete(true)
  }

  if (isComplete) {
    return (
      <div className="animate-scale-in text-center">
        <CheckCircle2 size={80} className="mx-auto text-green-500" aria-hidden="true" />
        <h2 className="mb-3 mt-6 text-3xl font-black text-slate-900">You&apos;re Live on Plug.pk!</h2>
        <p className="mb-8 text-slate-500">
          Your listing is under review. You&apos;ll receive an email within 24 hours once it&apos;s
          live.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/business/dashboard"
            className="rounded-2xl border border-slate-200 bg-white p-5 text-center transition-all hover:border-blue-200 hover:bg-blue-50"
          >
            <span className="block font-semibold text-slate-900">Access Dashboard</span>
          </Link>
          <Link
            href="/business/profile"
            className="rounded-2xl border border-slate-200 bg-white p-5 text-center transition-all hover:border-blue-200 hover:bg-blue-50"
          >
            <span className="block font-semibold text-slate-900">Add More Details</span>
          </Link>
          <Link
            href="/for-businesses"
            className="rounded-2xl border border-slate-200 bg-white p-5 text-center transition-all hover:border-blue-200 hover:bg-blue-50"
          >
            <span className="block font-semibold text-slate-900">Share Your Listing</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ── Step indicator ───────────────────────────────────── */}
      <div className="mb-10 flex items-start">
        {STEPS.map((label, index) => {
          const step = index + 1
          const isDone = step < currentStep
          const isCurrent = step === currentStep

          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300',
                    isDone || isCurrent ? 'bg-plug-blue-600 text-white' : 'bg-slate-100 text-slate-400',
                    isCurrent && 'ring-4 ring-blue-100',
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
              </div>

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
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        {/* ── Step 1 — Account ───────────────────────────────── */}
        {currentStep === 1 ? (
          <>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Create your account</h2>
            <p className="mb-8 text-slate-500">Start with your basic details</p>

            <div className="mb-5">
              <label htmlFor="owner" className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input id="owner" type="text" value={data.ownerName} onChange={(e) => update('ownerName', e.target.value)} placeholder="Ahmed Khan" className={cn(FIELD, 'pl-11')} />
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="biz-signup-email" className="mb-2 block text-sm font-semibold text-slate-700">
                Email *
              </label>
              <div className="relative">
                <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input id="biz-signup-email" type="email" value={data.email} onChange={(e) => update('email', e.target.value)} placeholder="info@yourbusiness.pk" autoComplete="email" className={cn(FIELD, 'pl-11')} />
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="biz-signup-pass" className="mb-2 block text-sm font-semibold text-slate-700">
                Password *
              </label>
              <div className="relative">
                <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input id="biz-signup-pass" type={showPassword ? 'text' : 'password'} value={data.password} onChange={(e) => update('password', e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" className={cn(FIELD, 'pl-11 pr-11')} />
                <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="biz-phone-signup" className="mb-2 block text-sm font-semibold text-slate-700">
                Phone *
              </label>
              <div className="relative">
                <Phone size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input id="biz-phone-signup" type="tel" value={data.phone} onChange={(e) => update('phone', e.target.value)} placeholder="0300-1234567" className={cn(FIELD, 'pl-11')} />
              </div>
            </div>

            {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

            <Button fullWidth size="lg" className="h-12 bg-gradient-brand" onClick={goNext}>
              Continue &rarr;
            </Button>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already listed?{' '}
              <Link href="/login" className="font-semibold text-plug-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </>
        ) : null}

        {/* ── Step 2 — Business ──────────────────────────────── */}
        {currentStep === 2 ? (
          <>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Tell us about your business</h2>
            <p className="mb-8 text-slate-500">This is what EV owners will see</p>

            <fieldset className="mb-6">
              <legend className="mb-3 text-sm font-semibold text-slate-700">Business Type *</legend>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const selected = data.businessType === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update('businessType', option.value)}
                      aria-pressed={selected}
                      className={cn(
                        'rounded-2xl border-[1.5px] p-4 text-left transition-all duration-150',
                        selected ? 'border-plug-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50',
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

            <div className="mb-5">
              <label htmlFor="biz-name-signup" className="mb-2 block text-sm font-semibold text-slate-700">Business Name *</label>
              <input id="biz-name-signup" type="text" value={data.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder="Mall Road Premium Hotel" className={FIELD} />
            </div>

            <div className="mb-5">
              <label htmlFor="biz-city-signup" className="mb-2 block text-sm font-semibold text-slate-700">City *</label>
              <select id="biz-city-signup" value={data.city} onChange={(e) => update('city', e.target.value)} className={cn(FIELD, 'cursor-pointer')}>
                <option value="">Select your city</option>
                {PAKISTAN_CITIES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label htmlFor="biz-addr-signup" className="mb-2 block text-sm font-semibold text-slate-700">Full Address *</label>
              <textarea id="biz-addr-signup" value={data.address} onChange={(e) => update('address', e.target.value)} placeholder="24 Mall Road, Gulberg" className="min-h-[80px] w-full resize-y rounded-xl border-[1.5px] border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none focus:border-plug-blue-500" />
            </div>

            <div className="mb-6">
              <label htmlFor="biz-web-signup" className="mb-2 block text-sm font-semibold text-slate-700">Website (optional)</label>
              <input id="biz-web-signup" type="url" value={data.website} onChange={(e) => update('website', e.target.value)} placeholder="https://yourbusiness.pk" className={FIELD} />
            </div>

            {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" className="h-12" onClick={() => setCurrentStep(1)}>Back</Button>
              <Button fullWidth size="lg" className="h-12 bg-gradient-brand" onClick={goNext}>Continue &rarr;</Button>
            </div>
          </>
        ) : null}

        {/* ── Step 3 — Chargers ──────────────────────────────── */}
        {currentStep === 3 ? (
          <>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Add your chargers</h2>
            <p className="mb-8 text-slate-500">You can always add more later</p>

            <div className="mb-5 flex flex-col gap-3">
              {data.chargers.map((charger, index) => (
                <div key={index} className="relative rounded-2xl border border-slate-200 bg-white p-5">
                  <button
                    type="button"
                    onClick={() => update('chargers', data.chargers.filter((_, i) => i !== index))}
                    aria-label={`Remove charger ${index + 1}`}
                    className="absolute right-4 top-4 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="grid gap-3 sm:grid-cols-2">
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
                </div>
              ))}
            </div>

            {data.chargers.length < MAX_CHARGERS ? (
              <button
                type="button"
                onClick={() =>
                  update('chargers', [
                    ...data.chargers,
                    { connectorType: 'CCS2', maxPowerKw: 50, ports: 1 },
                  ])
                }
                className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-8 transition-all hover:border-blue-300 hover:bg-blue-50"
              >
                <Plus size={32} className="text-slate-300" aria-hidden="true" />
                <span className="mt-2 text-sm font-medium text-slate-500">Add a Charger</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="mt-4 w-full text-center text-sm text-slate-400 hover:text-slate-600"
            >
              I&apos;ll add chargers later
            </button>

            <div className="mt-6 flex gap-3">
              <Button variant="secondary" size="lg" className="h-12" onClick={() => setCurrentStep(2)}>Back</Button>
              <Button fullWidth size="lg" className="h-12 bg-gradient-brand" onClick={goNext}>Continue &rarr;</Button>
            </div>
          </>
        ) : null}

        {/* ── Step 4 — Review ────────────────────────────────── */}
        {currentStep === 4 ? (
          <>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Review your listing</h2>
            <p className="mb-8 text-slate-500">Check everything looks right before submitting</p>

            <div className="mb-6 rounded-2xl bg-slate-50 p-6">
              {[
                { title: 'Account', step: 1, rows: [['Name', data.ownerName], ['Email', data.email], ['Phone', data.phone]] },
                { title: 'Business', step: 2, rows: [['Name', data.businessName], ['Type', data.businessType], ['City', data.city], ['Address', data.address]] },
              ].map((section) => (
                <div key={section.title} className="mb-6 last:mb-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">{section.title}</h3>
                    <button type="button" onClick={() => setCurrentStep(section.step)} className="text-xs font-medium text-plug-blue-600 hover:underline">Edit</button>
                  </div>
                  {section.rows.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 py-1">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="text-right text-sm font-medium text-slate-900">{value || '—'}</span>
                    </div>
                  ))}
                </div>
              ))}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Chargers</h3>
                  <button type="button" onClick={() => setCurrentStep(3)} className="text-xs font-medium text-plug-blue-600 hover:underline">Edit</button>
                </div>
                {data.chargers.length === 0 ? (
                  <p className="text-sm text-slate-500">No chargers added yet</p>
                ) : (
                  data.chargers.map((charger, index) => (
                    <div key={index} className="flex justify-between gap-4 py-1">
                      <span className="text-sm text-slate-500">{charger.connectorType}</span>
                      <span className="font-mono text-sm text-slate-900">
                        {charger.maxPowerKw} kW · {charger.ports} port{charger.ports === 1 ? '' : 's'} ·{' '}
                        {charger.maxPowerKw} kW
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <label className="mb-6 flex items-start gap-3">
              <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setError(null) }} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600" />
              <span className="text-sm text-slate-600">
                I agree to Plug.pk Business Terms and confirm my information is accurate
              </span>
            </label>

            {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" className="h-14" onClick={() => setCurrentStep(3)}>Back</Button>
              <Button fullWidth size="lg" className="h-14 bg-gradient-brand" isLoading={isLoading} onClick={handleSubmit}>
                Submit My Listing
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
