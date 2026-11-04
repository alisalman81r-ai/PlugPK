// src/components/cars/CarStickyBar.tsx
'use client'

import Image from 'next/image'
import * as React from 'react'

import { getLenis } from '@/components/motion/MotionProvider'
import { cn } from '@/lib/utils'

export interface CarStickyBarProps {
  name: string
  image: string | null
  /** Short figures for the chips, e.g. "378 km range", "64.5 kWh". */
  chips: string[]
  priceLabel: string
  price: string
  /** The page's sections, in order, by element id. */
  sections: { id: string; label: string }[]
}

/**
 * The car page's sticky bar: a frosted-glass strip that slides in under the
 * navbar once the car's sheet has scrolled away. The first row names the car
 * with its key figures and price; the second is a tab per section of the page,
 * which glides there and lights up as each section passes under the bar.
 */
export function CarStickyBar({ name, image, chips, priceLabel, price, sections }: CarStickyBarProps) {
  const [shown, setShown] = React.useState(false)
  const [active, setActive] = React.useState(sections[0]?.id ?? '')
  const barRef = React.useRef<HTMLDivElement>(null)
  const tabsRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      // Shown once the bottom of the sheet (the first section) has passed under the navbar.
      const sheet = document.getElementById(sections[0]?.id ?? '')
      const barBottom = (barRef.current?.getBoundingClientRect().bottom ?? 140) + 120
      setShown(sheet ? sheet.getBoundingClientRect().bottom < 120 : window.scrollY > 600)
      // The current section: the last one whose top has reached the bar.
      let current = sections[0]?.id ?? ''
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= barBottom) current = s.id
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [sections])

  // Keep the active tab in view on narrow screens.
  React.useEffect(() => {
    const tab = tabsRef.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`)
    const box = tabsRef.current
    if (!tab || !box) return
    const left = tab.offsetLeft - box.clientWidth / 2 + tab.offsetWidth / 2
    box.scrollTo({ left, behavior: 'smooth' })
  }, [active])

  const go = (id: string) => (event: React.MouseEvent) => {
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    const offset = -((barRef.current?.getBoundingClientRect().bottom ?? 180) + 16)
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.1 })
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' })
    history.replaceState(null, '', `#${id}`)
  }

  return (
    <div
      ref={barRef}
      aria-hidden={!shown}
      data-theme="light"
      className={cn(
        'fixed inset-x-0 top-[74px] z-40 transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none lg:top-[84px]',
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-4 opacity-0',
      )}
    >
      <div className="mx-auto w-[min(1320px,calc(100%-24px))] overflow-hidden rounded-[22px] border border-white/60 bg-white/65 shadow-[0_24px_50px_-24px_rgba(11,12,14,0.35),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl backdrop-saturate-150">
        {/* Row 1: the car */}
        <div className="flex items-center gap-3 border-b border-ink/[0.07] px-3 py-2 sm:gap-4 sm:px-5">
          {image ? (
            <span className="relative h-9 w-14 shrink-0 sm:h-11 sm:w-[72px]">
              <Image src={image} alt="" fill sizes="72px" className="object-contain mix-blend-multiply" />
            </span>
          ) : null}
          <p className="min-w-0 flex-1 truncate font-display text-[16px] leading-tight text-ink sm:text-[19px]">{name}</p>
          <div className="hidden items-center gap-2 md:flex">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full bg-ink/[0.06] px-3 py-1 text-[13px] font-semibold text-ink/80">
                {chip}
              </span>
            ))}
          </div>
          <div className="shrink-0 border-l border-ink/10 pl-3 text-right sm:pl-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-[11px]">{priceLabel}</p>
            <p className="font-mono text-[14px] font-semibold tabular-nums text-ink sm:text-[17px]">{price}</p>
          </div>
        </div>

        {/* Row 2: the sections */}
        <nav aria-label="Sections of this page">
          <div
            ref={tabsRef}
            className="flex gap-1.5 overflow-x-auto px-3 py-2 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden"
          >
            {sections.map((s) => {
              const on = s.id === active
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  data-tab={s.id}
                  onClick={go(s.id)}
                  tabIndex={shown ? undefined : -1}
                  aria-current={on ? 'location' : undefined}
                  className={cn(
                    'inline-flex h-9 shrink-0 items-center rounded-full px-4 text-[14px] font-semibold transition-[background-color,color] duration-[250ms]',
                    on ? 'bg-ink text-white' : 'bg-ink/[0.05] text-ink/70 hover:bg-ink/10 hover:text-ink',
                  )}
                >
                  {s.label}
                </a>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
