// src/components/business/host/biz-kit.tsx
'use client'

/**
 * The business portal's share of the redesign: the admin design's building
 * blocks (network-kit, read-only) plus the motion this portal adds on top —
 * GSAP via @/lib/gsap, every piece a no-op under prefers-reduced-motion.
 *
 *   BizMotion   staggers [data-biz-in] children in, fills [data-biz-bar] bars
 *               and counts [data-biz-count] figures, once, on mount
 *   Num         a figure that counts to its value, and re-counts when it changes
 *   Reveal      eases its content open when it mounts (notices, confirm boxes)
 *   Collapse    keeps its content mounted and eases it open and shut
 *   Stepper     .step — minus, figure, plus; the figure flashes volt on change
 *   Toggle      a switch over a real checkbox
 *   BizStrip / BizStat   the KPI strip, at any number of cells
 *   SaveBar     the sticky glass bar a form's Save sits in
 *   LIFT        the hover lift, on the CSS translate property
 */

import * as React from 'react'

import { CARD, Ico } from '@/components/admin/network-kit'
import { gsap, prefersReduced } from '@/lib/gsap'
import { cn } from '@/lib/utils'

export const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/** Hover lift: translate (not transform) so it never fights a GSAP entrance. */
export const LIFT =
  'transition-[translate,box-shadow,border-color] duration-500 ease-out hover:[translate:0_-3px] hover:shadow-[0_30px_50px_-30px_rgba(11,12,14,.35)]'

/** A plain .card with no CSS entrance, for things GSAP brings in. */
export const BIZ_CARD = CARD

function formatFigure(n: number, decimals: number) {
  return decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString('en-PK')
}

/** Writes into the text node React owns, so React's own updates still land. */
function writeText(el: HTMLElement, text: string) {
  const node = el.firstChild
  if (node && node.nodeType === Node.TEXT_NODE) node.nodeValue = text
}

/* ── Entrance ────────────────────────────────────────────────────────── */

/** Elements an inner entrance already animates, so an outer one leaves them be. */
const claimed = new WeakSet<Element>()
function claim<T extends Element>(els: Iterable<T>, mine: T[]): T[] {
  const out: T[] = []
  for (const el of els) {
    if (claimed.has(el)) continue
    claimed.add(el)
    mine.push(el)
    out.push(el)
  }
  return out
}

export function useBizEntrance(ref: React.RefObject<HTMLElement>, deps: React.DependencyList = []) {
  useIsoLayoutEffect(() => {
    const root = ref.current
    if (!root || prefersReduced()) return
    const counters: { el: HTMLElement; final: string }[] = []
    const mine: HTMLElement[] = []
    const ctx = gsap.context(() => {
      const items = claim(root.querySelectorAll<HTMLElement>('[data-biz-in]'), mine)
      if (items.length) {
        gsap.from(items, {
          autoAlpha: 0,
          y: 18,
          duration: 0.8,
          ease: 'expo.out',
          stagger: 0.06,
          clearProps: 'opacity,visibility,transform',
        })
      }
      claim(root.querySelectorAll<HTMLElement>('[data-biz-bar]'), mine).forEach((bar, i) => {
        gsap.from(bar, { scaleX: 0, transformOrigin: '0% 50%', duration: 1.2, ease: 'expo.out', delay: 0.2 + i * 0.07, clearProps: 'transform' })
      })
      claim(root.querySelectorAll<HTMLElement>('[data-biz-count]'), mine).forEach((el) => {
        const target = Number(el.dataset.bizCount)
        const decimals = Number(el.dataset.decimals ?? 0)
        if (!Number.isFinite(target) || target === 0) return
        const final = el.textContent ?? ''
        counters.push({ el, final })
        const o = { v: 0 }
        let last = ''
        writeText(el, formatFigure(0, decimals))
        gsap.to(o, {
          v: target,
          duration: 1.1,
          delay: 0.15,
          ease: 'power3.out',
          onUpdate: () => {
            const next = formatFigure(o.v, decimals)
            if (next !== last) {
              writeText(el, next)
              last = next
            }
          },
          onComplete: () => writeText(el, final),
        })
      })
    }, root)
    return () => {
      ctx.revert()
      mine.forEach((el) => claimed.delete(el))
      counters.forEach(({ el, final }) => writeText(el, final))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** A wrapper whose [data-biz-in] descendants stagger in on mount. */
export function BizMotion({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  useBizEntrance(ref)
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/* ── Figures ─────────────────────────────────────────────────────────── */

/** A number that counts up on mount and tweens to each new value after. */
export function Num({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const prev = React.useRef(0)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const from = prev.current
    if (prefersReduced() || from === value || !Number.isFinite(value)) {
      prev.current = value
      return
    }
    const o = { v: from }
    let last = ''
    writeText(el, formatFigure(from, decimals))
    const tween = gsap.to(o, {
      v: value,
      duration: from === 0 ? 1.1 : 0.6,
      delay: from === 0 ? 0.15 : 0,
      ease: 'power3.out',
      onUpdate: () => {
        const next = formatFigure(o.v, decimals)
        if (next !== last) {
          writeText(el, next)
          last = next
        }
      },
      onComplete: () => {
        prev.current = value
      },
    })
    return () => {
      tween.kill()
      writeText(el, formatFigure(value, decimals))
    }
  }, [value, decimals])

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {formatFigure(value, decimals)}
    </span>
  )
}

/* ── Reveals ─────────────────────────────────────────────────────────── */

/** Eases open when it mounts. For blocks that appear in answer to something. */
export function Reveal({
  className,
  children,
  ...rest
}: { className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const ref = React.useRef<HTMLDivElement>(null)
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReduced()) return
    const tween = gsap.from(el, {
      height: 0,
      autoAlpha: 0,
      y: -6,
      overflow: 'hidden',
      duration: 0.6,
      ease: 'expo.out',
      clearProps: 'height,opacity,visibility,transform,overflow',
    })
    return () => {
      tween.revert()
    }
  }, [])
  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  )
}

/** Mounted throughout; eased open and shut, and hidden (so not tabbable) when shut. */
export function Collapse({ open, className, children }: { open: boolean; className?: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const mounted = React.useRef(false)
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (!mounted.current) {
      mounted.current = true
      return
    }
    if (prefersReduced()) return
    const tween = open
      ? gsap.fromTo(
          el,
          { height: 0, autoAlpha: 0, overflow: 'hidden' },
          { height: 'auto', autoAlpha: 1, duration: 0.6, ease: 'expo.out', clearProps: 'all' },
        )
      : gsap.fromTo(
          el,
          { display: 'block', height: el.scrollHeight, autoAlpha: 1, overflow: 'hidden' },
          { height: 0, autoAlpha: 0, duration: 0.35, ease: 'power2.inOut', clearProps: 'all' },
        )
    return () => {
      tween.kill()
      gsap.set(el, { clearProps: 'all' })
    }
  }, [open])
  return (
    <div ref={ref} hidden={!open} className={className}>
      {children}
    </div>
  )
}

