// src/components/home/v2/HomeStory.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import { H2_CLASS, Hl, LEAD_CLASS } from '@/components/v2/ui'
import type { ShowcaseConnectors, ShowcaseSearch } from '@/lib/charging'
import { gsap, prefersReduced, ScrollTrigger, SplitText } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { BoltFill, NavArrow, Phone, PhoneTabs, SearchGlyph, StatusBar } from './Phone'
import { M2_PATH, PK_CITIES, PK_PATH } from './pk-geo'

/* ═══ 2. Statement ═══════════════════════════════════════════════════════
   main.js STATEMENT: pinned for 220% of a screen. The words charge up while
   the photo waits below as a small window; then the window opens to full
   bleed and the type flips to white just before the photo reaches it. The
   window is a full-size layer scaled down with the image counter-scaled, so
   it never distorts and stays on the compositor. */

export function Statement() {
  const ref = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    const sec = ref.current
    if (!sec) return
    if (prefersReduced()) {
      sec.classList.add('is-full')
      sec.dataset.theme = 'dark'
      return
    }
    const media = sec.querySelector<HTMLElement>('.statement__media')!
    const img = sec.querySelector<HTMLElement>('.statement__media img')!
    const rangeN = sec.querySelector<HTMLElement>('.js-range-n')!
    const rangeBar = sec.querySelector<HTMLElement>('.js-range')!
    const split = new SplitText(sec.querySelectorAll('.statement__text--dark > span'), { type: 'words', wordsClass: 'word' })
    const W = { sx: 0.18, sy: 0.24, cy: 78, z: 1.25, r: 22 }
    const paintWindow = () => {
      media.style.transform = `translate3d(0, ${W.cy - 50}%, 0) scale(${W.sx}, ${W.sy})`
      media.style.borderRadius = `${W.r / W.sx}px / ${W.r / W.sy}px`
      img.style.transform = `scale(${W.z / W.sx}, ${W.z / W.sy})`
    }
    paintWindow()
    let lastP = -1
    let full = false
    const ctx = gsap.context(() => {
      gsap.set(split.words, { opacity: 0.14 })
      const st = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: paintWindow,
        scrollTrigger: {
          trigger: sec,
          start: 'top top',
          end: '+=220%',
          scrub: true,
          pin: sec.querySelector('.statement__pin'),
          onUpdate: (s) => {
            const p = Math.round(s.progress * 100)
            if (p !== lastP) {
              lastP = p
              rangeN.textContent = `${p}%`
              rangeBar.style.transform = `scaleX(${s.progress})`
            }
            if (full !== s.progress > 0.55) {
              full = !full
              sec.classList.toggle('is-full', full)
              sec.dataset.theme = full ? 'dark' : 'light'
            }
          },
        },
      })
      st.to(W, { sx: 0.24, sy: 0.32, cy: 76, duration: 1.2 }, 0)
        .to(split.words, { opacity: 1, stagger: 0.1, duration: 0.4 }, 0)
        .to(W, { sx: 1, sy: 1, cy: 50, z: 1, r: 0, duration: 1.6, ease: 'power2.inOut' }, '+=.15')
        // the window spans the whole line of type ~1.05s into its 1.6s opening; swap the type then
        .to(sec.querySelector('.statement__shade'), { opacity: 1, duration: 0.5 }, '<+=.6')
        .to(sec.querySelector('.statement__text--dark'), { opacity: 0, duration: 0.2 }, '<+=.45')
        .to(sec.querySelector('.statement__text--light'), { opacity: 1, duration: 0.2 }, '<')
        .to({}, { duration: 0.4 })
    }, sec)
    return () => {
      ctx.revert()
      split.revert()
      media.style.transform = ''
      media.style.borderRadius = ''
      img.style.transform = ''
    }
  }, [])

  const TEXT =
    'statement__text relative z-[2] col-start-1 row-start-1 m-0 w-[min(1200px,calc(100%-2*clamp(16px,4vw,64px)))] text-balance text-center font-display text-[clamp(30px,4.3vw,68px)] leading-[1.08] [&>span]:block'

  return (
    <section ref={ref} data-theme="light" className="statement group/st relative bg-paper">
      <div className="statement__pin relative grid h-screen min-h-[560px] place-items-center overflow-hidden sm:min-h-[640px]">
        <figure className="statement__media absolute inset-0 m-0 overflow-hidden [backface-visibility:hidden] [transform:translate3d(0,28%,0)_scale(.18,.24)] will-change-transform group-[.is-full]/st:[transform:none] motion-reduce:[transform:none]">
          <Image
            src="/images/home/v2/open-road.jpg"
            alt="An electric car parked on an open mountain road"
            fill
            sizes="100vw"
            className="object-cover will-change-transform"
          />
          <i className="statement__shade absolute inset-0 bg-[linear-gradient(180deg,rgba(11,12,14,.3),rgba(11,12,14,.6))] opacity-0 will-change-[opacity] motion-reduce:opacity-100" />
        </figure>

        <p className={cn(TEXT, 'statement__text--dark text-ink will-change-[opacity] motion-reduce:opacity-0 [&_.word]:will-change-[opacity]')}>
          <span>Drive anywhere in Pakistan, worry-free.</span>
          <span>
            No range anxiety, just the <em className="hl pg-bold not-italic">open road.</em>
          </span>
        </p>
        {/* light copy of the line, cross-faded in over the photo (opacity only, no repaint) */}
        <p aria-hidden="true" className={cn(TEXT, 'statement__text--light text-white opacity-0 will-change-[opacity] motion-reduce:opacity-100')}>
          <span>Drive anywhere in Pakistan, worry-free.</span>
          <span>
            No range anxiety, just the <em className="pg-bold not-italic text-volt">open road.</em>
          </span>
        </p>

        <div
          aria-hidden="true"
          className="absolute bottom-10 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-3.5 font-mono text-xs tracking-[0.14em] text-muted group-[.is-full]/st:text-white"
        >
          RANGE
          <i className="relative h-2 w-[120px] overflow-hidden rounded-lg bg-ink/10 group-[.is-full]/st:bg-white/20 sm:w-[220px]">
            <i className="js-range absolute inset-0 origin-left scale-x-0 rounded-lg bg-ink will-change-transform group-[.is-full]/st:bg-volt" />
          </i>
          <span className="js-range-n">0%</span>
        </div>
      </div>
    </section>
  )
}

