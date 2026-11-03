// src/components/motion/MotionProvider.tsx
'use client'

import 'lenis/dist/lenis.css'

import Lenis from 'lenis'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { finePointer, gsap, prefersReduced, ScrollTrigger, SplitText } from '@/lib/gsap'

/**
 * The landing-v2 shared motion layer — js/pages.js, ported.
 *
 * Mounted once in the root layout. It runs Lenis smooth scroll (lerp 0.1)
 * on GSAP's ticker, and on every page it wires the behaviours the design
 * attaches by class, here by data attribute, so any component — server or
 * client — opts in with markup alone:
 *
 *   data-hero-title    a hero h1: its characters rise out of a line mask
 *   data-hero-item     hero parts that follow it in (sub, search, actions, stats)
 *   data-hero-items    a wrapper whose children each follow in as hero items
 *   data-lift          the sheet lifted into the hero: rises 80px after them
 *   data-shead         a section header (home only, main.js): eyebrow, then
 *                      words of [data-split], then lead
 *   data-split         a heading whose words rise out of a line mask on scroll
 *   data-reveal        rises 32px and fades in on scroll; neighbours stagger 0.07s
 *   data-count="26"    counts up from 0 on scroll (data-dec for decimals)
 *   data-magnetic      a button that leans toward the pointer and springs back
 *   data-faq           a native <details> whose answer ([data-faq-a]) eases open
 *   data-foot-word     the footer wordmark: its letters rise when the page ends
 *   data-foot-col      footer columns that rise with it
 *   data-lenis-prevent an element that scrolls on its own (map, list, dialog):
 *                      Lenis leaves its wheel and touch events alone
 *
 * Elements added after the page mounts (client data, dialogs) are picked up
 * by a MutationObserver, so nothing marked data-reveal is ever left hidden.
 * Nothing is touched before React has hydrated it. Everything is reverted on
 * navigation, and nothing runs under prefers-reduced-motion — the CSS in
 * globals.css shows it all in place.
 */

let lenisInstance: Lenis | null = null

/** The page's Lenis, for components that scroll programmatically or lock scroll. */
export function getLenis(): Lenis | null {
  return lenisInstance
}

const EXPO = 'expo.out'

