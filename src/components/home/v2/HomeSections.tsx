// src/components/home/v2/HomeSections.tsx
//
// The home page's server-rendered bands in the landing-v2 design: services,
// community, partner up and the app. Every figure is read from the database by
// the page and handed in; nothing here is a placeholder count.

import Image from 'next/image'
import Link from 'next/link'

import { LogoMark } from '@/components/ui/Logo'
import { btnClass, BtnEnd, Eyebrow, H2_CLASS, Hl, LEAD_CLASS, SectionHead, WRAP } from '@/components/v2/ui'
import { RevealGroup, RevealItem } from '@/components/v2/Reveal'
import { POST_CATEGORY_META, SERVICE_CATEGORIES } from '@/lib/constants'
import type { CommunityFigures } from '@/lib/db/community-queries'
import type { CommunityPost, EVClub } from '@/lib/types'
import { cn } from '@/lib/utils'
import { BoltFill, Phone, SearchGlyph, StatusBar } from './Phone'
import { PK_PATH } from './pk-geo'

/* ═══ 5. Services ═══════════════════════════════════════════════════════ */

const SERVICE_COPY: Record<string, { tag: string; body: string; icon: React.ReactNode }> = {
  dealership: {
    tag: 'Buy & test drive',
    body: 'Authorised EV dealers across Pakistan, for test drives, prices and delivery dates.',
    icon: (
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 30v-6l4-9a4 4 0 0 1 3.7-2.5h18.6A4 4 0 0 1 37 15l4 9v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
        <path d="M7 24h34M11 32v4M37 32v4" />
        <circle cx="14" cy="27.5" r="1.5" />
        <circle cx="34" cy="27.5" r="1.5" />
      </g>
    ),
  },
  'service-center': {
    tag: 'Repairs & upkeep',
    body: 'Certified workshops that know battery, motor and software, not only the brakes.',
    icon: (
      <path
        d="M29.5 9.5a9 9 0 0 0-11 11.4L8.6 30.8a3.5 3.5 0 0 0 0 5l3.6 3.6a3.5 3.5 0 0 0 5 0l9.9-9.9a9 9 0 0 0 11.4-11l-5.6 5.6-5.6-1.6-1.6-5.6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    ),
  },
  'home-charger-installer': {
    tag: 'Charge at home',
    body: 'Professional wall-charger installs, from the site survey to the first plug-in.',
    icon: (
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        <path d="M8 21 24 8l16 13v19H8z" />
        <path d="m25.5 23-4.5 7h6l-4.5 7" />
      </g>
    ),
  },
  'roadside-assistance': {
    tag: 'Help on the road',
    body: 'Round-the-clock support: a mobile charge, a tow, or advice on the phone.',
    icon: (
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="16" />
        <circle cx="24" cy="24" r="7" />
        <path d="M12.7 12.7 19 19M29 29l6.3 6.3M35.3 12.7 29 19M19 29l-6.3 6.3" />
      </g>
    ),
  },
}

export function ServicesBand({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
  return (
    <section data-theme="light" className="bg-paper py-[clamp(96px,12vw,160px)]">
      <div className={WRAP}>
        <SectionHead
          eyebrow="EV ecosystem"
          title={
            <>
              Everything an <br />
              <Hl>EV driver</Hl> needs.
            </>
          }
          lead="Beyond charging — dealers, workshops, installers and roadside help, each one checked before it is listed."
        />
        <RevealGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SERVICE_CATEGORIES.map((category, i) => {
            const copy = SERVICE_COPY[category.id]
            const count = counts[category.id] ?? 0
            return (
              <RevealItem key={category.id}>
                <Link
                  href={`/services/${category.id}`}
                  className="group/sc relative isolate flex h-full min-h-[300px] flex-col overflow-hidden rounded-[28px] border border-ink/10 bg-white px-7 pb-[22px] pt-[26px] transition-[color,border-color,box-shadow] duration-[450ms] ease-out before:absolute before:inset-0 before:-z-[1] before:bg-ink before:transition-[clip-path] before:duration-700 before:ease-out before:[clip-path:circle(0%_at_50%_100%)] hover:border-ink hover:text-white hover:shadow-e2 hover:before:[clip-path:circle(150%_at_50%_100%)] sm:min-h-[360px]"
                >
                  <span className="font-mono text-[13px] text-fog">{String(i + 1).padStart(2, '0')}</span>
                  <span className="absolute right-7 top-[26px] font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted transition-colors duration-[450ms] group-hover/sc:text-white/60">
                    {copy?.tag}
                  </span>
                  <svg viewBox="0 0 48 48" aria-hidden="true" className="mb-auto mt-10 h-[52px] w-[52px] text-ink transition-colors duration-[450ms] group-hover/sc:text-volt">
                    {copy?.icon}
                  </svg>
                  <h3 className="pg-medium mb-2.5 mt-7 font-display text-[clamp(24px,2.2vw,30px)] font-normal leading-[1.05]">{category.label}</h3>
                  <p className="text-[15px] leading-[1.55] text-muted transition-colors duration-[450ms] group-hover/sc:text-white/70">
                    {copy?.body ?? category.description}
                  </p>
                  <footer className="mt-[22px] flex items-center justify-between border-t border-ink/10 pt-4 transition-colors duration-[450ms] group-hover/sc:border-white/[0.12]">
                    <span className="inline-flex items-center gap-2 font-mono text-[11.5px] font-semibold uppercase tracking-[0.16em]">
                      <i
                        className={cn(
                          'h-[7px] w-[7px] rounded-full',
                          count > 0 ? 'bg-[#35D07F] shadow-[0_0_0_4px_rgba(53,208,127,.18)]' : 'bg-fog',
                        )}
                      />
                      {count > 0 ? `${count} listed` : 'Coming soon'}
                    </span>
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 transition-[transform,color] duration-[450ms] ease-spring group-hover/sc:-rotate-45 group-hover/sc:translate-x-1 group-hover/sc:text-volt">
                      <path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </footer>
                </Link>
              </RevealItem>
            )
          })}
        </RevealGroup>
        <div className="mt-14 flex justify-center">
          <Link href="/services" className={btnClass('ink', 'lg')}>
            {total > 0 ? `Explore all ${total} services` : 'Explore EV services'}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ═══ 6. Community ══════════════════════════════════════════════════════ */

const CCARD =
  'h-full rounded-[32px] border border-ink/10 bg-white px-3.5 pb-[30px] pt-3.5 transition-[translate,box-shadow] duration-500 ease-out hover:-translate-y-1.5 hover:shadow-e2'
const CCARD_UI =
  "relative h-[290px] overflow-hidden rounded-[22px] bg-stone px-[22px] py-6 before:absolute before:inset-0 before:bg-[radial-gradient(rgba(11,12,14,.07)_1px,transparent_1.5px)] before:bg-[length:14px_14px] before:content-['']"

function CardIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="mx-4 mt-[26px] h-[26px] w-[26px] text-volt-ink">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?'
}

export function CommunityBand({
  posts,
  clubs,
  figures,
}: {
  posts: CommunityPost[]
  clubs: EVClub[]
  figures: CommunityFigures
}) {
  const rows = [
    { label: 'Discussions', value: figures.discussions, d: 'M4 5h16v11H9l-5 4z' },
    { label: 'Replies', value: figures.replies, d: 'M10 8 5 12.5 10 17M5 12.5h9a5 5 0 0 1 5 5V19' },
    { label: 'Clubs', value: figures.clubs, d: 'M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 19.5c.9-3 3.4-4.8 6.5-4.8s5.6 1.8 6.5 4.8' },
    { label: 'Cities with a club', value: figures.cities, d: 'M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z' },
  ]
  return (
    <section data-theme="light" className="bg-chalk py-[clamp(96px,12vw,160px)]">
      <div className={WRAP}>
        <SectionHead
          eyebrow="Drivers talking to drivers"
          title={
            <>
              {"Pakistan's"} <Hl>EV community.</Hl>
            </>
          }
          lead="Ask about charging, range and routes, share how a trip went, and read what other EV drivers in Pakistan have found — no account needed to read."
        />
        <RevealGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <RevealItem>
            <Link href="/community" className={cn(CCARD, 'block')}>
              <div className={CCARD_UI}>
                {posts.slice(0, 2).map((post, i) => {
                  const cat = POST_CATEGORY_META[post.category]
                  return (
                    <div key={post.id} className={cn('relative rounded-[18px] bg-white px-4 py-3.5 shadow-e1', i === 1 && 'mx-4 mt-3 opacity-70')}>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm',
                            i === 0 ? 'pg-bold bg-ink text-volt' : 'bg-[#6B7178] text-white',
                          )}
                        >
                          {initial(post.userName)}
                        </span>
                        <p className="min-w-0 flex-1 text-ink">
                          <b className="block truncate text-sm">{post.userName}</b>
                          {post.userVehicle ? <small className="block truncate text-xs text-muted">{post.userVehicle}</small> : null}
                        </p>
                        {cat ? (
                          <span className="max-w-24 truncate rounded-full border border-volt-edge bg-volt-tint px-2.5 py-1 text-[11.5px] font-medium text-volt-ink">
                            {cat.label}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 truncate text-[14.5px] font-semibold text-ink">{post.title}</p>
                      {i === 0 ? (
                        <p className="mt-2.5 flex gap-3.5 text-xs text-muted">
                          <span>♡ {post.likeCount}</span>
                          <span>
                            {post.commentCount} {post.commentCount === 1 ? 'reply' : 'replies'}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  )
                })}
                {posts.length === 0 ? (
                  <p className="relative mt-24 text-center text-sm text-muted">The first questions will show here.</p>
                ) : null}
              </div>
              <CardIcon d="M4 5h16v11H9l-5 4z" />
              <h3 className="pg-medium mx-4 mb-2.5 mt-3.5 font-display text-[clamp(26px,2.4vw,34px)] font-normal leading-[1.05] text-ink">
                Questions from drivers
              </h3>
              <p className="mx-4 text-[15px] text-muted">
                The newest posts on the board: charging, range and routes, asked and answered by people who drive one.
              </p>
            </Link>
          </RevealItem>

          <RevealItem>
            <Link href="/community/clubs" className={cn(CCARD, 'block')}>
              <div className={cn(CCARD_UI, 'grid content-start gap-2.5')}>
                {clubs.slice(0, 3).map((club) => (
                  <div key={club.id} className="relative flex items-center justify-between gap-2.5 rounded-2xl bg-white px-[18px] py-4 shadow-e1">
                    <b className="truncate text-sm text-ink">{club.name}</b>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] text-muted">
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 text-volt-ink">
                        <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" fill="none" stroke="currentColor" strokeWidth="1.7" />
                      </svg>
                      {club.city}
                    </span>
                  </div>
                ))}
                {clubs.length === 0 ? <p className="relative mt-24 text-center text-sm text-muted">Clubs will be listed here.</p> : null}
              </div>
              <CardIcon d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" />
              <h3 className="pg-medium mx-4 mb-2.5 mt-3.5 font-display text-[clamp(26px,2.4vw,34px)] font-normal leading-[1.05] text-ink">
                EV clubs by city
              </h3>
              <p className="mx-4 text-[15px] text-muted">
                Owner groups listed by city, for meetups, drives and swapping notes on the cars you drive.
              </p>
            </Link>
          </RevealItem>

          <RevealItem>
            <div className={CCARD}>
              <div className={cn(CCARD_UI, 'grid content-start')}>
                <p className="relative mb-1.5 text-[15px] font-bold text-ink">On plugpk so far</p>
                {rows.map((row, i) => (
                  <div
                    key={row.label}
                    className={cn(
                      'relative grid grid-cols-[20px_1fr_auto] items-center gap-2.5 px-1 py-[13px] text-[14.5px] text-ink',
                      i < rows.length - 1 ? 'border-b border-ink/10' : 'opacity-55',
                    )}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[17px] w-[17px] text-volt-ink">
                      <path d={row.d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{row.label}</span>
                    <b className="font-mono text-lg font-semibold">{row.value.toLocaleString('en-PK')}</b>
                  </div>
                ))}
              </div>
              <CardIcon d="m3 17 6-6 4 4 8-8m-6 0h6v6" />
              <h3 className="pg-medium mx-4 mb-2.5 mt-3.5 font-display text-[clamp(26px,2.4vw,34px)] font-normal leading-[1.05] text-ink">
                Open to read
              </h3>
              <p className="mx-4 text-[15px] text-muted">Every discussion is public. Read what drivers have found before you decide to join.</p>
            </div>
          </RevealItem>
        </RevealGroup>
        <div className="mt-14 flex justify-center">
          <Link href="/community" className={btnClass('ink', 'lg')}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <circle cx="9" cy="8.5" r="3.5" />
                <path d="M2.5 19.5c.9-3 3.4-4.8 6.5-4.8s5.6 1.8 6.5 4.8M15.5 5.3a3.5 3.5 0 0 1 0 6.4M18 14.9c1.7.7 2.9 2.3 3.5 4.6" />
              </g>
            </svg>
            Visit the community
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ═══ 7. Partner up ═════════════════════════════════════════════════════ */

export function PartnerBand() {
  return (
    <section data-theme="light" className="bg-chalk px-[clamp(16px,4vw,64px)] pb-[clamp(96px,10vw,140px)]">
      <div
        data-theme="dark"
        className="relative isolate mx-auto grid min-h-[560px] w-full max-w-wrap place-items-center overflow-hidden rounded-[28px_96px_28px_28px] bg-ink px-5 py-[72px] text-center text-white sm:min-h-[640px] sm:rounded-[40px_220px_40px_40px] sm:px-6 sm:py-24"
      >
        <Image
          src="/images/home/v2/plug-in-car.jpg"
          alt=""
          fill
          sizes="(min-width: 1320px) 1320px, 100vw"
          className="-z-[2] object-cover brightness-[.55] contrast-[1.1] grayscale"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-[1] bg-[radial-gradient(70%_70%_at_50%_45%,rgba(11,12,14,.55),rgba(11,12,14,.94))]" />
        <svg viewBox="0 0 800 800" aria-hidden="true" className="absolute left-1/2 top-1/2 -z-[1] h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2">
          <g fill="none" stroke="rgba(212,255,58,.14)">
            <circle cx="400" cy="400" r="160" />
            <circle cx="400" cy="400" r="250" />
            <circle cx="400" cy="400" r="340" />
          </g>
          <g fill="#D4FF3A" className="origin-center animate-[spin_40s_linear_infinite] motion-reduce:animate-none">
            <circle cx="400" cy="150" r="5" />
            <circle cx="650" cy="400" r="4" />
            <circle cx="400" cy="740" r="5" />
            <circle cx="60" cy="400" r="4" />
          </g>
        </svg>
        <div className="grid max-w-[980px] justify-items-center">
          <Eyebrow tone="volt">Partner up</Eyebrow>
          <h2 className="m-0 text-balance font-display text-[clamp(36px,5vw,80px)] leading-[1.02]">
            Own a{' '}
            {['hotel,', 'restaurant'].map((w, i) => (
              <span key={w}>
                {i > 0 ? ' ' : null}
                <span className="pg-bold relative inline-block after:absolute after:bottom-[.06em] after:left-0 after:right-[.1em] after:h-[.09em] after:rounded-full after:bg-volt">
                  {w}
                </span>
              </span>
            ))}{' '}
            <br />
            or{' '}
            <span className="pg-bold relative inline-block after:absolute after:bottom-[.06em] after:left-0 after:right-[.1em] after:h-[.09em] after:rounded-full after:bg-volt">
              shopping mall?
            </span>
          </h2>
          <p className={cn(LEAD_CLASS, 'mx-auto text-center text-white/70')}>
            Host a charger and give EV drivers a reason to stop at yours. Listing on plugpk is PKR 4,999 a month, and every
            listing is checked before it goes live.
          </p>
          <Link href="/partners" className={btnClass('volt', 'xl', 'mt-10')}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5" />
              </g>
            </svg>
            Partner up
            <BtnEnd />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ═══ 8. The app ════════════════════════════════════════════════════════ */

function Feat({ children, art }: { children: React.ReactNode; art: React.ReactNode }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-end gap-3 rounded-3xl bg-chalk px-3.5 pb-[22px] pt-[18px] text-center transition-[background-color,translate] duration-500 ease-out hover:-translate-y-1.5 hover:bg-volt-tint sm:min-h-[260px]">
      <svg viewBox="0 0 120 100" aria-hidden="true" className="h-auto w-full max-w-[130px] overflow-visible">
        {art}
      </svg>
      <p className="text-balance text-[15px] font-semibold leading-[1.35]">{children}</p>
    </div>
  )
}

const STROKE = { fill: 'none', stroke: '#0B0C0E', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export function AppBand() {
  return (
    <section data-theme="light" className="relative z-[2] rounded-b-[32px] bg-paper pb-[clamp(110px,12vw,170px)] pt-[clamp(96px,10vw,140px)] sm:rounded-b-[48px]">
      <div className={cn(WRAP, 'grid items-center gap-[clamp(40px,6vw,96px)] lg:grid-cols-[.9fr_1.1fr]')}>
        <div aria-hidden="true" className="relative h-[600px] lg:h-[680px]">
          <div className="absolute inset-[60px_0_0_0] overflow-hidden rounded-[40px] bg-ink before:absolute before:-bottom-[200px] before:-left-[100px] before:h-[500px] before:w-[500px] before:rounded-full before:bg-[radial-gradient(closest-side,rgba(212,255,58,.4),transparent)] after:absolute after:inset-0 after:bg-[repeating-linear-gradient(-45deg,transparent_0_22px,rgba(255,255,255,.035)_22px_23px)] lg:right-[10%]" />
          <Phone light className="left-1/2 top-0 origin-top -translate-x-1/2 rotate-6 scale-[0.8] sm:-translate-x-[45%] sm:rotate-12 sm:scale-100">
            <StatusBar ink />
            <div className="relative px-1.5 pb-3 pt-1">
              <small className="block text-[11px] text-muted">Assalam-o-Alaikum</small>
              <b className="pg-bold block font-display text-[22px] font-normal leading-[1.1]">Where to today?</b>
              <span className="absolute right-1.5 top-2 grid h-[34px] w-[34px] place-items-center rounded-full bg-volt">
                <BoltFill className="h-[15px] w-[15px]" />
              </span>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl bg-white p-3 shadow-e1">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-ink text-volt">
                <LogoMark className="h-5 w-5" />
              </span>
              <div>
                <b className="block text-[12.5px]">My EV</b>
                <small className="text-[10px] text-muted">72% · 263 km range</small>
              </div>
              <i className="ml-auto h-1.5 w-[54px] overflow-hidden rounded-md bg-stone">
                <i className="block h-full w-[72%] rounded-md bg-ink" />
              </i>
            </div>
            <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-[11px] text-[11px] text-muted">
              <SearchGlyph className="h-3.5 w-3.5" />
              Search chargers or cities
            </div>
            <div className="relative -mx-3 mt-2.5 h-[230px] overflow-hidden">
              <svg viewBox="0 0 280 230" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
                <rect width="280" height="230" fill="#EEF0E8" />
                <path d="M-10 160 C 60 150, 120 200, 300 150" stroke="#BFE3F2" strokeWidth="16" fill="none" />
                <g stroke="#fff" strokeWidth="9" fill="none">
                  <path d="M-10 60 300 40M-10 120 300 100M70 -10 90 240M180 -10 160 240" />
                </g>
                <rect x="20" y="70" width="40" height="40" rx="4" fill="#DDEBD0" />
                <rect x="200" y="160" width="60" height="40" rx="4" fill="#DDEBD0" />
                <path d="M120 220 C 150 170, 160 140, 210 70" stroke="#0B0C0E" strokeWidth="4" strokeDasharray="2 8" strokeLinecap="round" fill="none" />
              </svg>
              {[
                ['22%', '30%', false],
                ['68%', '22%', true],
                ['36%', '70%', false],
              ].map(([left, top, hot]) => (
                <span
                  key={left as string}
                  style={{ left: left as string, top: top as string }}
                  className={cn(
                    'absolute grid -rotate-45 place-items-center rounded-[50%_50%_50%_4px]',
                    hot ? 'h-[34px] w-[34px] bg-volt text-ink shadow-[0_0_0_6px_rgba(212,255,58,.35)]' : 'h-[26px] w-[26px] bg-ink text-white',
                  )}
                >
                  <BoltFill className="h-3 w-3 rotate-45" />
                </span>
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-0 grid grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-t-3xl bg-white px-4 pb-[22px] pt-[18px] shadow-[0_-16px_30px_rgba(11,12,14,.12)]">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-volt-tint text-volt-ink">
                <BoltFill className="h-[18px] w-[18px]" />
              </span>
              <div>
                <b className="block text-[13px]">Nearest fast charger</b>
                <small className="text-[10px] text-muted">DC · fast charging near you</small>
              </div>
              <span className="rounded-full border border-volt-edge bg-volt-tint px-2 py-1 text-[9.5px] font-bold text-volt-ink">CCS2</span>
              <div className="col-span-3 flex h-[42px] items-center justify-center gap-1.5 rounded-[14px] bg-ink text-xs font-bold text-white">
                <BoltFill className="h-[13px] w-[13px] text-volt" />
                Navigate there
              </div>
            </div>
          </Phone>
        </div>

        <div>
          <span className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-volt-edge bg-volt-tint px-4 py-2 text-sm font-medium text-volt-ink">
            <i className="h-2 w-2 animate-pulse rounded-full bg-volt-ink" />
            Coming soon to iOS &amp; Android
          </span>
          <h2 className={cn(H2_CLASS, 'text-ink')}>
            Get the <Hl>plugpk</Hl> app
          </h2>
          <p className={cn(LEAD_CLASS, 'text-muted')}>
            plugpk is building apps for iOS and Android.
            <br />
            The map, the route planner and the connectors, in your pocket.
          </p>
          <div className="mt-11 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Feat
              art={
                <>
                  <rect x="30" y="14" width="40" height="66" rx="8" {...STROKE} />
                  <rect x="38" y="24" width="24" height="22" rx="4" fill="#D4FF3A" />
                  <path d="m52 27-6 9h5l-2 7 7-10h-5z" fill="#0B0C0E" />
                  <path d="M38 54h24M38 61h16" {...STROKE} />
                  <path d="M70 40c14 0 16 10 16 18s4 12 10 12" {...STROKE} />
                  <rect x="90" y="62" width="14" height="16" rx="3" fill="#FF5A1F" />
                  <path d="M24 86h52" {...STROKE} />
                </>
              }
            >
              Find a charger near you
            </Feat>
            <Feat
              art={
                <>
                  <path d={PK_PATH} transform="translate(14 6) scale(.11)" fill="#D4FF3A" stroke="#0B0C0E" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  <path d="M44 78 C 50 60, 70 56, 80 30" fill="none" stroke="#0B0C0E" strokeWidth="2.5" strokeDasharray="3 5" strokeLinecap="round" />
                  <circle cx="80" cy="30" r="5" fill="#FF5A1F" />
                  <circle cx="44" cy="78" r="4" fill="#0B0C0E" />
                </>
              }
            >
              Plan trips around your range
            </Feat>
            <Feat
              art={
                <>
                  <rect x="22" y="14" width="40" height="72" rx="8" transform="rotate(-8 42 50)" {...STROKE} />
                  <path d="m44 30-8 12h6l-2 9 9-13h-6z" fill="#D4FF3A" stroke="#0B0C0E" strokeWidth="2.5" strokeLinejoin="round" />
                  <rect x="58" y="34" width="46" height="20" rx="10" fill="#fff" stroke="#0B0C0E" strokeWidth="2.5" />
                  <circle cx="68" cy="44" r="4" fill="#D4FF3A" />
                  <path d="M76 41h20M76 47h14" {...STROKE} />
                  <path d="M30 64h22v8H30z" {...STROKE} />
                </>
              }
            >
              Check the connectors before you go
            </Feat>
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-3xl border border-ink/10 bg-white px-3.5 pb-[22px] pt-[18px] text-center sm:min-h-[260px]">
              <span className="grid h-[84px] w-[84px] content-center justify-items-center gap-1.5 rounded-3xl bg-ink shadow-[0_20px_40px_-16px_rgba(11,12,14,.6)]">
                <LogoMark className="h-[30px] w-[30px]" />
                <b className="pg-bold font-display text-[13px] font-normal text-white">plugpk</b>
              </span>
              <p className="text-[15px] font-semibold leading-[1.35]">
                Launching soon
                <small className="mt-1 block text-[13px] font-normal text-muted">Planned for iOS and Android.</small>
              </p>
              <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-chalk px-3 py-[7px] text-[12.5px] text-muted">
                <i className="h-2 w-2 rounded-full bg-[#FFB020]" />
                Apps coming soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

