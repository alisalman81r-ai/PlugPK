// tailwind.tokens.ts
//
// The colour scales as CSS custom properties.
//
// ── How it works ─────────────────────────────────────────────────────────
//
// Every scale step is a space-separated RGB triple on :root, `--c-<scale>-<step>`,
// and tailwind.config.ts points the colour names at it:
//
//     slate-500  →  rgb(var(--c-neutral-500) / <alpha-value>)
//
// The plain CSS in globals.css reads the same properties, so a colour is
// defined once, here, for both. The site has one theme, light; the pine bands
// (the navbar, the heroes, the footer) are dark grounds inside it.

import colors from 'tailwindcss/colors'

type Steps = Record<string, string>

/** '#0B332C' → '11 51 44', the form `rgb(var(--x) / a)` needs. */
export function triple(value: string): string {
  const h = value.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(' ')
}

/** A card: what bg-white means. */
const SURFACE = '#FFFFFF'

/* Green-tinted neutrals: the palette in tailwind.config.ts, stepped out so
   every slate-* the site asks for has a value. */
const neutral: Steps = {
  0: SURFACE,
  25: '#FAFBFA',
  50: '#F1F4F3',
  100: '#E9EEEC',
  200: '#DCE3E0',
  300: '#BAC2C0',
  400: '#989FA1',
  450: '#727C7A',
  500: '#626D6B',
  600: '#4A5A57',
  700: '#345A53',
  800: '#1A3F38',
  900: '#0B332C',
  950: '#05241E',
}

/* The action scale. 600 is the primary button, forest, and 700 its hover. The
   pale steps are the tinted chips and badges. */
const brand: Steps = {
  50: '#EDFCF8',
  100: '#C4F8EC',
  200: '#A3EBDB',
  300: '#6FDCC6',
  400: '#3FD4BC',
  500: '#26CDB2',
  600: '#0B332C',
  700: '#05241E',
  800: '#041C17',
  900: '#03140F',
  950: '#020D0B',
}

/* The accent scale, turquoise at 500. */
const accent: Steps = {
  50: '#EDFCF8',
  100: '#D8FBF2',
  200: '#C4F8EC',
  300: '#8EEEDA',
  400: '#4FDCC4',
  500: '#26CDB2',
  600: '#159E89',
  700: '#0F7A6A',
  800: '#345A53',
  900: '#0B332C',
}

/* Tailwind's own hues, used for status: red for offline and errors, amber for
   limited, green and emerald for available, blue for the admin's "limited"
   station state. They keep Tailwind's values. */
const STATUS_HUES = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
] as const

export const SCALES: Record<string, Steps> = {
  neutral,
  brand,
  accent,
  ...Object.fromEntries(STATUS_HUES.map((name) => [name, colors[name]])),
}

/** Tailwind colour values for one scale, reading its `--c-` properties. */
export function scaleColors(scale: string): Steps {
  const steps = SCALES[scale]
  if (!steps) throw new Error(`No colour scale named ${scale}`)
  return Object.fromEntries(Object.keys(steps).map((step) => [step, `rgb(var(--c-${scale}-${step}) / <alpha-value>)`]))
}

/**
 * `white`, for the utilities where it means "a surface".
 *
 * bg-white is a card. Faint white is a glaze, not a surface — bg-white/10 on a
 * pine band, border-white/40 on a photograph — and is always plain white. The
 * line is at 0.42, between the two as the site uses them: the glazes run up to
 * /40, and from /45 up white is a surface seen through.
 */
function surfaceColor({ opacityValue }: { opacityValue?: string }): string {
  if (opacityValue === undefined) return 'rgb(var(--c-surface))'
  const alpha = Number(opacityValue)
  if (!Number.isNaN(alpha) && alpha < 0.42) return `rgb(255 255 255 / ${opacityValue})`
  return `rgb(var(--c-surface) / ${opacityValue})`
}

/* Tailwind takes a function as a colour and calls it with the opacity; its
   types only describe strings, so the function is passed through as one. */
export const surface = surfaceColor as unknown as string

/* Elevation, pine-tinted and soft: e1…e4, and the older names. */
const SHADOWS = {
  e1: '0 1px 2px rgba(5,36,30,0.04), 0 2px 8px rgba(5,36,30,0.05)',
  e2: '0 8px 16px rgba(5,36,30,0.06), 0 16px 32px rgba(5,36,30,0.08)',
  e3: '0 8px 32px rgba(5,36,30,0.12)',
  e4: '0 24px 64px rgba(5,36,30,0.20)',
  card: '0 4px 6px rgba(5,36,30,0.05), 0 2px 4px rgba(5,36,30,0.04)',
  'card-hover': '0 20px 25px rgba(5,36,30,0.08), 0 10px 10px rgba(5,36,30,0.04)',
  modal: '0 25px 50px rgba(5,36,30,0.22)',
}

/* The brand gradient: forest to mineral, under white type. */
const GRADIENT_BRAND = 'linear-gradient(90deg, #0B332C, #345A53)'

/* The pine bands. */
const BANDS = { 700: '#345A53', 800: '#1A3F38', 900: '#0B332C', 950: '#05241E' }
const HERO = 'linear-gradient(135deg, #0D1817 0%, #05241E 55%, #0B332C 100%)'

/** Tailwind colour values for the bands (`plug-navy-*`). */
export const bandColors = Object.fromEntries(
  Object.keys(BANDS).map((step) => [step, `rgb(var(--c-band-${step}) / <alpha-value>)`]),
)

/** The custom properties, ready for addBase on :root. */
export function themeVars(): Record<string, string> {
  const vars: Record<string, string> = {
    '--c-surface': triple(SURFACE),
    '--gradient-brand': GRADIENT_BRAND,
  }
  for (const [name, steps] of Object.entries(SCALES)) {
    for (const [step, color] of Object.entries(steps)) vars[`--c-${name}-${step}`] = triple(color)
  }
  for (const [name, shadow] of Object.entries(SHADOWS)) vars[`--shadow-${name}`] = shadow
  for (const [step, color] of Object.entries(BANDS)) vars[`--c-band-${step}`] = triple(color)
  vars['--gradient-hero'] = HERO
  return vars
}
