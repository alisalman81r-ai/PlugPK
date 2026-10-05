// src/components/dashboard/ProfileCompletion.tsx
import Link from 'next/link'

import { ArrowRight, Car, Check, ImagePlus, MapPin, UserCircle } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

/**
 * How complete the account is, as a percentage, with the missing parts listed.
 *
 * Four parts, a quarter each. The account itself (name and email) is done at
 * sign-up, so a new account starts at 25% rather than zero — it is honest, and
 * it reads as a start rather than a failure. The other three are the things a
 * driver can leave out and that make the site more useful when filled in: a
 * photo (shown on posts and reviews), a city (nearer stations and clubs) and
 * a car (chargers that fit its connector).
 *
 * Each missing part is a reminder with a button that goes straight to where
 * it is filled in. At 100% the card shrinks to a single line.
 */

export interface ProfileCompletionProps {
  name: string
  email: string
  avatar?: string | null
  city?: string | null
  vehicle?: string | null
}

interface Part {
  key: string
  label: string
  done: boolean
  /** Why it is worth doing, shown while it is missing. */
  reason: string
  href: string
  cta: string
  icon: typeof Car
}

export function ProfileCompletion({ name, email, avatar, city, vehicle }: ProfileCompletionProps) {
  const parts: Part[] = [
    {
      key: 'account',
      label: 'Account details',
      done: Boolean(name.trim() && email.trim()),
      reason: 'Your name and email.',
      href: '/dashboard/settings',
      cta: 'Edit',
      icon: UserCircle,
    },
    {
      key: 'photo',
      label: 'Profile picture',
      done: Boolean(avatar),
      reason: 'Shown beside your posts and reviews.',
      href: '/dashboard/settings#photo',
      cta: 'Add photo',
      icon: ImagePlus,
    },
    {
      key: 'city',
      label: 'Your city',
      done: Boolean(city?.trim()),
      reason: 'So we show stations and clubs near you first.',
      href: '/dashboard/settings#city',
      cta: 'Choose city',
      icon: MapPin,
    },
    {
      key: 'car',
      label: 'Your car',
      done: Boolean(vehicle?.trim()),
      reason: 'So we suggest chargers that fit your connector.',
      href: '/dashboard/vehicles',
      cta: 'Add your car',
      icon: Car,
    },
  ]

  const doneCount = parts.filter((part) => part.done).length
  const percent = Math.round((doneCount / parts.length) * 100)
  const missing = parts.filter((part) => !part.done)

  if (missing.length === 0) {
    return (
      <section className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
          <Check size={18} />
        </span>
        <p className="text-ui-sm text-green-800">
          <span className="font-semibold">Profile 100% complete.</span> Everything is filled in — thank you.
        </p>
      </section>
    )
  }

  // The ring: r = 26 → circumference ≈ 163.4.
  const R = 26
  const C = 2 * Math.PI * R

  return (
    <section aria-labelledby="profile-completion-title" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 sm:w-64 sm:shrink-0">
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completion"
            className="relative h-[72px] w-[72px] shrink-0"
          >
            <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="32" cy="32" r={R} fill="none" strokeWidth="7" className="stroke-slate-100" />
              <circle
                cx="32"
                cy="32"
                r={R}
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - percent / 100)}
                className={cn(
                  'transition-[stroke-dashoffset] duration-700 ease-out',
                  percent >= 75 ? 'stroke-green-500' : percent >= 50 ? 'stroke-plug-cyan-500' : 'stroke-amber-500',
                )}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold text-slate-900">
              {percent}%
            </span>
          </div>
          <div>
            <h2 id="profile-completion-title" className="text-lg font-bold text-slate-900">
              Profile {percent}% complete
            </h2>
            <p className="mt-0.5 text-ui-sm text-slate-500">
              {missing.length === 1 ? 'One thing left to add.' : `${missing.length} things left to add.`}
            </p>
          </div>
        </div>

        <ul className="flex flex-1 flex-col gap-2">
          {parts.map((part) => {
            const Icon = part.icon
            return (
              <li
                key={part.key}
                className={cn(
                  'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-3 py-2.5 sm:flex-nowrap',
                  part.done ? 'bg-slate-50/60' : 'border border-amber-200 bg-amber-50/60',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    part.done ? 'bg-green-100 text-green-600' : 'bg-white text-amber-600',
                  )}
                >
                  {part.done ? <Check size={16} /> : <Icon size={16} />}
                </span>
                {/* Below sm the button takes its own line under the text: beside
                    it, the reason was squeezed to three words a line. */}
                <span className={cn('min-w-0 flex-1', !part.done && 'basis-[calc(100%-2.75rem)] sm:basis-auto')}>
                  <span className={cn('block text-ui-sm font-semibold', part.done ? 'text-slate-500' : 'text-slate-900')}>
                    {part.label}
                    <span className="sr-only">{part.done ? ' — done' : ' — not added yet'}</span>
                  </span>
                  {part.done ? null : <span className="block text-ui-xs text-slate-500">{part.reason}</span>}
                </span>
                {part.done ? (
                  <span className="shrink-0 text-ui-xs font-semibold text-green-600">Done</span>
                ) : (
                  <Link
                    href={part.href}
                    className="ml-11 inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-3 py-1.5 sm:ml-0 text-ui-sm font-semibold text-plug-blue-700 ring-1 ring-plug-blue-200 transition-colors hover:bg-plug-blue-50"
                  >
                    {part.cta}
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