const HOOKS = '[data-reveal],[data-count],[data-split],[data-shead],[data-magnetic],details[data-faq],[data-hero-title]'

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  /* ── Smooth scroll, once ─────────────────────────────────────────── */
  React.useEffect(() => {
    if (prefersReduced()) return
    /*
      This Lenis has no nested-scroll handling of its own, and it is asked
      about every element under the pointer. Anything that scrolls by itself
      — a dropdown, a dialog, a list panel — and the map's canvas keep their
      native wheel and touch, so the page does not scroll from under them.
    */
    const prevent = (node: HTMLElement) => {
      if (node.classList.contains('maplibregl-map') || node.classList.contains('gm-style')) return true
      if (node === document.body || node === document.documentElement) return false
      const style = getComputedStyle(node)
      return /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1
    }
    const lenis = new Lenis({ lerp: 0.1, prevent })
    lenisInstance = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    // In-page anchors glide there, clearing the floating navbar.
    const onClick = (event: MouseEvent) => {
      const a = (event.target as HTMLElement).closest('a')
      if (!a || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return
      const href = a.getAttribute('href') ?? ''
      const hash = href.startsWith('#')
        ? href
        : href.startsWith(`${window.location.pathname}#`)
          ? href.slice(window.location.pathname.length)
          : ''
      if (hash.length < 2) return
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (!target) return
      event.preventDefault()
      history.replaceState(null, '', hash)
      lenis.scrollTo(target, { offset: -90, duration: 1.2 })
    }
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisInstance = null
    }
  }, [])

  /* ── Per page: the attribute-driven behaviours ───────────────────── */
  React.useEffect(() => {
    if (!window.location.hash) lenisInstance?.scrollTo(0, { immediate: true, force: true })
    if (prefersReduced()) return

    const fine = finePointer()
    const isHome = pathname === '/'
    const done = new WeakSet<Element>()
    const splits: SplitText[] = []
    const cleanups: (() => void)[] = []
    const main = document.querySelector('main') ?? document.body

    /*
      Only elements React has hydrated are touched. A page with its own
      loading.tsx hydrates in its own Suspense boundary, after this effect has
      run; splitting or restyling its markup before then changes the server HTML
      under React, which throws a hydration error and re-renders the page. An
      element that is not hydrated yet is left for a later frame (see retry).
    */
    const FIBER = '__reactFiber'
    const hydrated = (el: Element) => Object.keys(el).some((k) => k.startsWith(FIBER))
    let waiting = false
    const ready = (el: Element) => {
      if (done.has(el)) return false
      if (hydrated(el)) return true
      waiting = true
      return false
    }

    const ctx = gsap.context(() => {})

    /* hero entrance: title chars rise, then the rest, then the lifted sheet */
    const hero = () => {
      const title = main.querySelector<HTMLElement>('[data-hero-title]')
      if (!title || !ready(title)) return
      // [data-hero-items] staggers each of its children as its own item
      const items = [...main.querySelectorAll('[data-hero-item], [data-hero-items] > *')]
      const lift = main.querySelector('[data-lift]')
      // the whole hero waits until every part of it is hydrated, not just the title
      if (![...items, ...(lift ? [lift] : [])].every(hydrated)) {
        waiting = true
        return
      }
      done.add(title)
      const split = new SplitText(title, { type: 'lines,words,chars', mask: 'lines' })
      splits.push(split)
      items.forEach((el) => done.add(el))
      const tl = gsap.timeline({ defaults: { ease: EXPO } }).from(split.chars, { yPercent: 110, duration: 1.1, stagger: 0.016 })
      if (items.length) tl.from(items, { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.07 }, 0.35)
      if (lift) tl.from(lift, { y: 80, autoAlpha: 0, duration: 1.2 }, 0.5)
    }

    /* The scan: anything not yet wired, now or later. */
    const scan = (root: ParentNode) => {
      waiting = false
      ctx.add(() => {
        hero()

        /* section headers. Home (main.js .shead): eyebrow, words out of a mask,
           then the lead. Inner pages (pages.js) split only the heading, below. */
        if (isHome) {
          root.querySelectorAll<HTMLElement>('[data-shead]').forEach((h) => {
            if (!ready(h)) return
            done.add(h)
            const heading = h.querySelector<HTMLElement>('[data-split]')
            if (heading) done.add(heading)
            const tl = gsap.timeline({ scrollTrigger: { trigger: h, start: 'top 80%' } })
            const eyebrow = h.querySelector('[data-shead-eyebrow]')
            const lead = h.querySelector('[data-shead-lead]')
            if (eyebrow) tl.from(eyebrow, { y: 14, autoAlpha: 0, duration: 0.6, ease: 'power3.out' })
            if (heading) {
              const s = new SplitText(heading, { type: 'lines,words', mask: 'lines' })
              splits.push(s)
              tl.from(s.words, { yPercent: 110, duration: 1, stagger: 0.05, ease: EXPO }, eyebrow ? '<+=.1' : 0)
            }
            if (lead) tl.from(lead, { y: 20, autoAlpha: 0, duration: 0.9, ease: 'power3.out' }, '<+=.3')
          })
        }

        /* headings on their own: words rise out of a mask (pages.js) */
        root.querySelectorAll<HTMLElement>('[data-split]').forEach((h) => {
          if (!ready(h)) return
          done.add(h)
          const s = new SplitText(h, { type: 'lines,words', mask: 'lines' })
          splits.push(s)
          gsap.from(s.words, { yPercent: 110, duration: 1, stagger: 0.04, ease: EXPO, scrollTrigger: { trigger: h, start: 'top 85%' } })
        })

        /* counters */
        root.querySelectorAll<HTMLElement>('[data-count]').forEach((n) => {
          if (!ready(n)) return
          done.add(n)
          const end = parseFloat(n.dataset.count ?? '')
          const dec = Number(n.dataset.dec ?? 0)
          if (Number.isNaN(end)) return
          ScrollTrigger.create({
            trigger: n,
            start: 'top 92%',
            once: true,
            onEnter: () => {
              const o = { v: 0 }
              gsap.to(o, {
                v: end,
                duration: 1.4,
                ease: 'power3.out',
                onUpdate: () => {
                  n.textContent = o.v.toLocaleString('en-PK', { minimumFractionDigits: dec, maximumFractionDigits: dec })
                },
              })
            },
          })
        })

        /* scroll reveals, batched so neighbours stagger */
        const reveals = [...root.querySelectorAll<HTMLElement>('[data-reveal]')].filter((el) => ready(el))
        reveals.forEach((el) => done.add(el))
        if (reveals.length) {
          ScrollTrigger.batch(reveals, {
            start: 'top 90%',
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: EXPO,
                stagger: 0.07,
                overwrite: true,
                // Then hand the element back to its own CSS: GSAP's inline
                // transform would otherwise cancel any hover lift on it.
                onComplete: () =>
                  batch.forEach((el) => {
                    el.classList.add('is-revealed')
                    gsap.set(el, { clearProps: 'transform,translate,opacity,visibility' })
                  }),
              }),
          })
        }

        /* FAQ: smooth open and close on native <details> */
        root.querySelectorAll<HTMLDetailsElement>('details[data-faq]').forEach((d) => {
          if (!ready(d)) return
          done.add(d)
          const summary = d.querySelector('summary')
          const answer = d.querySelector<HTMLElement>('[data-faq-a]')
          if (!summary || !answer) return
          const onClick = (event: Event) => {
            event.preventDefault()
            if (d.open) {
              gsap.to(answer, {
                height: 0,
                opacity: 0,
                duration: 0.35,
                ease: 'power2.in',
                onComplete: () => {
                  d.open = false
                  gsap.set(answer, { clearProps: 'all' })
                },
              })
            } else {
              d.open = true
              gsap.from(answer, { height: 0, opacity: 0, duration: 0.5, ease: EXPO, clearProps: 'all' })
            }
          }
          summary.addEventListener('click', onClick)
          cleanups.push(() => summary.removeEventListener('click', onClick))
        })
      })

      /* magnetic buttons (pointer devices only) */
      root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((b) => {
        if (!ready(b)) return
        // marked even on touch screens, so the late-content observer never re-counts it
        done.add(b)
        if (!fine) return
        const mx = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' })
        const my = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' })
        const move = (e: PointerEvent) => {
          const r = b.getBoundingClientRect()
          mx((e.clientX - r.left - r.width / 2) * 0.3)
          my((e.clientY - r.top - r.height / 2) * 0.4)
        }
        const leave = () => gsap.to(b, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1.1,.35)' })
        b.addEventListener('pointermove', move)
        b.addEventListener('pointerleave', leave)
        cleanups.push(() => {
          b.removeEventListener('pointermove', move)
          b.removeEventListener('pointerleave', leave)
          gsap.set(b, { clearProps: 'transform' })
        })
      })
    }

    scan(document)

    /* Retry what was not hydrated yet, each frame, for up to 20 seconds. */
    let retry = 0
    const started = performance.now()
    const tick = () => {
      retry = 0
      if (!waiting || performance.now() - started > 20000) return
      scan(main)
      ScrollTrigger.refresh()
      if (waiting) retry = requestAnimationFrame(tick)
    }
    if (waiting) retry = requestAnimationFrame(tick)

    /* footer wordmark and columns rise as the page ends */
    ctx.add(() => {
      const letters = document.querySelectorAll('[data-foot-word] > span')
      if (letters.length) {
        gsap.from(letters, { yPercent: 100, duration: 1.2, ease: EXPO, stagger: 0.05, scrollTrigger: { trigger: main, start: 'bottom 80%' } })
      }
      const cols = document.querySelectorAll('[data-foot-col]')
      if (cols.length) {
        gsap.from(cols, { y: 40, autoAlpha: 0, duration: 1, stagger: 0.08, ease: EXPO, scrollTrigger: { trigger: main, start: 'bottom 85%' } })
      }
    })

    /*
      Late content: client data, dialogs, "show more". Only added elements
      that carry (or hold) a hook not yet wired count. Text and attribute
      changes do not, and neither do re-inserted nodes: a refresh re-wraps
      pinned sections, and an animation may write into the page every frame;
      counting either would refresh every frame, and a refresh resets every
      scroll animation, which repaints, which mutates again.
    */
    const fresh = (el: Element) => el.matches(HOOKS) && !done.has(el)
    let pending = 0
    const observer = new MutationObserver((records) => {
      if (pending) return
      const relevant = records.some((r) =>
        [...r.addedNodes].some((n) => n instanceof Element && (fresh(n) || [...n.querySelectorAll(HOOKS)].some(fresh))),
      )
      if (!relevant) return
      pending = requestAnimationFrame(() => {
        pending = 0
        scan(main)
        ScrollTrigger.refresh()
      })
    })
    observer.observe(main, { childList: true, subtree: true })

    // Fonts change line breaks, and the page settles a frame after mount.
    const refresh = () => ScrollTrigger.refresh()
    const raf = requestAnimationFrame(refresh)
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)

    return () => {
      observer.disconnect()
      if (pending) cancelAnimationFrame(pending)
      cancelAnimationFrame(retry)
      cancelAnimationFrame(raf)
      window.removeEventListener('load', refresh)
      cleanups.forEach((fn) => fn())
      ctx.revert()
      splits.forEach((s) => s.revert())
    }
  }, [pathname])

  return <>{children}</>
}
