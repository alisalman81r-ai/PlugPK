// src/components/map/StationPin.tsx
'use client'

import * as React from 'react'

import { Zap } from '@/components/ui/icons'

import { FAST_CHARGER_KW } from '@/lib/charging'
import { gsap, prefersReduced } from '@/lib/gsap'

import { useIsoLayoutEffect } from './motion'
import type { Station } from '@/lib/types'
import { cn, getMaxPower } from '@/lib/utils'

/*
  ── Coloured by speed, not by "status" ─────────────────────────────────

  Pins used to be blue, amber or grey for available / limited / offline, with
  a pulse ring on the "available" ones and a legend promising what each colour
  meant. plugpk has no live connection to any charger — the FAQ says so — and
  the status column only changes when somebody edits it, so the colours were a
  live-availability claim nothing stood behind.

  Speed is a fact about the hardware. Pins are now split at FAST_CHARGER_KW,
  the same threshold the home page's map uses, so the two maps read alike.
*/

type PinKind = 'fast' | 'standard'

function pinKind(station: Station): PinKind {
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  return maxPower >= FAST_CHARGER_KW ? 'fast' : 'standard'
}

const PIN_COLOR: Record<PinKind, string> = {
  fast: 'bg-ink',
  standard: 'bg-white ring-[1.5px] ring-inset ring-ink/35',
}

/**
 * The map legend, defined here rather than on the page.
 *
 * A legend that lists its own colours is a legend that goes stale the first
 * time a pin changes — and a wrong legend is worse than none, because the
 * reader trusts it. This reads the pin colours themselves.
 */
export const PIN_LEGEND: { key: PinKind; label: string; colorClass: string }[] = [
  { key: 'fast', label: `${FAST_CHARGER_KW} kW+`, colorClass: PIN_COLOR.fast },
  { key: 'standard', label: `Under ${FAST_CHARGER_KW} kW`, colorClass: PIN_COLOR.standard },
]

/** The marker's native tooltip and accessible name: what it is and how fast. */
export function pinTitle(station: Station): string {
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  return maxPower > 0 ? `${station.name} — up to ${maxPower} kW` : station.name
}

/**
 * page-map.js renderPins: every marker that appears pops its body in —
 * from { scale: 0.2, opacity: 0 }, 0.55s, back.out(2.2) — after a random
 * 0–0.15s when the pins were re-rendered for new data (load, a filter), at
 * once when a camera move regrouped them.
 */
function usePinEntrance(ref: React.RefObject<HTMLElement>, force: boolean) {
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReduced()) return
    const tween = gsap.from(el, {
      scale: 0.2,
      opacity: 0,
      duration: 0.55,
      ease: 'back.out(2.2)',
      delay: force ? Math.random() * 0.15 : 0,
      clearProps: 'transform,opacity,scale',
    })
    return () => {
      tween.kill()
      gsap.set(el, { clearProps: 'transform,opacity,scale' })
    }
    // On mount only: a marker that stays is not popped again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** .mpin__body: transform .35s spring, background .25s, color .25s, box-shadow .3s. */
const PIN_BODY_TRANSITION =
  '[transition:transform_.35s_cubic-bezier(.34,1.56,.64,1),background-color_.25s,color_.25s,box-shadow_.3s,border-color_.25s]'

export interface StationPinProps {
  station: Station
  isSelected: boolean
  /** Whether this pin arrived with new data (random delay) rather than a camera move. */
  force?: boolean
}

/**
 * The marker visual, shared by both map engines so a pin looks identical
 * whether the page is running on Google or the keyless fallback. Only the
 * surrounding <Marker> wrapper differs between them.
 *
 * The pill carries peak power, so the map answers "how fast" without
 * anything having to be opened. Ink for 60 kW+, white for slower, volt for the
 * one that is selected — the design's one volt moment on the map.
 */