/* ── Controls ────────────────────────────────────────────────────────── */

/** The design's .step: minus, the figure, plus. The figure flashes volt each change. */
export function Stepper({
  id,
  value,
  min,
  max,
  onChange,
  label,
  unit,
}: {
  id?: string
  value: number
  min: number
  max: number
  onChange: (next: number) => void
  /** What is counted, for the buttons' names ("ports"). */
  label: string
  unit?: string
}) {
  const out = React.useRef<HTMLOutputElement>(null)
  const step = (delta: number) => {
    const current = Number.isFinite(value) ? value : min
    const next = Math.max(min, Math.min(max, current + delta))
    if (next === current) return
    onChange(next)
    const el = out.current
    if (!el || prefersReduced()) return
    gsap.killTweensOf(el)
    gsap.fromTo(el, { backgroundColor: 'rgba(212,255,58,.85)' }, { backgroundColor: 'rgba(212,255,58,0)', duration: 0.6, ease: 'power2.out', clearProps: 'backgroundColor' })
    gsap.fromTo(el, { scale: 1.12 }, { scale: 1, duration: 0.5, ease: 'jelly', clearProps: 'transform' })
  }
  const BTN =
    'grid h-[50px] w-12 place-items-center border-0 bg-transparent text-ink transition-colors duration-200 hover:enabled:bg-volt disabled:cursor-default disabled:text-[#c8cacd] [&_svg]:h-4 [&_svg]:w-4'
  return (
    <span className="inline-flex h-[52px] items-center overflow-hidden rounded-[14px] border-[1.5px] border-ink/[.09] bg-white">
      <button type="button" className={BTN} onClick={() => step(-1)} disabled={value <= min} aria-label={`One fewer ${label}`}>
        <Ico name="minus" />
      </button>
      <output
        ref={out}
        id={id}
        aria-live="polite"
        className="block h-full min-w-[64px] border-x border-ink/[.09] text-center font-mono text-[15px] font-semibold leading-[50px] tabular-nums text-ink"
      >
        {value}
        {unit ? <small className="ml-1 text-xs font-medium text-muted">{unit}</small> : null}
      </output>
      <button type="button" className={BTN} onClick={() => step(1)} disabled={value >= max} aria-label={`One more ${label}`}>
        <Ico name="plus" />
      </button>
    </span>
  )
}

/** A switch: a real checkbox under a drawn track and thumb. */
export function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  id?: string
}) {
  return (
    <span className="relative inline-flex h-7 w-12 shrink-0">
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer absolute inset-0 z-[1] m-0 cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-stone transition-colors duration-300 peer-checked:bg-ink peer-focus-visible:shadow-focus"
      />
      <span
        aria-hidden="true"
        className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-[0_2px_6px_rgba(11,12,14,.25)] transition-[translate,background-color] duration-500 ease-spring peer-checked:bg-volt peer-checked:[translate:20px_0]"
      />
    </span>
  )
}

/* ── KPI strip ───────────────────────────────────────────────────────── */

