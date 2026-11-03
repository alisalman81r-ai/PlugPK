// src/components/dashboard/ProfileCompletion.tsx
import Link from 'next/link'

import { ArrowRight, Car, Check, ImagePlus, MapPin, UserCircle } from '@/components/ui/icons'
import { btnClass } from '@/components/v2/ui'
import { cn } from '@/lib/utils'

import { PANEL, PANEL_H2 } from './dash-ui'

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
      <section className="flex items-center gap-3 rounded-[22px] border border-[#BFEBD1] bg-[#E9F8EF] px-5 py-4">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-volt">
          <Check size={18} />
        </span>
        <p className="text-sm text-[#157A45]">
          <span className="font-semibold">Profile 100% complete.</span> Everything is filled in — thank you.
        </p>
      </section>
    )
  }

  // The ring: r = 26 → circumference ≈ 163.4.
  const R = 26
  const C = 2 * Math.PI * R

  return (
    <section aria-labelledby="profile-completion-title" className={PANEL}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 sm:w-72 sm:shrink-0">
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completion"
            className="relative h-[72px] w-[72px] shrink-0"
          >
            <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="32" cy="32" r={R} fill="none" strokeWidth="7" className="stroke-stone" />
              <circle
                cx="32"
                cy="32"
                r={R}
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - percent / 100)}
                className="stroke-ink transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-base font-semibold tabular-nums text-ink">
              {percent}%
            </span>
          </div>
          <div>
            <h2 id="profile-completion-title" className={cn(PANEL_H2, 'text-[24px]')}>
              Profile {percent}% complete
            </h2>
            <p className="mt-1.5 text-sm text-muted">
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
                  'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-3 py-2.5 sm:flex-nowrap',
                  part.done ? 'bg-chalk/60' : 'border border-ink/10 bg-chalk',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    part.done ? 'bg-ink text-volt' : 'bg-white text-ink',
                  )}
                >
                  {part.done ? <Check size={16} /> : <Icon size={16} />}
                </span>
                {/* Below sm the button takes its own line under the text: beside
                    it, the reason was squeezed to three words a line. */}
                <span className={cn('min-w-0 flex-1', !part.done && 'basis-[calc(100%-2.75rem)] sm:basis-auto')}>
                  <span className={cn('block text-sm font-semibold', part.done ? 'text-muted' : 'text-ink')}>
                    {part.label}
                    <span className="sr-only">{part.done ? ' — done' : ' — not added yet'}</span>
                  </span>
                  {part.done ? null : <span className="block text-[13px] text-muted">{part.reason}</span>}
                </span>
                {part.done ? (
                  <span className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#157A45]">Done</span>
                ) : (
                  <Link
                    href={part.href}
                    className={btnClass('light', 'sm', 'ml-11 h-10 shrink-0 gap-1.5 border border-ink/10 px-4 sm:ml-0 [&_svg]:h-3.5 [&_svg]:w-3.5')}
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