/* ═══ 3. How it works ════════════════════════════════════════════════════
   main.js HOW IT WORKS: four app states, picked by the visitor (the section
   scrolls past like any other). The phone acts each one out on the network's
   real data: the city with the most ports and its stations, the connector
   filter, the first station's sheet, and the review. */

const STEPS = [
  { name: 'Search', desc: 'Type a city or share your location, and every charger around you shows up on one map.' },
  { name: 'Filter', desc: 'Pick your connector and the speed you need, and the list narrows to chargers your car can use.' },
  { name: 'Navigate', desc: 'Open a station to check its connectors and ports, then get directions in one tap.' },
  { name: 'Review', desc: 'After you charge, leave a rating so the next driver knows what to expect.' },
]

export function HowItWorks({
  locations,
  search,
  connectors,
}: {
  locations: number
  search: ShowcaseSearch | null
  connectors: ShowcaseConnectors | null
}) {
  const ref = React.useRef<HTMLElement>(null)
  const api = React.useRef<{ setStep: (i: number) => void } | null>(null)
  const [step, setStepState] = React.useState(0)

  const city = search?.city ?? 'Lahore'
  const results = (search?.results ?? []).slice(0, 2)
  const first = results[0] ?? null
  const chip = connectors?.selected ?? 'CCS2'

  React.useEffect(() => {
    const root = ref.current
    if (!root) return
    const reduce = prefersReduced()
    const $ = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!
    const $$ = (s: string) => [...root.querySelectorAll<HTMLElement>(s)]
    let cur = 0
    let typer = 0
    const mm = gsap.matchMedia()

    const ctx = gsap.context(() => {
      const steps = $$('.how__item')
      const bar = $('.js-howbar')
      const chips = [$('.hs-chip.c2'), $('.hs-chip.c3')]
      const sheetNav = $('.hs-sheet--nav')
      const sheetRate = $('.hs-sheet--rate')
      const stars = $$('.hs-stars svg')
      const cards = $$('.hs-card')

      const phoneState = (i: number) => {
        const d = reduce ? 0 : 0.6
        chips.forEach((c) => c.classList.toggle('is-on', i >= 1))
        if (i === 1 && !reduce) gsap.fromTo(chips, { scale: 0.8 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1.2,.4)', stagger: 0.08 })
        cards[0]?.classList.toggle('is-hot', i >= 1)
        cards[1]?.classList.toggle('is-dim', i >= 1)
        gsap.to(sheetNav, { yPercent: i === 2 ? 0 : 110, duration: d, ease: i === 2 ? 'back.out(1.4)' : 'power3.in' })
        gsap.to(sheetRate, { yPercent: i === 3 ? 0 : 110, duration: d, ease: i === 3 ? 'back.out(1.4)' : 'power3.in' })
        stars.forEach((s) => s.classList.remove('on'))
        if (i === 3)
          stars.forEach((s, k) =>
            gsap.delayedCall(reduce ? 0 : 0.35 + k * 0.12, () => {
              s.classList.add('on')
              if (!reduce) gsap.fromTo(s, { scale: 0.4, rotate: -30 }, { scale: 1, rotate: 0, duration: 0.6, ease: 'back.out(3)' })
            }),
          )
        if (i === 0 && !reduce) gsap.fromTo('.hs-pin', { y: -14 }, { y: 0, duration: 0.8, ease: 'bounce.out', stagger: 0.12 })
      }
      const setStep = (i: number, instant = false) => {
        i = gsap.utils.clamp(0, steps.length - 1, i)
        if (i === cur && !instant) return
        cur = i
        setStepState(i)
        if (!reduce && !instant) {
          // the numeral lands with a small spring as its row lights up
          gsap.fromTo(steps[i]!.querySelector('.how__num'), { scale: 0.82, rotate: -6 }, { scale: 1, rotate: 0, duration: 0.8, ease: 'elastic.out(1.1,.45)', transformOrigin: '0% 60%' })
        }
        gsap.to(bar, { scaleX: (i + 1) / steps.length, duration: reduce ? 0 : 0.6, ease: 'expo.out' })
        phoneState(i)
      }
      api.current = { setStep: (i) => ctx.add(() => setStep(i)) }
      gsap.set([sheetNav, sheetRate], { yPercent: 110 })
      setStep(0, true)

      // typed search on first view
      const typed = $('.js-typed')
      if (!reduce) {
        typed.textContent = ''
        ScrollTrigger.create({
          trigger: root,
          start: 'top 60%',
          once: true,
          onEnter: () => {
            const word = city
            let n = 0
            typer = window.setInterval(() => {
              typed.textContent = word.slice(0, ++n)
              if (n >= word.length) {
                window.clearInterval(typer)
                ctx.add(() => phoneState(cur))
              }
            }, 110)
          },
        })
      }

      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.from('.how__item', { x: -40, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: root, start: 'top 60%' } })
        gsap.from('.how__slab', { rotateY: -40, xPercent: 20, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: root, start: 'top 70%' } })
        gsap.from('.phone--how', { yPercent: 30, rotate: 8, autoAlpha: 0, duration: 1.4, ease: 'elastic.out(1,.8)', scrollTrigger: { trigger: root, start: 'top 60%' } })
        gsap.from('.how__badge', { scale: 0, rotate: -12, duration: 0.9, ease: 'back.out(2.5)', scrollTrigger: { trigger: root, start: 'top 40%' } })
        gsap.to('.how__badge', { y: -14, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' })
      })
    }, root)
    return () => {
      window.clearInterval(typer)
      api.current = null
      mm.revert()
      ctx.revert()
    }
  }, [city])

  return (
    <section ref={ref} id="how" data-theme="light" className="how bg-chalk">
      <div className="mx-auto grid w-[min(1320px,calc(100%-2*clamp(16px,4vw,64px)))] items-center gap-6 py-[clamp(96px,11vw,150px)] max-lg:pb-20 max-lg:pt-[110px] lg:grid-cols-2 lg:gap-10">
        <div className="max-w-[620px]">
          <p className="mb-[18px] font-mono text-xs font-semibold uppercase tracking-[0.16em] text-volt-ink">
            Start finding chargers in seconds
          </p>
          <h2 className={cn(H2_CLASS, 'mb-[30px] text-[clamp(36px,3.9vw,60px)] text-ink')}>
            Find a charger <Hl>near you.</Hl>
          </h2>
          <ol className="border-t border-ink/10">
            {STEPS.map((s, i) => {
              const on = i === step
              return (
                <li key={s.name} className={cn('how__item border-b border-ink/10', on && 'is-on')}>
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={`Step ${i + 1} of 4: ${s.name}`}
                    onClick={() => api.current?.setStep(i)}
                    className="group/how grid w-full grid-cols-[clamp(64px,6.4vw,96px)_1fr] items-start gap-[18px] py-[18px] text-left"
                  >
                    <span
                      className={cn(
                        'how__num inline-block font-display text-[clamp(40px,3.8vw,60px)] leading-[0.92] transition-[color,-webkit-text-stroke-color] duration-500 ease-out',
                        on ? 'text-ink [-webkit-text-stroke:var(--pg-medium)_#0B0C0E]' : 'text-transparent [-webkit-text-stroke:1.2px_rgba(11,12,14,.24)]',
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>
                      <b
                        className={cn(
                          'pg-medium mb-1.5 mt-0.5 block font-display text-[clamp(22px,2vw,30px)] font-normal leading-[1.1] text-ink transition-opacity duration-500 ease-out',
                          on ? 'opacity-100' : 'opacity-[0.32] group-hover/how:opacity-60',
                        )}
                      >
                        {s.name}
                      </b>
                      <span
                        className={cn(
                          'block max-w-[30rem] text-[15.5px] leading-[1.55] text-muted transition-opacity duration-500 ease-out',
                          on ? 'opacity-100' : 'opacity-45',
                        )}
                      >
                        {s.desc}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div aria-hidden="true" className="mt-[26px] h-[3px] overflow-hidden rounded-[3px] bg-ink/10">
            <i className="js-howbar relative block h-full origin-left scale-x-[.25] rounded-[3px] bg-ink will-change-transform after:absolute after:right-0 after:top-0 after:h-full after:w-[18px] after:bg-volt" />
          </div>
        </div>

        <div aria-hidden="true" className="relative -mx-2 h-[560px] sm:mx-0 sm:h-[620px] lg:h-[640px]">
          <div className="how__slab absolute inset-[40px_6%_40px_14%] rounded-[40px] bg-[radial-gradient(120%_90%_at_20%_10%,#F3FFC2,#D4FF3A_55%,#A9D81A)] shadow-e2 [transform:perspective(1200px)_rotateY(-14deg)_rotateX(4deg)] after:absolute after:inset-0 after:rounded-[inherit] after:bg-[repeating-linear-gradient(115deg,transparent_0_46px,rgba(255,255,255,.18)_46px_48px)]" />
          <div className="how__badge absolute bottom-2.5 left-2 z-[3] inline-flex items-center gap-2.5 rounded-full bg-white px-5 py-3.5 text-[15px] font-semibold shadow-e2 sm:bottom-auto sm:left-0 sm:top-[46%]">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-volt-ink">
              <g fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </g>
            </svg>
            {locations.toLocaleString('en-PK')} {locations === 1 ? 'location' : 'locations'} mapped
          </div>
          <Phone className="phone--how left-1/2 top-1/2 [translate:-42%_-50%] max-sm:[scale:.86]">
            <StatusBar />
            <div className="flex h-10 items-center gap-2 rounded-xl border-[1.5px] border-volt px-3 text-[13px] font-medium">
              <SearchGlyph className="h-[15px] w-[15px] text-volt" />
              <span className="js-typed after:ml-0.5 after:inline-block after:h-[13px] after:w-px after:animate-[blink_1s_steps(2)_infinite] after:bg-volt after:align-[-2px]">
                {city}
              </span>
              <svg viewBox="0 0 24 24" className="ml-auto w-[13px] text-white/50">
                <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="mt-2.5 flex gap-1.5">
              {[
                ['c1', 'Near me'],
                ['c2', 'Fast 50 kW+'],
                ['c3', chip],
              ].map(([k, label]) => (
                <span
                  key={k}
                  className={cn(
                    'hs-chip inline-flex h-[26px] items-center gap-1 rounded-full bg-[#1B1E23] px-2.5 text-[10px] font-medium text-white/80 transition-colors duration-300 [&.is-on]:bg-volt [&.is-on]:text-ink',
                    k,
                  )}
                >
                  {k === 'c1' ? (
                    <svg viewBox="0 0 24 24" className="h-[11px] w-[11px] text-volt">
                      <g fill="none" stroke="currentColor" strokeWidth="1.7">
                        <circle cx="12" cy="12" r="6.5" />
                        <circle cx="12" cy="12" r="2" fill="currentColor" />
                        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                      </g>
                    </svg>
                  ) : null}
                  {label}
                </span>
              ))}
            </div>
            <div className="relative mt-2.5 h-[150px] overflow-hidden rounded-[14px] bg-[#15181C]">
              <svg viewBox="0 0 280 150" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
                <g stroke="rgba(255,255,255,.08)" strokeWidth="6" fill="none" strokeLinecap="round">
                  <path d="M-10 40 300 20M-10 110 300 85M60 -10 90 170M190 -10 170 170M-10 150 140 -10" />
                </g>
                <g stroke="rgba(255,255,255,.04)" strokeWidth="2">
                  <path d="M0 70h280M120 0v150M230 0v150" />
                </g>
                <circle cx="150" cy="104" r="6" fill="#fff" />
                <circle cx="150" cy="104" r="6" fill="none" stroke="#fff" className="origin-[150px_104px] animate-[me_2s_cubic-bezier(.16,1,.3,1)_infinite]" />
              </svg>
              {[
                ['30%', '26%'],
                ['64%', '6%'],
              ].map(([left, top]) => (
                <span
                  key={left}
                  style={{ left, top }}
                  className="hs-pin absolute grid h-7 w-7 place-items-center rounded-[50%_50%_50%_4px] bg-volt text-ink shadow-[0_6px_16px_rgba(0,0,0,.5)] [rotate:-45deg]"
                >
                  <BoltFill className="h-[13px] w-[13px] rotate-45" />
                </span>
              ))}
            </div>
            <div className="mt-3">
              <p className="mx-0.5 mb-2 flex items-baseline justify-between">
                <b className="text-xs">
                  {search?.results.length ?? results.length} {(search?.results.length ?? results.length) === 1 ? 'charger' : 'chargers'} in {city}
                </b>
                <span className="text-[9.5px] text-white/50">Fastest first</span>
              </p>
              {results.map((r) => (
                <div
                  key={r.slug}
                  className="hs-card mb-2 rounded-[14px] border border-transparent bg-[#181B1F] px-3 py-[11px] transition-[border-color,opacity] duration-300 [&.is-dim]:opacity-35 [&.is-hot]:border-volt"
                >
                  <p className="mb-[3px] flex justify-between">
                    <b className="truncate text-[11.5px]">{r.name}</b>
                    <span className="shrink-0 text-[10px] text-white/65">
                      {r.ports} {r.ports === 1 ? 'port' : 'ports'}
                    </span>
                  </p>
                  <small className="flex items-center gap-1 text-[9.5px] text-white/60">
                    <BoltFill className="h-2.5 w-2.5 text-volt" />
                    {r.area} · {Math.round(r.maxPowerKw)} kW
                  </small>
                  <div className="mt-2 flex gap-[5px]">
                    {r.connectors.slice(0, 2).map((c) => (
                      <i key={c} className="rounded-full border border-white/20 px-2 py-[3px] text-[9px] font-semibold not-italic">
                        {c}
                      </i>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* step 3: station sheet */}
            <div className="hs-sheet hs-sheet--nav absolute inset-x-0 bottom-0 z-[3] rounded-t-3xl bg-[#1B1E23] px-[18px] pb-[70px] pt-3 shadow-[0_-20px_40px_rgba(0,0,0,.5)]">
              <i className="mx-auto mb-3 block h-1 w-9 rounded bg-white/20" />
              <p className="mb-1 text-[15px] font-bold">{first?.name}</p>
              <small className="flex items-center gap-1 text-[9.5px] text-white/60">
                <BoltFill className="h-2.5 w-2.5 text-volt" />
                {first ? `${first.area} · ${Math.round(first.maxPowerKw)} kW · ${first.ports} ports` : null}
              </small>
              <div className="mt-2 flex gap-[5px]">
                {(first?.connectors ?? []).slice(0, 2).map((c) => (
                  <i key={c} className="rounded-full border border-white/20 px-2 py-[3px] text-[9px] font-semibold not-italic">
                    {c}
                  </i>
                ))}
              </div>
              <div className="mt-3.5 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-volt text-xs font-bold text-ink">
                <NavArrow className="h-[13px] w-[13px]" />
                Navigate
              </div>
            </div>
            {/* step 4: review sheet */}
            <div className="hs-sheet hs-sheet--rate absolute inset-x-0 bottom-0 z-[3] rounded-t-3xl bg-[#1B1E23] px-[18px] pb-[70px] pt-3 shadow-[0_-20px_40px_rgba(0,0,0,.5)]">
              <i className="mx-auto mb-3 block h-1 w-9 rounded bg-white/20" />
              <p className="mb-1 text-[15px] font-bold">Rate this station</p>
              <div className="hs-stars my-2.5 flex gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <svg key={i} viewBox="0 0 24 24" className="h-7 w-7 text-white/15 [&.on]:text-[#FFB020]">
                    <path d="m12 3 2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8z" fill="currentColor" />
                  </svg>
                ))}
              </div>
              <div className="h-[54px] rounded-xl border border-white/[0.12] px-3 py-2.5 text-[10.5px] text-white/45">Share your experience…</div>
            </div>
            <PhoneTabs on="Map" />
          </Phone>
        </div>
      </div>
    </section>
  )
}

/* ═══ 4. Route planner ═══════════════════════════════════════════════════
   main.js ROUTE PLANNER: the country, then the M-2 corridor, then drive it.
   On a desktop the section pins for 3.2 screens and the scroll drives the
   trip timeline (scrub 1): the map zooms from Pakistan to the corridor, the
   car rides the motorway, the battery drains, charges twice and arrives,
   and the card's timeline and state follow the playhead. On a phone the
   same timeline plays through over 9s once the section is in view. The trip
   is an illustration and says so. */

const SHOWN = ['Gilgit', 'Peshawar', 'Islamabad', 'D.I. Khan', 'Faisalabad', 'Lahore', 'Multan', 'Bahawalpur', 'Quetta', 'Sukkur', 'Hyderabad', 'Karachi']
const KEY = new Set(['Islamabad', 'Lahore'])
const FULL = '0 0 1000 811'
const ZOOM = '530 150 260 230'

export function RouteBand() {
  const ref = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    const sec = ref.current
    if (!sec) return
    const reduce = prefersReduced()
    const rmap = sec.querySelector<SVGSVGElement>('.rmap')!
    const rRoute = sec.querySelector<SVGPathElement>('.rmap__route')!
    const rGhost = sec.querySelector<SVGPathElement>('.rmap__ghost')!
    const RL = rRoute.getTotalLength()
    const nearestFraction = (pt: [number, number]) => {
      let best = 0
      let bd = Infinity
      for (let i = 0; i <= 400; i++) {
        const p = rRoute.getPointAtLength((RL * i) / 400)
        const d = (p.x - pt[0]) ** 2 + (p.y - pt[1]) ** 2
        if (d < bd) {
          bd = d
          best = i / 400
        }
      }
      return best
    }
    const cityNodes = [...sec.querySelectorAll<SVGGElement>('.rmap__city')].map((g) => ({
      x: Number(g.dataset.x),
      y: Number(g.dataset.y),
      key: g.classList.contains('is-key'),
      c: g.querySelector('circle')!,
      t: g.querySelector('text')!,
    }))
    const f1 = nearestFraction(PK_CITIES['Bhera']!)
    const f2 = nearestFraction(PK_CITIES['Pindi Bhattian']!)
    const stopNodes = [...sec.querySelectorAll<SVGGElement>('.rmap__stop')].map((g, i) => {
      const p = rRoute.getPointAtLength(RL * (i === 0 ? f1 : f2))
      return { g, x: p.x, y: p.y }
    })
    const car = sec.querySelector<SVGGElement>('.rmap__car')!
    const dot = car.querySelector<SVGCircleElement>('.rmap__dot')!
    const halo = car.querySelector<SVGCircleElement>('.rmap__halo')!

    const counter = () => {
      // keep labels, dots and strokes a constant on-screen size whatever the zoom
      const vb = rmap.viewBox.baseVal
      const r = rmap.getBoundingClientRect()
      const k = Math.min(r.width / vb.width, r.height / vb.height) || 1
      const u = 1 / k
      cityNodes.forEach((n) => {
        n.c.setAttribute('r', String((n.key ? 5 : 3.5) * u))
        n.t.setAttribute('font-size', String((n.key ? 16 : 13) * u))
        n.t.setAttribute('x', String(n.x + 10 * u))
        n.t.setAttribute('y', String(n.y + 4.5 * u))
      })
      stopNodes.forEach((s) => s.g.setAttribute('transform', `translate(${s.x} ${s.y}) scale(${u})`))
      dot.setAttribute('r', String(7 * u))
      dot.setAttribute('stroke-width', String(3 * u))
      halo.setAttribute('r', String(18 * u))
      rRoute.style.strokeWidth = String(4 * u)
      rGhost.style.strokeWidth = String(1.5 * u)
      rGhost.style.strokeDasharray = `${2 * u} ${6 * u}`
    }

    const batt = sec.querySelector<HTMLElement>('.js-batt')!
    const cellFill = sec.querySelector<HTMLElement>('.js-cellfill')!
    const stateTx = sec.querySelector<HTMLElement>('.js-state')!
    const lis = [...sec.querySelectorAll<HTMLElement>('.trip__tl li')]
    const P = { t: 0, b: 80 }
    // phase boundaries (timeline seconds): zoom, drive, charge, drive, charge, drive
    const ZT = 1.4
    const CT = 0.9
    const DT = 6
    const tA = ZT + f1 * DT
    const tB = tA + CT
    const tC = tB + (f2 - f1) * DT
    const tD = tC + CT
    const tE = tD + (1 - f2) * DT

    let tripTl: gsap.core.Timeline
    let litN = -1
    let alive = true
    const mm = gsap.matchMedia()
    const render = () => {
      // a cleaned-up instance (React runs effects twice in development) must not paint
      if (!alive) return
      const p = rRoute.getPointAtLength(RL * P.t)
      car.setAttribute('transform', `translate(${p.x} ${p.y})`)
      rRoute.style.strokeDasharray = String(RL)
      rRoute.style.strokeDashoffset = String(RL * (1 - P.t))
      batt.textContent = `${Math.round(P.b)}%`
      cellFill.style.width = `${P.b}%`
      cellFill.style.background = P.b < 40 ? '#FFB020' : '#D4FF3A'
      // derived from the playhead so scrubbing backwards stays correct
      const t = tripTl ? tripTl.time() : 0
      const n = t < tA ? 0 : t < tC ? 1 : t < tE - 0.02 ? 2 : 3
      // only on a change: re-writing the same class every frame restarts each row's fade
      if (n !== litN) {
        litN = n
        lis.forEach((li, k) => li.classList.toggle('is-on', k <= n))
      }
      stateTx.textContent =
        t < ZT + 0.05 ? 'Departing' : t < tA ? 'Driving' : t < tB ? 'Charging' : t < tC ? 'Driving' : t < tD ? 'Charging' : t < tE - 0.02 ? 'Driving' : 'Arrived'
      counter()
    }

    const ctx = gsap.context(() => {
      tripTl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: render })
      tripTl
        .fromTo(rmap, { attr: { viewBox: FULL } }, { attr: { viewBox: ZOOM }, duration: ZT, ease: 'power2.inOut' })
        .fromTo(car, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, ZT - 0.2)
        .to(P, { t: f1, b: 34, duration: f1 * DT }, ZT)
        .to(P, { b: 78, duration: CT })
        .to(P, { t: f2, b: 41, duration: (f2 - f1) * DT })
        .to(P, { b: 80, duration: CT })
        .to(P, { t: 1, b: 45, duration: (1 - f2) * DT })
        .to({}, { duration: 0.5 })
      render()

      mm.add(
        {
          desk: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
          mob: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
          rm: '(prefers-reduced-motion: reduce)',
        },
        (c) => {
          const { desk, mob, rm } = c.conditions as { desk: boolean; mob: boolean; rm: boolean }
          if (desk) {
            gsap.to(tripTl, {
              progress: 1,
              ease: 'none',
              scrollTrigger: { trigger: sec, start: 'top top', end: `+=${window.innerHeight * 3.2}`, pin: sec.querySelector('.route__pin'), scrub: 1 },
            })
          }
          if (mob) {
            ScrollTrigger.create({ trigger: sec, start: 'top 60%', once: true, onEnter: () => gsap.to(tripTl, { progress: 1, duration: 9, ease: 'none' }) })
          }
          if (rm) {
            tripTl.progress(1)
            render()
          }
        },
      )

      if (!reduce) {
        gsap.from('.route__copy > *', { y: 40, autoAlpha: 0, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: sec, start: 'top 65%' } })
        gsap.from('.trip', { y: 80, rotate: 3, autoAlpha: 0, duration: 1.3, ease: 'elastic.out(1,.85)', scrollTrigger: { trigger: sec, start: 'top 55%' } })
      }
    }, sec)

    window.addEventListener('resize', counter)
    return () => {
      alive = false
      window.removeEventListener('resize', counter)
      mm.revert()
      tripTl?.kill()
      ctx.revert()
    }
  }, [])

  return (
    <section ref={ref} id="routes" data-theme="dark" className="route relative bg-ink text-white">
      <div className="route__pin relative overflow-hidden lg:h-screen lg:min-h-[720px]">
        <svg
          viewBox={FULL}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          className="rmap relative block h-[440px] w-full lg:absolute lg:inset-0 lg:h-full"
        >
          <defs>
            <pattern id="rgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0v40" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="-500" y="-500" width="2000" height="1811" fill="url(#rgrid)" />
          <path d={PK_PATH} fill="#121519" stroke="rgba(212,255,58,.35)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <g>
            {SHOWN.map((name) => {
              const [x, y] = PK_CITIES[name]!
              const key = KEY.has(name)
              return (
                <g key={name} className={cn('rmap__city', key && 'is-key')} data-x={x} data-y={y}>
                  <circle cx={x} cy={y} r={key ? 5 : 3.5} fill={key ? '#fff' : 'rgba(255,255,255,.45)'} />
                  <text x={x + 10} y={y + 4.5} fontSize={key ? 16 : 13} fontWeight={key ? 600 : 400} fill={key ? '#fff' : 'rgba(255,255,255,.45)'} className="font-sans">
                    {name}
                  </text>
                </g>
              )
            })}
          </g>
          <path className="rmap__ghost" d={M2_PATH} fill="none" stroke="rgba(255,255,255,.18)" strokeLinecap="round" />
          <path className="rmap__route" d={M2_PATH} fill="none" stroke="#D4FF3A" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgba(212,255,58,.7))' }} />
          <g>
            {[0, 1].map((i) => (
              <g key={i} className="rmap__stop">
                <circle r="11" strokeWidth="2" fill="#0B0C0E" stroke="#D4FF3A" />
                <path d="M1.6-7 -4.5 1h4l-1.3 6L4.6-1h-4z" fill="#D4FF3A" />
              </g>
            ))}
          </g>
          <g className="rmap__car">
            <circle className="rmap__halo" r="16" fill="rgba(212,255,58,.22)" />
            <circle className="rmap__dot" r="7" fill="#D4FF3A" stroke="#0B0C0E" />
          </g>
        </svg>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,#0B0C0E_0%,rgba(11,12,14,.88)_26%,transparent_44%,transparent_62%,rgba(11,12,14,.85)_78%,#0B0C0E_100%)] lg:block"
        />

        <div className="relative z-[2] mx-auto grid w-[min(1440px,calc(100%-2*clamp(16px,4vw,64px)))] items-center gap-8 pb-20 pt-10 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,.75fr)_minmax(340px,420px)] lg:py-0">
          <div className="route__copy">
            <h2 className={cn(H2_CLASS, 'text-[clamp(36px,3.7vw,62px)] text-white')}>
              <span className="block">Plan a long drive</span>{' '}
              <span className="block">
                <Hl dark>around your range</Hl>
              </span>
            </h2>
            <p className={cn(LEAD_CLASS, 'max-w-[34rem] text-white/70')}>
              Pick a start and a destination. We place the charging stops where your car actually needs them, using its
              real range rather than the brochure figure.
            </p>
            <Link
              href="/routes"
              data-magnetic=""
              className="mt-9 inline-flex h-12 items-center gap-2.5 rounded-full bg-white px-[22px] text-[15px] font-semibold text-ink transition-colors duration-300 hover:bg-volt"
            >
              Plan a route
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
                <path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div className="trip rounded-[28px] border border-white/10 bg-[rgba(22,24,28,.72)] p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)] backdrop-blur-[20px] sm:p-[26px] lg:col-start-3">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-white/20 px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/75">
                Example trip · Illustration
              </span>
              <span className="font-mono font-semibold text-volt">385 km</span>
            </div>
            <p className="pg-medium mb-[18px] mt-3.5 font-display text-[26px] leading-[1.1]">Islamabad → Lahore</p>
            <div className="mb-[18px] flex items-center gap-3.5 rounded-2xl bg-white/[0.04] p-3.5">
              <div className="relative h-[26px] flex-1 rounded-lg border-[1.5px] border-white/40 p-[3px] after:absolute after:-right-1.5 after:top-[7px] after:h-[9px] after:w-[3px] after:rounded-r-sm after:bg-white/40">
                <i className="js-cellfill block h-full w-[80%] rounded bg-volt transition-[background-color] duration-300" />
              </div>
              <b className="js-batt min-w-16 text-right font-mono text-[22px]">80%</b>
              <span className="js-state min-w-[76px] font-mono text-[11px] uppercase tracking-[0.08em] text-white/55">Departing</span>
            </div>
            <ol className="trip__tl relative before:absolute before:bottom-[18px] before:left-[13px] before:top-[18px] before:border-l-[1.5px] before:border-dashed before:border-white/20">
              {[
                { name: 'Islamabad', meta: '80%', tone: 'text-[#35D07F]', dot: 'border-[#35D07F] bg-[#35D07F]' },
                { name: 'Charging stop 1', meta: '22m · 34→78%', tone: 'text-white/65', dot: 'border-volt bg-volt text-ink', bolt: true },
                { name: 'Charging stop 2', meta: '23m · 41→80%', tone: 'text-white/65', dot: 'border-volt bg-volt text-ink', bolt: true },
                { name: 'Lahore', meta: '45%', tone: 'text-[#FFB020]', dot: 'border-white bg-white' },
              ].map((row, i) => (
                <li
                  key={row.name}
                  className={cn(
                    'relative grid grid-cols-[28px_1fr_auto] items-center gap-3.5 py-3 opacity-[0.38] transition-opacity duration-[400ms] [&.is-on]:opacity-100',
                    i === 0 && 'is-on',
                  )}
                >
                  <i className={cn('grid h-7 w-7 place-items-center rounded-full border-[1.5px]', row.dot)}>
                    {row.bolt ? <BoltFill className="h-[13px] w-[13px]" /> : null}
                  </i>
                  <b className="text-[15px] font-semibold">{row.name}</b>
                  <span className={cn('font-mono text-[12.5px]', row.tone)}>{row.meta}</span>
                </li>
              ))}
            </ol>
            <div className="mt-3.5 grid grid-cols-3 gap-3 border-t border-white/10 pt-[18px]">
              {[
                [
                  '4h 20m',
                  'Drive time',
                  <g key="c" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </g>,
                ],
                ['2', 'Charging stops', <path key="b" d="M13.5 2 4 14h7l-1.5 8L20 10h-7z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />],
                [
                  '45m',
                  'Charging',
                  <g key="t" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
                    <rect x="7" y="4" width="10" height="17" rx="2" />
                    <path d="M10 2h4" />
                    <path d="m12.6 8.5-2.2 3.5h3.2l-2.2 3.5" />
                  </g>,
                ],
              ].map(([v, l, icon]) => (
                <div key={l as string}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-volt" aria-hidden="true">
                    {icon}
                  </svg>
                  <b className="mt-1.5 block font-mono text-xl font-semibold">{v}</b>
                  <span className="text-xs text-white/55">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