const COLS: Record<number, string> = {
  3: 'grid-cols-3 max-[640px]:grid-cols-1',
  4: 'grid-cols-4 max-[1100px]:grid-cols-2',
  5: 'grid-cols-5 max-[1360px]:grid-cols-3 max-[640px]:grid-cols-2',
}

export function BizStrip({ label, cells, children }: { label: string; cells: 3 | 4 | 5; children: React.ReactNode }) {
  return (
    <section
      data-biz-in=""
      aria-label={label}
      className={cn(
        CARD,
        'mb-[18px] grid overflow-hidden',
        COLS[cells],
        '[&>div]:shadow-[inset_1px_0_0_rgba(11,12,14,.09),inset_0_1px_0_rgba(11,12,14,.09)]',
      )}
    >
      {children}
    </section>
  )
}

const DOT = { ok: 'bg-[#35D07F]', warn: 'bg-[#FFB020]', bad: 'bg-ember', blue: 'bg-[#4C8DFF]', none: 'bg-fog' } as const

export function BizStat({
  label,
  dot,
  value,
  decimals,
  text,
  unit,
  sub,
  lit,
}: {
  label: string
  dot?: keyof typeof DOT
  /** A figure, counted up. */
  value?: number
  decimals?: number
  /** …or a word in its place. */
  text?: React.ReactNode
  unit?: string
  sub?: React.ReactNode
  lit?: boolean
}) {
  return (
    <div className={cn('-ml-px -mt-px min-w-0 px-[22px] py-[18px]', lit && 'bg-ink text-white')}>
      <span className={cn('flex items-center gap-2 text-[13px]', lit ? 'text-fog' : 'text-muted')}>
        {dot ? <i aria-hidden="true" className={cn('inline-block h-2 w-2 shrink-0 rounded-full', DOT[dot])} /> : null}
        {label}
      </span>
      <b
        className={cn(
          'mt-2 block truncate font-mono text-[30px] font-semibold leading-none tracking-[-0.02em] tabular-nums',
          lit ? 'text-volt' : 'text-ink',
        )}
      >
        {value !== undefined ? <Num value={value} decimals={decimals} /> : text}
        {unit ? <small className={cn('ml-1 text-[.5em] font-medium', lit ? 'text-fog' : 'text-fog')}>{unit}</small> : null}
      </b>
      {sub ? <small className="mt-2 block text-xs text-fog">{sub}</small> : null}
    </div>
  )
}

/* ── Save bar ────────────────────────────────────────────────────────── */

export function SaveBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'sticky bottom-20 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[20px] border border-ink/[.09] bg-white/80 p-2.5 pr-5 shadow-[0_24px_50px_-24px_rgba(11,12,14,.4)] backdrop-blur-xl lg:bottom-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** The small "Saved" tick that appears after a save. */
export function SavedTick() {
  return (
    <Reveal className="inline-flex" role="status">
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#12804a]">
        <Ico name="okc" className="h-[18px] w-[18px]" />
        Saved
      </span>
    </Reveal>
  )
}

/** A filled star in the design's amber, for ratings. */
export function StarIco({ className, off }: { className?: string; off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('shrink-0', off ? 'fill-[#d9d6cc]' : 'fill-[#e7a20b]', className)}>
      <path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z" />
    </svg>
  )
}

/** .stars: five, the unearned ones in stone. */
export function Stars({ rating, className }: { rating: number; className?: string }) {
  const full = Math.round(rating)
  return (
    <span className={cn('inline-flex gap-0.5', className)} role="img" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIco key={n} off={n > full} className="h-4 w-4" />
      ))}
    </span>
  )
}

/** .notice: the amber banner. */
export function Notice({
  title,
  children,
  tone = 'warn',
  className,
}: {
  title: React.ReactNode
  children?: React.ReactNode
  tone?: 'warn' | 'info'
  className?: string
}) {
  return (
    <div
      data-biz-in=""
      className={cn(
        'mb-[18px] flex items-start gap-3.5 rounded-2xl border px-[18px] py-4',
        tone === 'warn' ? 'border-[rgba(255,176,32,.35)] bg-[rgba(255,176,32,.13)]' : 'border-ink/[.09] bg-white/70',
        className,
      )}
    >
      <Ico name={tone === 'warn' ? 'alert' : 'q'} className={cn('h-[22px] w-[22px]', tone === 'warn' ? 'text-[#8a5a00]' : 'text-muted')} />
      <div className="min-w-0">
        <b className="block font-semibold text-ink">{title}</b>
        {children ? <span className={cn('text-sm', tone === 'warn' ? 'text-[#6b4b00]' : 'text-muted')}>{children}</span> : null}
      </div>
    </div>
  )
}

/** A green confirmation line, the partner of FormError. */
export function FormOk({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="m-0 flex items-start gap-2.5 rounded-[14px] border border-[rgba(53,208,127,.3)] bg-[rgba(53,208,127,.08)] px-4 py-3 text-sm text-[#12804a]">
      <Ico name="okc" className="mt-px h-[18px] w-[18px]" />
      <span>{children}</span>
    </p>
  )
}
