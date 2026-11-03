// src/lib/gsap.ts
'use client'

/**
 * The landing-v2 motion kit: GSAP 3.13 with every plugin the design uses,
 * registered once, plus the two custom eases its scripts define.
 *
 * Import gsap and the plugins from here, never from 'gsap' directly, so the
 * registration has always happened. Client components only.
 *
 * The shared, attribute-driven behaviour (smooth scroll, reveals, counters,
 * split headings, magnetic buttons, FAQ, footer wordmark) lives in
 * components/motion/MotionProvider.tsx; read its header for the attributes.
 */

import { gsap } from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

let registered = false

export function registerMotion() {
  if (registered || typeof window === 'undefined') return
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, CustomEase)
  // main.js: CustomEase.create("snap", …) and ("jelly", …)
  CustomEase.create('snap', '0.7, 0, 0.1, 1')
  CustomEase.create('jelly', 'M0,0 C0.14,0 0.24,1.18 0.42,1.12 0.56,1.07 0.62,0.97 0.72,0.99 0.84,1.01 0.9,1 1,1')
  registered = true
}

registerMotion()

/** prefers-reduced-motion, read live. */
export function prefersReduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** A mouse or trackpad: the hover-only effects (magnetic, parallax) need one. */
export function finePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

export { CustomEase, DrawSVGPlugin, gsap, MotionPathPlugin, ScrollTrigger, SplitText }
