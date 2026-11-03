// src/components/cars/car-ui.ts
//
// Class strings the car pages share (landing-v2's .car__stage and .car__chip).
// A plain module rather than exports from a 'use client' file, so the server
// components (the detail page) receive the strings and not client references.

/**
 * The soft lit stage behind a studio cut-out. The photograph is drawn with
 * mix-blend-multiply, so its white ground drops into the stage; a faint dot
 * floor and a contact shadow under the car are the two pseudo-elements.
 */
export const STAGE =
  'relative isolate overflow-hidden bg-[radial-gradient(120%_90%_at_50%_18%,#FFFFFF_0%,#F6F5F1_48%,#E9E7E0_100%)] ' +
  'before:absolute before:inset-0 before:-z-[1] before:bg-[radial-gradient(rgba(11,12,14,.06)_1px,transparent_1.5px)] before:bg-[length:14px_14px] before:[mask-image:linear-gradient(transparent_55%,#000)] ' +
  'after:absolute after:inset-x-[18%] after:bottom-[13%] after:-z-[1] after:h-[10%] after:rounded-[50%] after:bg-[radial-gradient(closest-side,rgba(11,12,14,.16),transparent)] after:[transition:transform_.6s_cubic-bezier(.16,1,.3,1),opacity_.6s]'

/*
  The card's hover (landing-v2 .car:hover and its parts), for any element that
  is a `group` holding a STAGE and a CarPhoto.

  CAR_HOVER    the card lifts 4px — the CSS translate property, as the design
               writes it, over 0.5s on --e-out with the shadow; the border
               eases over 0.3s
  STAGE_HOVER  the contact shadow under the car slides and widens with it
  PHOTO_HOVER  the car itself slides 3% and grows 4.5% (0.7s, set by CarPhoto)
*/
export const CAR_HOVER =
  '[transition:translate_.5s_cubic-bezier(.16,1,.3,1),box-shadow_.5s_cubic-bezier(.16,1,.3,1),border-color_.3s] hover:[translate:0_-4px] hover:border-ink/[0.16] hover:shadow-e2'
export const STAGE_HOVER = 'group-hover:after:translate-x-[3%] group-hover:after:scale-x-[1.06]'
export const PHOTO_HOVER = 'group-hover:translate-x-[3%] group-hover:scale-[1.045]'

/**
 * On each item of a car grid run by useCarEntrance (car-motion.tsx): hidden
 * before the script picks it up, so a server-rendered grid does not show and
 * then vanish. Only with script and with motion welcome — the same rule
 * globals.css applies to [data-reveal].
 */
export const CAR_ENTRANCE_ITEM = 'motion-safe:[html.js_&]:opacity-0'

/** A small mono label on the stage. */
export const STAGE_CHIP =
  'inline-flex h-6 items-center rounded-full border px-[9px] font-mono text-[10.5px] font-semibold uppercase leading-none tracking-[0.1em]'

export type StageChipTone = 'powertrain' | 'indicative' | 'noplug' | 'plain'

export const STAGE_CHIP_TONE: Record<StageChipTone, string> = {
  powertrain: 'border-ink bg-ink text-white',
  indicative: 'border-[#FFE0A3] bg-[#FFF6E3] text-[#8A5300]',
  noplug: 'border-[#FFCDBC] bg-[#FFECE6] text-[#B42E05]',
  plain: 'border-ink/10 bg-white text-ink',
}

/** A price qualifier — "(indicative)", "(estimated)" — inside the display string. */
export function priceQualifier(display: string): string | null {
  const match = /\(([^)]*\b(?:indicative|estimated)\b[^)]*)\)/i.exec(display)
  return match?.[1]?.trim() ?? null
}
