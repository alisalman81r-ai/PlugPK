// src/components/v2/ui.tsx
//
// The landing-v2 building blocks (css/style.css and css/pages.css of the
// design), as Tailwind components. Server-safe: nothing here holds state.
//
//   Btn / btnClass   .btn  --volt | --ink | --light | --ghost-d | --ghost, sm | md | lg | xl
//   Eyebrow          .eyebrow           mono kicker over a heading
//   Hl               .hl                the highlighted phrase (marker on light, volt on dark)
//   SectionHead      .shead             eyebrow + h2 + lead, centred or left
//   Section, Wrap    .sec, .wrap        section grounds and the 1320px measure
//   PageHero         .phero             the ink hero every inner page opens with
//   Lift             .lift              the paper sheet lifted into the hero
//   Card, Chip, Tag, ExampleBadge, StatTile, Steps, CtaBand, Faq

import Link from 'next/link'
import * as React from 'react'

import { cn } from '@/lib/utils'

/* ── Buttons ───────────────────────────────────────────────────────── */

export type BtnVariant = 'volt' | 'ink' | 'light' | 'ghostDark' | 'ghost'
export type BtnSize = 'sm' | 'md' | 'lg' | 'xl'

const BTN_BASE =
  'group/btn relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full font-semibold tracking-[-0.005em] transition-[background-color,color,box-shadow,border-color] duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:h-[18px] [&_svg]:w-[18px]'

const BTN_VARIANT: Record<BtnVariant, string> = {
  volt: 'bg-volt text-ink shadow-volt hover:bg-white',
  ink: 'bg-ink text-white hover:bg-volt hover:text-ink',
  light: 'bg-white text-ink hover:bg-volt',
  ghostDark: 'border border-white/20 text-white hover:border-volt hover:text-volt',
  ghost: 'border-[1.5px] border-ink/10 bg-white text-ink hover:border-ink/30',
}

const BTN_SIZE: Record<BtnSize, string> = {
  sm: 'h-[42px] px-[18px] text-sm',
  md: 'h-12 px-[22px] text-[15px]',
  lg: 'h-[58px] px-[30px] text-base',
  xl: 'h-[60px] gap-3 pl-7 pr-2.5 text-base sm:h-[66px] sm:text-lg',
}

export function btnClass(variant: BtnVariant = 'ink', size: BtnSize = 'md', className?: string) {
  return cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)
}

type BtnProps = {
  variant?: BtnVariant
  size?: BtnSize
  className?: string
  children: React.ReactNode
} & (
  | ({ href: string } & Omit<React.ComponentProps<typeof Link>, 'href' | 'className' | 'children'>)
  | ({ href?: undefined } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>)
)

/** A pill button, or a link styled as one when given an href. */
export function Btn({ variant = 'ink', size = 'md', className, children, ...rest }: BtnProps) {
  const cls = btnClass(variant, size, className)
  if ('href' in rest && rest.href !== undefined) {
    const { href, ...link } = rest
    return (
      <Link href={href} className={cls} {...link}>
        {children}
      </Link>
    )
  }
  const { type = 'button', ...button } = rest as React.ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type={type} className={cls} {...button}>
      {children}
    </button>
  )
}

/** The arrow that nudges right on hover, for use inside a Btn. */
export function BtnArrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="transition-transform duration-300 ease-spring group-hover/btn:translate-x-1">
      <path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** The ink disc at the end of an xl volt button, which turns on hover. */
