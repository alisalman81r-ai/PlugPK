// src/components/admin/LoginBackdrop.tsx
'use client'

import * as React from 'react'

/**
 * The gateway: streams of light converging on the point you are trying to
 * enter, with a shockwave where you click.
 *
 * ── Canvas, not WebGL ─────────────────────────────────────────────────
 *
 * The reference for this effect is built on Three.js. It is not used here, and
 * the reason is the page it would sit on: /admin/login is the lightest route in
 * the product at 88 kB of JavaScript, and Three.js is several hundred more —
 * multiplying the cost of a sign-in screen to draw a few hundred moving dots.
 *
 * Everything the effect needs is 2D: points travelling along quadratic curves,
 * a trail behind each, a ring that expands on click. Canvas does all of that in
 * a few kilobytes with no dependency, no WebGL context, and no shader to fail
 * on a machine with software rendering — which an admin signing in from an
 * ordinary office laptop may well have.
 *
 * ── Restraint, because this is an operator's tool ─────────────────────
 *
 * The portal is meant to read as clean and operational rather than flashy, so
 * the effect is deliberately quiet: low-alpha strokes, no colour outside the
 * brand palette, and a vignette that darkens the middle so the card in front
 * keeps its contrast. It should be noticed on the second look, not the first.
 */

/** Brand only: cyan-400, blue-500, and the pale navy-300 as the quiet one. */
const STREAM_COLOURS = ['34, 211, 238', '59, 130, 246', '125, 160, 202'] as const

/** navy-950, the page's own background — what the trails fade back into. */
const GROUND = '2, 16, 36'

interface Stream {
  /** Start, control and end of the quadratic curve, in canvas pixels. */
  x0: number
  y0: number
  cx: number
  cy: number
  x1: number
  y1: number
  colour: string
  /** Progress along the curve, 0 to 1. */
  t: number
  speed: number
  size: number
  /**
   * Where it was last frame.
   *
   * The head is drawn as a line from there to here, not as a dot. Dots alone
   * came out as dashes: a point moving several pixels per frame leaves gaps the
   * trail fade cannot bridge, so the streams read as dotted rather than
   * flowing. Joining the two positions is what makes a stroke.
   */
  px: number
  py: number
}

interface Ripple {
  x: number
  y: number
  /** Radius in pixels; grows until it passes the diagonal. */
  r: number
  max: number
}