export function StationPin({ station, isSelected, force = true }: StationPinProps) {
  const bodyRef = React.useRef<HTMLSpanElement>(null)
  usePinEntrance(bodyRef, force)
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  const fast = pinKind(station) === 'fast'

  const body = isSelected
    ? 'bg-volt text-ink border-ink shadow-[0_0_0_4px_rgba(212,255,58,.45),0_0_0_6px_#0B0C0E,0_14px_26px_-10px_rgba(11,12,14,.6)]'
    : fast
      ? 'bg-ink text-white border-ink shadow-[0_8px_18px_-8px_rgba(11,12,14,.6)]'
      : 'bg-white text-ink border-ink/30 shadow-[0_8px_18px_-10px_rgba(11,12,14,.45)]'

  return (
    <span
      className={cn(
        'group relative flex cursor-pointer flex-col items-center pb-2',
        // Shadows rather than filter: drop-shadow — a filter on every pin is
        // repainted on every frame of a pan; a box-shadow is not.
        'origin-bottom transition-transform duration-[350ms] ease-spring motion-reduce:transition-none',
        isSelected ? '-translate-y-[3px] scale-[1.12]' : 'hover:-translate-y-[3px] hover:scale-[1.06]',
      )}
    >
      {/* The station's name, raised above the selected pin. */}
      <span
        className={cn(
          'pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 max-w-[220px] -translate-x-1/2 truncate whitespace-nowrap',
          'rounded-full bg-ink px-3 py-1.5 text-xs font-semibold leading-tight text-white shadow-e2',
          'transition-[opacity,transform] duration-200 motion-reduce:transition-none',
          isSelected ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
        )}
      >
        {station.name}
      </span>

      <span
        ref={bodyRef}
        className={cn(
          'relative flex h-8 items-center gap-[5px] rounded-full border-[1.5px] pl-[4px] pr-[11px]',
          PIN_BODY_TRANSITION,
          body,
        )}
      >
        <span
          className={cn(
            'grid h-[23px] w-[23px] shrink-0 place-items-center rounded-full',
            isSelected ? 'bg-ink text-volt' : fast ? 'bg-volt/[0.14] text-volt' : 'bg-chalk text-ink',
          )}
        >
          <Zap size={12} className="fill-current" aria-hidden="true" />
        </span>
        {maxPower > 0 ? (
          <span className="font-mono text-[13px] font-bold leading-none tracking-[-0.01em]">
            {maxPower}
            <span className="ml-0.5 text-[10.5px] font-semibold opacity-70">kW</span>
          </span>
        ) : null}
        {/* A turned square under the pill, so the pin points at its coordinate. */}
        <span
          aria-hidden="true"
          className={cn(
            'absolute -bottom-[6px] left-1/2 -ml-[5px] h-2.5 w-2.5 rotate-45 rounded-br-[3px] border-b-[1.5px] border-r-[1.5px]',
            isSelected ? 'border-ink bg-volt' : fast ? 'border-ink bg-ink' : 'border-ink/30 bg-white',
          )}
        />
      </span>
    </span>
  )
}

/** Pins that would overlap, merged into one bubble with a count; a click zooms in. */
export function ClusterPin({ count, force = true }: { count: number; force?: boolean }) {
  const bodyRef = React.useRef<HTMLSpanElement>(null)
  usePinEntrance(bodyRef, force)
  return (
    <span
      ref={bodyRef}
      className={cn(
        'flex h-9 cursor-pointer items-center gap-[7px] rounded-full bg-ink pl-[6px] pr-[14px] text-white',
        'shadow-[0_0_0_5px_rgba(11,12,14,.12),0_10px_22px_-8px_rgba(11,12,14,.6)]',
        // .mpin:hover .mpin__body: translateY(-3px) scale(1.06), on the body's own transition.
        'origin-bottom hover:-translate-y-[3px] hover:scale-[1.06] motion-reduce:transition-none',
        PIN_BODY_TRANSITION,
      )}
    >
      <span className="grid h-[25px] w-[25px] place-items-center rounded-full bg-volt text-ink">
        <Zap size={12} className="fill-current" aria-hidden="true" />
      </span>
      <span className="font-mono text-[15px] font-bold leading-none">{count}</span>
      <span className="font-mono text-[10.5px] font-semibold leading-none text-white/70">stations</span>
    </span>
  )
}

/** page-map.css .mme::before: a ring that grows (scale .3 → 1.6) and fades, 2.2s e-out, forever. */
const MME_KEYFRAMES = '@keyframes mme{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}'

/** The pulsing dot marking the visitor's own position. */
export function UserLocationPin() {
  return (
    <span className="relative flex h-[22px] w-[22px] items-center justify-center">
      <style>{MME_KEYFRAMES}</style>
      <span
        aria-hidden="true"
        className="absolute -inset-2.5 animate-[mme_2.2s_cubic-bezier(.16,1,.3,1)_infinite] rounded-full border border-ink/25 bg-volt/50 motion-reduce:animate-none"
      />
      <span className="relative h-3.5 w-3.5 rounded-full border-[3px] border-white bg-ink shadow-[0_0_0_1.5px_#0B0C0E]" />
    </span>
  )
}