export function BtnEnd() {
  return (
    <span className="ml-1 grid h-[46px] w-[46px] place-items-center rounded-full bg-ink text-volt transition-transform duration-[400ms] ease-spring group-hover/btn:-rotate-45">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

/* ── Type ──────────────────────────────────────────────────────────── */

export function Eyebrow({
  children,
  tone = 'light',
  className,
}: {
  children: React.ReactNode
  /** light: volt ink on paper; dark: white on ink; volt: volt on ink. */
  tone?: 'light' | 'dark' | 'volt'
  className?: string
}) {
  return (
    <p
      className={cn(
        'mb-[18px] inline-flex items-center gap-2.5 font-mono text-xs font-semibold uppercase leading-none tracking-[0.16em]',
        tone === 'light' && 'text-volt-ink',
        tone === 'dark' && 'text-white/60',
        tone === 'volt' && 'text-volt',
        className,
      )}
    >
      {children}
    </p>
  )
}

/**
 * The highlighted phrase in a headline: a volt marker stroke on light grounds,
 * the phrase itself in volt (bold stroke) on dark ones.
 */
export function Hl({ children, dark = false, className }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return <em className={cn('not-italic', dark ? 'pg-bold text-volt' : 'hl pg-bold', className)}>{children}</em>
}

/** The section headline size (.h2). */
export const H2_CLASS = 'm-0 font-display text-[clamp(34px,4.8vw,72px)] leading-[1.02] text-balance'

/** The lead paragraph under a section headline (.lead). */
export const LEAD_CLASS = 'mt-[22px] max-w-[40rem] text-pretty text-[clamp(16px,1.3vw,19px)] leading-[1.6]'

export function SectionHead({
  eyebrow,
  title,
  lead,
  align = 'center',
  dark = false,
  className,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  lead?: React.ReactNode
  align?: 'center' | 'left'
  dark?: boolean
  className?: string
}) {
  return (
    <header
      className={cn(
        'mb-[clamp(48px,7vw,88px)] grid',
        align === 'center' ? 'justify-items-center text-center' : 'justify-items-start text-left',
        className,
      )}
    >
      {eyebrow ? <Eyebrow tone={dark ? 'dark' : 'light'}>{eyebrow}</Eyebrow> : null}
      <h2 className={cn(H2_CLASS, dark ? 'text-white' : 'text-ink')}>{title}</h2>
      {lead ? <p className={cn(LEAD_CLASS, dark ? 'text-white/70' : 'text-muted')}>{lead}</p> : null}
    </header>
  )
}

/* ── Layout ────────────────────────────────────────────────────────── */

/** The 1320px measure with the fluid gutter (.wrap). */
export const WRAP = 'mx-auto w-[min(1320px,calc(100%-2*clamp(16px,4vw,64px)))]'
export const WRAP_NARROW = 'mx-auto w-[min(820px,calc(100%-2*clamp(16px,4vw,64px)))]'

export function Wrap({ children, narrow = false, className }: { children: React.ReactNode; narrow?: boolean; className?: string }) {
  return <div className={cn(narrow ? WRAP_NARROW : WRAP, className)}>{children}</div>
}

/**
 * A page section (.sec). `tone` sets the ground and the navbar's theme:
 * chalk and paper are light, ink is dark.
 */
export function Section({
  children,
  tone = 'chalk',
  tight = false,
  className,
  id,
}: {
  children: React.ReactNode
  tone?: 'chalk' | 'paper' | 'ink'
  tight?: boolean
  className?: string
  id?: string
}) {
  return (
    <section
      id={id}
      data-theme={tone === 'ink' ? 'dark' : 'light'}
      className={cn(
        tight ? 'py-[clamp(56px,6vw,88px)]' : 'py-[clamp(80px,9vw,128px)]',
        tone === 'chalk' && 'bg-chalk',
        tone === 'paper' && 'bg-paper',
        tone === 'ink' && 'bg-ink text-white',
        className,
      )}
    >
      {children}
    </section>
  )
}

/**
 * The ink hero every inner page opens with (.phero): a faint grid, a volt glow
 * from above, a centred Power Grotesk title whose last phrase is volt, a sub,
 * and room underneath for a search pill, stats or a lifted sheet.
 *
 * `lift` leaves the extra bottom padding a <Lift> needs to overlap the hero.
 */
export function PageHero({
  title,
  sub,
  eyebrow,
  actions,
  note,
  children,
  lift = true,
  className,
}: {
  title: React.ReactNode
  sub?: React.ReactNode
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
  note?: React.ReactNode
  children?: React.ReactNode
  lift?: boolean
  className?: string
}) {
  return (
    <section
      data-theme="dark"
      className={cn(
        'relative isolate overflow-hidden rounded-b-[32px] bg-ink pt-[clamp(44px,7vw,80px)] text-center text-white sm:rounded-b-[48px]',
        lift ? 'pb-[clamp(132px,13vw,176px)]' : 'pb-[clamp(72px,9vw,120px)]',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-[2] bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[length:56px_56px] bg-top [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_30%,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[260px] left-1/2 -z-[1] h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.14),transparent_70%)] blur-[10px]"
      />
      <div className="mx-auto grid w-[min(980px,calc(100%-2*clamp(16px,4vw,64px)))] justify-items-center">
        {eyebrow ? <Eyebrow tone="volt">{eyebrow}</Eyebrow> : null}
        <h1 className="m-0 text-balance font-display text-[clamp(42px,5.6vw,88px)] leading-none">{title}</h1>
        {sub ? (
          <p className="mt-6 max-w-[44rem] text-pretty text-[clamp(16px,1.25vw,18px)] leading-[1.65] text-white/70">{sub}</p>
        ) : null}
        {actions ? <div className="mt-[34px] flex flex-wrap justify-center gap-3">{actions}</div> : null}
        {note ? <p className="mt-3 text-[13px] text-white/45">{note}</p> : null}
        {children}
      </div>
    </section>
  )
}

/** The paper sheet lifted into the hero (.lift). */
export function Lift({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div
      id={id}
      data-theme="light"
      className={cn(
        'relative z-[3] mx-auto -mt-[84px] w-[min(1320px,calc(100%-2*clamp(16px,4vw,64px)))] overflow-hidden rounded-3xl border border-white/60 bg-paper shadow-e4 sm:-mt-28 sm:rounded-[32px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function LiftHead({
  eyebrow,
  title,
  meta,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  meta?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-5 border-b border-ink/10 bg-[linear-gradient(90deg,#F4F3EE,#fff)] px-[18px] py-[22px] sm:px-7',
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-volt-ink">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1.5 font-display text-[26px] leading-[1.1] text-ink">{title}</h2>
        {meta ? <p className="mt-1 text-sm text-muted [&_b]:text-ink">{meta}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function LiftBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-[18px] pb-7 pt-6 sm:px-7', className)}>{children}</div>
}

/** The stats strip under a hero (.pstats). */
export function HeroStats({ items }: { items: { value: React.ReactNode; label: string }[] }) {
  return (
    <div className="mt-11 flex flex-wrap justify-center rounded-[22px] border border-white/[0.09] bg-white/[0.03]">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn('grid justify-items-center gap-1 px-4 py-3 sm:px-[34px] sm:py-4', i > 0 && 'border-l border-white/[0.09]')}
        >
          <b className="font-mono text-[22px] font-semibold leading-none tabular-nums text-white sm:text-[30px]">{item.value}</b>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Surfaces and labels ───────────────────────────────────────────── */

/** .card: white, hairline, soft shadow, lifts on hover when interactive. */
export const CARD = 'relative rounded-[28px] border border-ink/10 bg-white shadow-e1'
export const CARD_HOVER =
  'transition-[translate,box-shadow,border-color] duration-[450ms] ease-out hover:-translate-y-1 hover:border-ink/20 hover:shadow-e2'
export const CARD_INK = 'relative rounded-[28px] border border-white/[0.09] bg-[#14161A] text-white'

/** .chip — a filter pill; pressed chips go ink with a volt count. */
export function chipClass(on: boolean, className?: string) {
  return cn(
    'inline-flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] px-4 text-sm font-medium transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.96] [&_svg]:h-[15px] [&_svg]:w-[15px]',
    on ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white text-ink hover:border-ink/30',
    className,
  )
}

export function ChipCount({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span className={cn('rounded-full px-[7px] py-0.5 font-mono text-[11px] font-semibold', on ? 'bg-volt text-ink' : 'bg-chalk text-muted')}>
      {children}
    </span>
  )
}

export type TagTone = 'plain' | 'volt' | 'amber' | 'green' | 'red' | 'purple' | 'ink' | 'dark'

const TAG_TONE: Record<TagTone, string> = {
  plain: 'border-ink/10 text-ink',
  volt: 'border-volt-edge bg-volt-tint text-volt-ink',
  amber: 'border-[#FFE0A3] bg-[#FFF6E3] text-[#8A5300]',
  green: 'border-[#BFEBD1] bg-[#E9F8EF] text-[#157A45]',
  red: 'border-[#FFCDBC] bg-[#FFECE6] text-[#B42E05]',
  purple: 'border-[#DCD3FF] bg-[#F2EEFF] text-[#5B3FC4]',
  ink: 'border-ink bg-ink text-white',
  dark: 'border-white/20 text-white',
}

/** .tag — a small status or category label. `mono` sets it uppercase in JetBrains Mono. */
export function Tag({
  tone = 'plain',
  mono = false,
  children,
  className,
}: {
  tone?: TagTone
  mono?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-[26px] items-center gap-[5px] whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold [&_svg]:h-3 [&_svg]:w-3',
        mono && 'font-mono text-[11px] uppercase tracking-[0.08em]',
        TAG_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** The honest-data badge: "Example listing", "Indicative", and so on. */
export function ExampleBadge({ children = 'Example listing', className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-[5px] rounded-full border border-[#FFE0A3] bg-[#FFF6E3] px-[9px] text-[11.5px] font-semibold text-[#8A5300]',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** .stile — a figure in JetBrains Mono over a label. */
export function StatTile({ value, label, className }: { value: React.ReactNode; label: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[22px] border border-ink/10 bg-white p-[22px]', className)}>
      <b className="block font-mono text-[34px] font-semibold leading-none tabular-nums text-ink">{value}</b>
      <span className="mt-2 block text-sm text-muted">{label}</span>
    </div>
  )
}

/** .steps — numbered cards with outline numerals that fill volt on hover. */
export function Steps({
  steps,
  className,
}: {
  steps: { title: React.ReactNode; body: React.ReactNode; icon?: React.ReactNode }[]
  className?: string
}) {
  return (
    <ol className={cn('grid gap-4 lg:grid-cols-3', className)}>
      {steps.map((step, i) => (
        <li
          key={i}
          className="group/step relative overflow-hidden rounded-[28px] border border-ink/10 bg-white px-[30px] pb-8 pt-[30px] transition-[translate,box-shadow] duration-[450ms] ease-out hover:-translate-y-1 hover:shadow-e2"
        >
          <span
            aria-hidden="true"
            className="absolute right-[26px] top-[18px] font-display text-[88px] leading-none text-transparent transition-colors duration-[400ms] [-webkit-text-stroke:1.5px_rgba(11,12,14,.22)] group-hover/step:text-volt group-hover/step:[-webkit-text-stroke-color:#0B0C0E]"
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          {step.icon ? <span className="block h-[30px] w-[30px] text-ink [&_svg]:h-full [&_svg]:w-full">{step.icon}</span> : null}
          <h3 className={cn('font-display text-[26px] leading-[1.1] text-ink', step.icon ? 'mt-[70px]' : 'mt-[100px]')}>{step.title}</h3>
          <p className="mt-2.5 text-[15px] leading-[1.6] text-muted">{step.body}</p>
        </li>
      ))}
    </ol>
  )
}

/** The dark call-to-action band (.ctaband), with the brand's one big rounded corner. */
export function CtaBand({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      data-theme="dark"
      className={cn(
        'relative isolate overflow-hidden rounded-[28px_80px_28px_28px] bg-ink p-[clamp(28px,5vw,64px)] text-white sm:rounded-[40px_160px_40px_40px]',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute -right-[200px] -top-[300px] -z-[1] h-[700px] w-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.16),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-[1] bg-[repeating-linear-gradient(-45deg,transparent_0_22px,rgba(255,255,255,.03)_22px_23px)]"
      />
      {children}
    </div>
  )
}

/**
 * The FAQ accordion: native <details>, so it works with no script and the
 * browser's find-in-page opens the right answer.
 */
export function Faq({ items, className }: { items: { q: React.ReactNode; a: React.ReactNode }[]; className?: string }) {
  return (
    <div className={cn('mx-auto grid w-full max-w-[820px] gap-3', className)}>
      {items.map((item, i) => (
        <details
          key={i}
          className="group/faq rounded-[22px] border border-ink/10 bg-white transition-[box-shadow,border-color] duration-300 open:border-ink/20 open:shadow-e1"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 text-[17px] font-semibold leading-[1.4] text-ink sm:px-[26px] sm:py-[22px] [&::-webkit-details-marker]:hidden">
            {item.q}
            <i
              aria-hidden="true"
              className="relative h-[34px] w-[34px] flex-none rounded-full bg-chalk transition-[background-color,rotate] duration-[400ms] ease-out before:absolute before:left-1/2 before:top-1/2 before:-ml-1.5 before:-mt-px before:h-0.5 before:w-3 before:rounded-sm before:bg-ink after:absolute after:left-1/2 after:top-1/2 after:-ml-1.5 after:-mt-px after:h-0.5 after:w-3 after:rotate-90 after:rounded-sm after:bg-ink after:transition-[rotate] after:duration-[400ms] group-open/faq:rotate-180 group-open/faq:bg-volt group-open/faq:after:rotate-0"
            />
          </summary>
          <div className="max-w-[46rem] px-5 pb-6 text-base leading-[1.7] text-muted sm:px-[26px]">{item.a}</div>
        </details>
      ))}
    </div>
  )
}

/* ── Form fields (.field, .input, .range) ──────────────────────────── */

export const FLABEL = 'font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted'
export const INPUT =
  'h-[54px] w-full appearance-none rounded-[14px] border-[1.5px] border-ink/10 bg-white px-4 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fog focus:border-ink focus:shadow-focus'

/** .seg — a segmented control's track and its buttons. */
export const SEG = 'inline-flex gap-0.5 rounded-2xl bg-stone p-1'
export function segButtonClass(on: boolean, className?: string) {
  return cn(
    'grid justify-items-center gap-0.5 rounded-xl px-4 py-[9px] text-sm font-semibold transition-[background-color,color,box-shadow] duration-200',
    on ? 'bg-white text-ink shadow-e1' : 'text-muted hover:text-ink',
    className,
  )
}