export function LoginBackdrop() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let streams: Stream[] = []
    const ripples: Ripple[] = []
    let raf = 0

    /**
     * A stream starts off-screen and ends at the centre.
     *
     * The control point is pushed off the straight line by a signed amount, so
     * the paths bow around the middle instead of spoking into it — which is
     * what makes them read as flowing rather than as a starburst.
     */
    function makeStream(seeded: boolean): Stream {
      const cxMid = width / 2
      const cyMid = height / 2
      const angle = Math.random() * Math.PI * 2
      const radius = Math.max(width, height) * (0.62 + Math.random() * 0.35)

      const x0 = cxMid + Math.cos(angle) * radius
      const y0 = cyMid + Math.sin(angle) * radius

      // Perpendicular offset, sized against the journey so short paths bow less.
      const bow = (Math.random() - 0.5) * radius * 0.9
      const mx = (x0 + cxMid) / 2
      const my = (y0 + cyMid) / 2

      const stream: Stream = {
        x0,
        y0,
        cx: mx + Math.cos(angle + Math.PI / 2) * bow,
        cy: my + Math.sin(angle + Math.PI / 2) * bow,
        x1: cxMid,
        y1: cyMid,
        colour: STREAM_COLOURS[Math.floor(Math.random() * STREAM_COLOURS.length)]!,
        // Seeded on first fill so the screen is already alive on arrival
        // rather than filling in from the edges while somebody watches.
        t: seeded ? Math.random() : 0,
        speed: 0.0016 + Math.random() * 0.0034,
        size: 0.7 + Math.random() * 1.5,
        px: 0,
        py: 0,
      }

      // Start the previous position on the curve, so the first frame after a
      // respawn draws a short stroke rather than one from wherever the last
      // particle happened to die.
      const [sx, sy] = pointAt(stream, stream.t)
      stream.px = sx
      stream.py = sy
      return stream
    }

    function pointAt(s: Stream, t: number): [number, number] {
      const inv = 1 - t
      const a = inv * inv
      const b = 2 * inv * t
      const c = t * t
      return [a * s.x0 + b * s.cx + c * s.x1, a * s.y0 + b * s.cy + c * s.y1]
    }

    function resize() {
      // Capped device pixel ratio: past 2 the cost doubles again for a
      // difference nobody can see in a blurred glow.
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas!.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Count scales with area, so a phone does not run a desktop's workload.
      const count = Math.round(Math.min(190, Math.max(45, (width * height) / 11000)))
      streams = Array.from({ length: count }, () => makeStream(true))

      ctx!.fillStyle = `rgb(${GROUND})`
      ctx!.fillRect(0, 0, width, height)
    }

    /** One frame: fade what is there, advance everything, draw it. */
    function draw(animate: boolean) {
      // The fade IS the trail. Painting the ground back over the frame at low
      // alpha leaves each point's recent path behind it, which costs one
      // fillRect instead of storing history per particle.
      ctx!.globalCompositeOperation = 'source-over'
      ctx!.fillStyle = `rgba(${GROUND}, ${animate ? 0.14 : 1})`
      ctx!.fillRect(0, 0, width, height)

      // Additive, so overlapping streams brighten where they converge —
      // the centre earns its glow from the geometry rather than a gradient.
      ctx!.globalCompositeOperation = 'lighter'

      for (const s of streams) {
        if (animate) {
          s.t += s.speed
          if (s.t >= 1) Object.assign(s, makeStream(false))
        }

        const [x, y] = pointAt(s, s.t)

        // Fade in from the edge and out into the centre, so nothing pops.
        const edge = Math.min(s.t / 0.14, 1)
        const core = 1 - Math.max(0, (s.t - 0.82) / 0.18)
        const alpha = 0.55 * edge * core

        // The stroke is the stream. Round caps so consecutive frames join
        // without a visible seam at each end.
        ctx!.strokeStyle = `rgba(${s.colour}, ${alpha})`
        ctx!.lineWidth = s.size * 1.5
        ctx!.lineCap = 'round'
        ctx!.beginPath()
        ctx!.moveTo(s.px, s.py)
        ctx!.lineTo(x, y)
        ctx!.stroke()

        // A brighter head, so the leading edge reads as the thing travelling
        // and the stroke behind it as where it has been.
        ctx!.fillStyle = `rgba(${s.colour}, ${alpha * 0.9})`
        ctx!.beginPath()
        ctx!.arc(x, y, s.size, 0, Math.PI * 2)
        ctx!.fill()

        s.px = x
        s.py = y
      }

      /*
        The shockwave.

        Two rings a little apart rather than one, which is what makes it read
        as a wave passing through instead of a circle being drawn. It decays as
        it grows, so the energy is obviously spreading out.

        The first version was a single ring at 0.4 alpha and was invisible
        against the vignette over the middle of the page — the one place
        somebody is most likely to click.
      */
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const r = ripples[i]!
        // Linear, and slow enough to be seen. An eased growth toward a
        // screen-sized radius spent almost all of its life very large and very
        // faint — measured reaching 400px within 170ms, by which point it was
        // a 0.24-alpha hairline stretched across the whole page and read as
        // nothing at all.
        r.r += 13
        const life = 1 - r.r / r.max
        if (life <= 0.01) {
          ripples.splice(i, 1)
          continue
        }

        ctx!.strokeStyle = `rgba(34, 211, 238, ${life * 0.7})`
        ctx!.lineWidth = Math.max(0.6, life * 2.4)
        ctx!.beginPath()
        ctx!.arc(r.x, r.y, r.r, 0, Math.PI * 2)
        ctx!.stroke()

        // The trailing edge, dimmer and just behind.
        if (r.r > 46) {
          ctx!.strokeStyle = `rgba(59, 130, 246, ${life * 0.32})`
          ctx!.lineWidth = Math.max(0.4, life * 1.5)
          ctx!.beginPath()
          ctx!.arc(r.x, r.y, r.r - 34, 0, Math.PI * 2)
          ctx!.stroke()
        }
      }

      ctx!.globalCompositeOperation = 'source-over'
    }

    function loop() {
      draw(true)
      raf = requestAnimationFrame(loop)
    }

    function onClick(event: MouseEvent) {
      if (reduced) return
      const rect = canvas!.getBoundingClientRect()
      ripples.push({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        r: 0,
        // A local shockwave, not a screen-wide circle: it should look like
        // something happened where the pointer was.
        max: 340,
      })
      // A queue of rings from frantic clicking is noise, not feedback.
      if (ripples.length > 4) ripples.shift()
    }

    function onVisibility() {
      // Nothing to animate behind another tab. Without this the loop keeps
      // running on a page nobody is looking at.
      cancelAnimationFrame(raf)
      if (!document.hidden && !reduced) raf = requestAnimationFrame(loop)
    }

    resize()

    if (reduced) {
      // One still frame. The composition survives; the motion does not.
      draw(false)
    } else {
      raf = requestAnimationFrame(loop)
    }

    // Listened for on the window rather than the canvas: the canvas sits behind
    // the form with pointer-events off, so it must never intercept a click
    // meant for the password field.
    window.addEventListener('click', onClick)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('click', onClick)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full" />
      {/*
        The vignette is not decoration, it is what keeps the form readable.
        Streams converge on the centre, which is exactly where the card sits, so
        the middle is darkened back toward the page's own ground. Without it the
        brightest part of the animation is directly behind the input.
      */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(2,16,36,0.92)_0%,rgba(2,16,36,0.65)_38%,rgba(2,16,36,0.25)_70%,transparent_100%)]" />
    </div>
  )
}
