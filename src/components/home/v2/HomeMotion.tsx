// src/components/home/v2/HomeMotion.tsx
'use client'

import * as React from 'react'

import { gsap, prefersReduced, ScrollTrigger, SplitText } from '@/lib/gsap'

/**
 * The choreography of the home page's server-rendered bands — services,
 * community, partner up, the app and its feature illustrations — ported from
 * landing-v2's main.js. Renders nothing; it finds its targets by the design's
 * class names inside the page and reverts everything on unmount.
 */
export function HomeMotion() {
  React.useEffect(() => {
    const reduce = prefersReduced()
    const $ = (s: string) => document.querySelector<HTMLElement>(s)
    const $$ = (s: string) => [...document.querySelectorAll<HTMLElement>(s)]
    const splits: SplitText[] = []
    const off: (() => void)[] = []

    const ctx = gsap.context(() => {
      /* ---------- counters (toFixed, 1.6s, power3.out) ---------- */
      const countUp = (nodes: HTMLElement[]) => {
        nodes.forEach((n) => {
          const end = parseFloat(n.dataset.homeCount ?? '')
          const o = { v: 0 }
          if (reduce || Number.isNaN(end)) return
          gsap.to(o, { v: end, duration: 1.6, ease: 'power3.out', onUpdate: () => {
            n.textContent = o.v.toFixed(0)
          } })
        })
      }

      if (!reduce) {
        /* ---------- services: cards tumble in (Jitter-style overshoot) ---------- */
        if ($('.sgrid')) {
          gsap.from('.scard', {
            y: 120,
            rotateX: -35,
            rotateZ: (i: number) => ((i % 3) - 1) * 4,
            autoAlpha: 0,
            transformOrigin: '50% 100%',
            duration: 1.2,
            ease: 'back.out(1.5)',
            stagger: { each: 0.08, grid: [2, 3], from: 'start' },
            scrollTrigger: { trigger: '.sgrid', start: 'top 80%' },
          })
          gsap.from('.services-center', { y: 30, autoAlpha: 0, duration: 0.8, scrollTrigger: { trigger: '.services-center', start: 'top 92%' } })
        }

        /* ---------- community ---------- */
        if ($('.cgrid')) {
          gsap.from('.ccard', { y: 100, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.cgrid', start: 'top 80%' } })
          ScrollTrigger.create({
            trigger: '.cgrid',
            start: 'top 70%',
            once: true,
            onEnter: () => {
              countUp($$('.ui-stats [data-home-count]'))
              gsap.from('.srow', { x: 30, autoAlpha: 0, duration: 0.8, ease: 'back.out(2)', stagger: 0.1 })
            },
          })
        }
        // feed: posts shuffle like a live board
        if ($('.ui-feed .post--1')) {
          const like = '.post--1 .post__m span:first-child'
          const feed = gsap.timeline({ repeat: -1, repeatDelay: 1.2, scrollTrigger: { trigger: '.ui-feed', start: 'top bottom', toggleActions: 'play pause resume pause' } })
          if ($(like)) {
            feed
              .to(like, { scale: 1.35, color: '#FF5A1F', duration: 0.25, ease: 'back.out(4)' }, 1.4)
              .to(like, { scale: 1, color: 'inherit', duration: 0.4 }, '>')
          }
          feed.to('.post--1', { y: -8, rotate: -1.5, duration: 0.5, ease: 'jelly' }, 2.6)
          if ($('.post--2')) {
            feed
              .to('.post--2', { y: -6, opacity: 1, rotate: 1, duration: 0.5, ease: 'jelly' }, '<+=.08')
              .to('.post--1, .post--2', { y: 0, rotate: 0, duration: 0.8, ease: 'elastic.out(1,.5)' }, '>+=.8')
              .to('.post--2', { opacity: 0.7, duration: 0.4 }, '<')
          } else {
            feed.to('.post--1', { y: 0, rotate: 0, duration: 0.8, ease: 'elastic.out(1,.5)' }, '>+=.8')
          }
        }
        // clubs: slide in with springs, pins hop
        if ($('.ui-clubs .club')) {
          const clubs = gsap.timeline({ repeat: -1, repeatDelay: 2.2, scrollTrigger: { trigger: '.ui-clubs', start: 'top bottom', toggleActions: 'play pause resume pause' } })
          clubs
            .from('.club', { x: 60, autoAlpha: 0, scale: 0.9, duration: 0.8, ease: 'back.out(2)', stagger: 0.14 })
            .to('.club svg', { y: -6, duration: 0.25, ease: 'power2.out', stagger: 0.1, yoyo: true, repeat: 1 }, '+=.4')
            .to('.club', { x: -30, autoAlpha: 0, duration: 0.5, ease: 'power3.in', stagger: 0.08 }, '+=2.2')
        }

        /* ---------- partner ---------- */
        const title = $('.partner__title')
        if (title) {
          const pt = new SplitText(title, { type: 'words', mask: 'words' })
          splits.push(pt)
          gsap
            .timeline({ scrollTrigger: { trigger: '.partner__panel', start: 'top 70%' } })
            .fromTo('.partner__panel', { clipPath: 'inset(12% 8% 12% 8% round 40px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.4, ease: 'expo.out', clearProps: 'clipPath' })
            .from('.partner__eyebrow', { y: 14, autoAlpha: 0, duration: 0.6 }, '-=1')
            .from(pt.words, { yPercent: 110, duration: 1, stagger: 0.05, ease: 'expo.out' }, '-=.9')
            .from('.partner__lead', { y: 20, autoAlpha: 0, duration: 0.8 }, '-=.6')
            .from('.partner__btn', { scale: 0.6, autoAlpha: 0, duration: 1, ease: 'elastic.out(1,.5)' }, '-=.5')
            .add(() => $$('.pw').forEach((w, i) => gsap.delayedCall(i * 0.25, () => w.classList.add('is-lit'))), '-=1.2')
          gsap.fromTo('.partner__img', { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.partner__panel', start: 'top bottom', end: 'bottom top', scrub: true } })
          gsap.fromTo('.partner__rings', { scale: 0.7, rotate: -20 }, { scale: 1.1, rotate: 10, ease: 'none', scrollTrigger: { trigger: '.partner__panel', start: 'top bottom', end: 'bottom top', scrub: true } })
        }

        /* ---------- app ---------- */
        if ($('.app')) {
          gsap.fromTo('.phone--app', { rotate: 22, yPercent: 18 }, { rotate: 8, yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.app', start: 'top bottom', end: 'center center', scrub: 1 } })
          gsap.from('.app__plate', { scale: 0.85, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.app', start: 'top 70%' } })
          gsap.from(['.app .soon', '.app__copy .lead'], { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.app__copy', start: 'top 75%' } })
          gsap.from('.feat', { y: 70, scale: 0.9, autoAlpha: 0, duration: 1, ease: 'back.out(1.7)', stagger: 0.1, scrollTrigger: { trigger: '.feats', start: 'top 85%' } })
          gsap.to('.ap-pin--hot', { y: -8, duration: 0.6, yoyo: true, repeat: -1, ease: 'power2.inOut' })
          gsap.to('.ap-route', { strokeDashoffset: -40, duration: 1.4, repeat: -1, ease: 'none' })
          gsap.from('.ap-sheet', { yPercent: 100, duration: 1, ease: 'back.out(1.3)', scrollTrigger: { trigger: '.app__visual', start: 'top 50%' } })
        }

        /* ---------- feature illustrations ---------- */
        if ($('.feats')) {
          gsap.to('.a-plughead', { x: -2, y: -1, rotate: -6, transformOrigin: '50% 50%', duration: 0.07, repeat: -1, yoyo: true, repeatDelay: 1.6, ease: 'steps(1)' })
          gsap.fromTo('.a-cable', { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.4, ease: 'power2.inOut', scrollTrigger: { trigger: '.feats', start: 'top 80%' } })
          gsap.to('.a-trip', { strokeDashoffset: -32, duration: 1.2, repeat: -1, ease: 'none' })
          gsap.fromTo('.a-chip', { x: 10, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.7, ease: 'back.out(2.5)', repeat: -1, yoyo: true, repeatDelay: 1.4 })
        }
      } else {
        $$('.pw').forEach((w) => w.classList.add('is-lit'))
      }

      /* ---------- service cards: pointer-tracked fill + icon redraw ---------- */
      $$('.scard').forEach((c) => {
        const paths = [...c.querySelectorAll('.draw')]
        const ic = c.querySelector('.scard__ic')
        const set = (e: PointerEvent) => {
          const r = c.getBoundingClientRect()
          c.style.setProperty('--mx', `${e.clientX - r.left}px`)
          c.style.setProperty('--my', `${e.clientY - r.top}px`)
        }
        const enter = (e: PointerEvent) => {
          set(e)
          if (!reduce) {
            ctx.add(() => {
              gsap.fromTo(paths, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.08 })
              gsap.fromTo(ic, { rotate: -10, scale: 0.85 }, { rotate: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1.2,.35)' })
            })
          }
        }
        c.addEventListener('pointerenter', enter)
        c.addEventListener('pointermove', set)
        off.push(() => {
          c.removeEventListener('pointerenter', enter)
          c.removeEventListener('pointermove', set)
        })
      })
    })

    return () => {
      off.forEach((fn) => fn())
      ctx.revert()
      splits.forEach((s) => s.revert())
    }
  }, [])

  return null
}
