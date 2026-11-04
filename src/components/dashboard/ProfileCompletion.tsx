// src/components/dashboard/ProfileCompletion.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { ICar, ICheck, IImg, IPin } from './acct-icons'
import { abtn, PANEL } from './dash-ui'

/**
 * How complete the account is (.aprog of the design): a ring, the figure in
 * words, and the four parts as a checklist.
 *
 * Four parts, a quarter each. The account itself (name and email) is done at
 * sign-up, so a new account starts at 25% rather than zero. The other three
 * make the site more useful when filled in: a photo (shown on posts and
 * reviews), a city (nearer stations and clubs) and a car (chargers that fit
 * its connector). Each missing part is an amber row with a button that goes
 * straight to where it is filled in; a done part turns paper with a volt tick.
 *
 * The ring draws itself in from empty over 1.1s once the page has painted,
 * as page-account.js does.
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
  reason: string
  href: string
  cta: string
  icon: React.ReactNode
}

export function ProfileCompletion({ name, email, avatar, city, vehicle }: ProfileCompletionProps) {
  const parts: Part[] = [
    {
      key: 'account',
      label: 'Account details',
      done: Boolean(name.trim() && email.trim()),
      reason: 'Your name and email',
      href: '/dashboard/settings',
      cta: 'Edit',
      icon: <ICheck size={17} />,
    },
    {
      key: 'picture',
      label: 'Profile picture',
      done: Boolean(avatar),
      reason: 'Shown in the header and on your posts',
      href: '/dashboard/settings#photo',
      cta: 'Add picture',
      icon: <IImg size={17} />,
    },
    {
      key: 'city',
      label: 'Your city',
      done: Boolean(city?.trim()),
      reason: 'So we show stations and clubs near you first',
      href: '/dashboard/settings#city',
      cta: 'Choose city',
      icon: <IPin size={17} />,
    },
    {
      key: 'car',
      label: 'Your car',
      done: Boolean(vehicle?.trim()),
      reason: 'So we suggest chargers that fit your connector',
      href: '/dashboard/vehicles',
      cta: 'Add your car',
      icon: <ICar size={17} />,
    },
  ]

  const doneCount = parts.filter((part) => part.done).length
  const pct = Math.round((doneCount / parts.length) * 100)
  const left = parts.length - doneCount

  // Starts empty and eases to the figure on the next frame.
  const [offset, setOffset] = React.useState(100)
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setOffset(100 - pct))
    return () => cancelAnimationFrame(raf)
  }, [pct])

  return (
    <section
      id="progress"
      aria-labelledby="profile-completion-title"
      className={cn(
        PANEL,
        'grid items-center gap-6 grid-cols-[auto_minmax(180px,.7fr)_minmax(0,1.6fr)] max-[1100px]:grid-cols-[auto_minmax(0,1fr)]',
      )}
    >
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completion"
        className="relative h-[104px] w-[104px] max-[640px]:h-[84px] max-[640px]:w-[84px]"
      >
        <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full -rotate-90">
          <circle cx="32" cy="32" r="27" fill="none" strokeWidth="7" className="stroke-chalk" />
          <circle
            cx="32"
            cy="32"
            r="27"
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={offset}
            className="stroke-ink [transition:stroke-dashoffset_1.1s_cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
          />
        </svg>
        <b className="absolute inset-0 grid place-items-center font-mono text-[22px] font-semibold tabular-nums tracking-[-0.01em] text-ink">{pct}%</b>
      </div>

      <div>
        <h2 id="profile-completion-title" className="m-0 font-display text-[28px] font-normal leading-[1.1] text-ink">
          Profile {pct}% complete.
        </h2>
        <p className="mt-2 text-[15px] text-muted">
          {left ? `${left} thing${left === 1 ? '' : 's'} left to add.` : 'Everything is filled in.'}
        </p>
      </div>

      <ul className="m-0 grid list-none gap-2 p-0 max-[1100px]:col-span-full">
        {parts.map((part) => (
          <li
            key={part.key}
            className={cn(
              'flex items-center gap-3.5 rounded-2xl border px-3.5 py-3 max-[640px]:flex-wrap',
              part.done ? 'border-ink/10 bg-paper' : 'border-[#FFB020]/35 bg-[#FFF9EA]',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border',
                part.done
                  ? "border-volt bg-volt text-ink after:h-1.5 after:w-2.5 after:-translate-y-px after:-rotate-45 after:border-b-2 after:border-l-2 after:border-ink after:content-['']"
                  : 'border-[#FFB020]/35 bg-white text-[#8a5a00]',
              )}
            >
              {part.done ? null : part.icon}
            </span>
            <div className="min-w-0 flex-1">
              <b className="block text-[15px] font-semibold text-ink">
                {part.label}
                <span className="sr-only">{part.done ? ' — done' : ' — not added yet'}</span>
              </b>
              <span className="text-[13px] text-muted">{part.reason}</span>
            </div>
            {part.done ? (
              <em className="block font-mono text-xs font-semibold uppercase not-italic tracking-[0.1em] text-[#12804a]">Done</em>
            ) : (
              <Link href={part.href} className={abtn('line', 'sm', 'max-[640px]:w-full')}>
                {part.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
