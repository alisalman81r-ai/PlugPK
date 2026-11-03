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
// defined once, here, for both. The site has one theme, light; the ink bands
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

/* Warm neutrals, "night drive": paper, chalk and stone grounds, ink type.
   50 is paper, 100 chalk, 200 stone, 400 fog, 500 the muted text (6.4:1 on
   white), 900 ink. Every slate-* the site asks for lands on one of them. */
const neutral: Steps = {
  0: SURFACE,
  25: '#FCFBF9',
  50: '#FAF9F6',
  100: '#F2F0EA',
  200: '#E6E3DA',
  300: '#D2CFC5',
  400: '#A3A7AE',
  450: '#80848B',
  500: '#5B5F66',
  600: '#44484E',
  700: '#2E3136',
  800: '#1C1F24',
  900: '#0B0C0E',
  950: '#070809',
}

/* The action scale. 600 is the primary button, ink, and 700 its hover. The
   pale steps are the volt-tinted chips and badges; 400 and 500 are volt
   itself, which is never text on a light ground. */
const brand: Steps = {
  50: '#F7FFE0',
  100: '#F1FFD0',
  200: '#DDF58C',
  300: '#CBEF55',
  400: '#D4FF3A',
  500: '#D4FF3A',
  600: '#0B0C0E',
  700: '#2A2D33',
  800: '#131519',
  900: '#0B0C0E',
  950: '#070809',
}

/* The accent scale, volt at 400 and 500. 600 and 700 are volt ink, the
   readable form of volt as text on light grounds (700 is 8.4:1 on white). */
const accent: Steps = {
  50: '#F7FFE0',
  100: '#F1FFD0',
  200: '#E6FF9A',
  300: '#DDFF6B',
  400: '#D4FF3A',
  500: '#D4FF3A',
  600: '#556E00',
  700: '#3F5200',
  800: '#2E3B00',
  900: '#1E2700',
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

/* Elevation, ink-tinted and soft: e1…e4, and the older names. */
const SHADOWS = {
  e1: '0 1px 2px rgba(11,12,14,0.06), 0 8px 24px -12px rgba(11,12,14,0.18)',
  e2: '0 30px 60px -30px rgba(11,12,14,0.45), 0 12px 24px -12px rgba(11,12,14,0.2)',
  e3: '0 24px 50px -24px rgba(11,12,14,0.35)',
  e4: '0 40px 90px -40px rgba(11,12,14,0.45), 0 12px 30px -16px rgba(11,12,14,0.2)',
  card: '0 1px 2px rgba(11,12,14,0.06), 0 8px 24px -12px rgba(11,12,14,0.18)',
  'card-hover': '0 30px 60px -30px rgba(11,12,14,0.45), 0 12px 24px -12px rgba(11,12,14,0.2)',
  modal: '0 40px 90px -30px rgba(11,12,14,0.55)',
}

/* The brand gradient: ink to a lifted ink, under white type. */
const GRADIENT_BRAND = 'linear-gradient(90deg, #0B0C0E, #2A2D33)'

/* The ink bands: ink, ink-2, ink-3 and a lifted step for hovers. */
const BANDS = { 700: '#2A2D33', 800: '#1C1F24', 900: '#131519', 950: '#0B0C0E' }
const HERO = '#0B0C0E'

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
