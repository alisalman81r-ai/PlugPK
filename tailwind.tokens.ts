// tailwind.tokens.ts
//
// The colour scales as CSS custom properties, so the whole site can change
// theme by swapping their values rather than by adding `dark:` to every one of
// its ~3,400 colour classes.
//
// ── How it works ─────────────────────────────────────────────────────────
//
// Every scale step is a space-separated RGB triple on :root, `--c-<scale>-<step>`,
// and tailwind.config.ts points the colour names at it:
//
//     slate-500  →  rgb(var(--c-neutral-500) / <alpha-value>)
//
// `.dark` on <html> redeclares the triples. A class keeps doing the job it
// already does — slate-900 is still "body type", slate-500 "muted type",
// bg-white "a card" — and the colour that job needs comes from the theme.
//
// The dark values are the app's (public/app-prototype/app.css, DESIGN.md §2.9),
// so the site and the app look like one product. Where the app uses a
// see-through colour — its mint hairlines, its tinted chips — the step carries
// an alpha too, `--c-<scale>-<step>-a`, which multiplies any opacity modifier.
//
// Some scales are read differently as type than as a fill. bg-plug-blue-600 is
// the primary button and text-plug-blue-600 a link: in dark mode the button
// turns turquoise, as the app's does, while the link turns a lighter turquoise
// so it can be read on a card. Those steps get a second property,
// `--t-<scale>-<step>`, used only by text utilities.
//
// ── Dark islands ─────────────────────────────────────────────────────────
//
// The navbar, the heroes and the footer are pine in both themes. They were
// designed as dark grounds inside a light page, and their contents use the
// light-theme values on purpose (a white button with pine type, slate-300 for a
// quiet line). ISLANDS lists those grounds; inside one, the light values are
// restored, so a dark band renders exactly as it always has.
//
// `.theme-light` does the same for a ground that is light in both themes: the
// car photographs are shot on white, so their panel stays a light studio in
// the dark theme and everything drawn on it keeps its light values.

import colors from 'tailwindcss/colors'

type Steps = Record<string, string>

/** A colour, optionally with an alpha: '#26CDB2' or '#26CDB2/0.12'. */
function parse(value: string) {
  const [color = value, alpha] = value.split('/')
  return { color, alpha: alpha ?? '1' }
}

interface Scale {
  /** Light-theme values — the palette as it has always been. */
  light: Steps
  /** Dark-theme values, for every step that changes. May carry an alpha. */
  dark?: Steps
  /** Dark-theme values for text utilities only, where type and fill diverge. */
  darkText?: Steps
}

/** '#0B332C' → '11 51 44', the form `rgb(var(--x) / a)` needs. */
export function triple(value: string): string {
  const h = value.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(' ')
}

/* ── The dark ground ─────────────────────────────────────────────────────

   Green-tinted, like the light theme: the page is near-black pine, not grey.
   Cards sit one step lighter than the page — in the dark, elevation reads as
   light, not as shadow. */
export const SURFACE = { light: '#FFFFFF', dark: '#0F1D1A' }

/* Green-tinted neutrals. The light end is the palette in tailwind.config.ts;
   the dark end inverts it, so slate-900 type becomes near-white and slate-50
   grounds become the page. Step by step, the app's names:

     50 --bg       0 --surface       25 --surface-2     100 --sunken
     200 --line    300 --line-strong  (mint, see-through, as the app draws them)
     400 --faint   500 --muted       700 --fg-2         900 --fg

   Contrast on the card (#0F1D1A): 900 15.2:1 · 700 11.0:1 · 500 6.7:1. 400 is
   the app's faint step, 4.0:1 — for icons and placeholders, as slate-400 is in
   the light theme (2.6:1 on white), not for reading. */
const neutral: Scale = {
  light: {
    0: '#FFFFFF',
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
  },
  dark: {
    0: SURFACE.dark,
    25: '#132522',
    50: '#08110F',
    100: '#182C28',
    200: '#C4F8EC/0.09',
    300: '#C4F8EC/0.18',
    400: '#6B7D78',
    450: '#7F918C',
    500: '#93A5A0',
    600: '#ABBCB7',
    700: '#C2D1CD',
    800: '#DCE6E3',
    900: '#EAF2EF',
    950: '#F5F9F8',
  },
}

/* The action scale. 600 is the primary button: forest in the light theme,
   turquoise in the dark — the app's --primary — with pine type on it (the
   label colour is --on-brand, see BRAND_VARS). 700, its hover, is the lighter
   turquoise. As text, 600 and 700 are the app's --accent-text and --tint-fg
   (10.2:1 and 12.7:1 on a card). The pale steps are the app's --tint: the
   accent at 12%, and its edge at 38%. */
const brand: Scale = {
  light: {
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
  },
  dark: {
    50: '#26CDB2/0.12',
    100: '#26CDB2/0.18',
    200: '#26CDB2/0.38',
    300: '#26CDB2/0.55',
    600: '#26CDB2',
    700: '#4FDCC4',
    800: '#8EEEDA',
    900: '#0C231E',
    950: '#0A1714',
  },
  darkText: {
    600: '#4FDCC4',
    700: '#8EEEDA',
    800: '#A9F1E3',
    900: '#C4F8EC',
    950: '#DDFBF4',
  },
}

/* The accent scale, turquoise at 500. Same treatment: pale tints become the
   accent seen through, the deep cuts that exist to be read on white become
   bright as type. */
const accent: Scale = {
  light: {
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
  },
  dark: {
    50: '#26CDB2/0.12',
    100: '#26CDB2/0.16',
    200: '#26CDB2/0.22',
    300: '#26CDB2/0.38',
  },
  darkText: {
    600: '#4FDCC4',
    700: '#8EEEDA',
    800: '#A9F1E3',
    900: '#C4F8EC',
  },
}

/* Tailwind's own hues, used for status: red for offline and errors, amber for
   limited, green and emerald for available, blue for the admin's "limited"
   station state. The pattern on every badge is a 50 ground, a 200 border and
   600-800 type, so those are the steps that move — to the app's --ok, --warn
   and --err sets: the hue at 12% behind, 30% for the edge, 400 for the type.
   The solid middle (400-600 as fills, with white type) stays as it is. */
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

function statusScale(name: (typeof STATUS_HUES)[number]): Scale {
  const hue = colors[name]
  const wash = (alpha: number) => `${hue[500]}/${alpha}`
  return {
    light: hue,
    dark: { 50: wash(0.12), 100: wash(0.16), 200: wash(0.3), 300: wash(0.42) },
    darkText: { 500: hue[400], 600: hue[400], 700: hue[300], 800: hue[200], 900: hue[100], 950: hue[50] },
  }
}

export const SCALES: Record<string, Scale> = {
  neutral,
  brand,
  accent,
  ...Object.fromEntries(STATUS_HUES.map((name) => [name, statusScale(name)])),
}

/** Tailwind colour values for one scale, reading `--c-` (or `--t-` for text). */
export function scaleColors(scale: string, forText = false): Steps {
  const entry = SCALES[scale]
  if (!entry) throw new Error(`No colour scale named ${scale}`)
  const { light, dark, darkText } = entry
  return Object.fromEntries(
    Object.keys(light).map((step) => {
      if (forText && darkText?.[step]) return [step, `rgb(var(--t-${scale}-${step}) / <alpha-value>)`]
      const name = `--c-${scale}-${step}`
      // Only steps that are see-through in some theme pay for the calc().
      return dark?.[step]?.includes('/')
        ? [step, `rgb(var(${name}) / calc(<alpha-value> * var(${name}-a)))`]
        : [step, `rgb(var(${name}) / <alpha-value>)`]
    }),
  )
}

/**
 * `white`, for the utilities where it means "a surface".
 *
 * bg-white is a card, so it follows the theme. Faint white is a glaze, not a
 * surface — bg-white/10 on a pine band, border-white/40 on a photograph — and
 * has to stay white, or the frosted chips on every hero would turn into dark
 * smudges. The line is at 0.42, between the two as the site uses them: the
 * glazes run up to /40, and from /45 up white is a surface seen through (the
 * bg-white/45 panels on the compare page, a white/60 edge on a glass card).
 * text-white is not routed through here and is white in both themes.
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

/* Elevation. In the light theme these are pine-tinted and soft. On a dark page
   a soft shadow is invisible, so the dark set is black and stronger — the
   app's --shadow-1…4 for e1…e4. */
const SHADOWS = {
  light: {
    e1: '0 1px 2px rgba(5,36,30,0.04), 0 2px 8px rgba(5,36,30,0.05)',
    e2: '0 8px 16px rgba(5,36,30,0.06), 0 16px 32px rgba(5,36,30,0.08)',
    e3: '0 8px 32px rgba(5,36,30,0.12)',
    e4: '0 24px 64px rgba(5,36,30,0.20)',
    card: '0 4px 6px rgba(5,36,30,0.05), 0 2px 4px rgba(5,36,30,0.04)',
    'card-hover': '0 20px 25px rgba(5,36,30,0.08), 0 10px 10px rgba(5,36,30,0.04)',
    modal: '0 25px 50px rgba(5,36,30,0.22)',
  },
  dark: {
    e1: '0 1px 2px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.25)',
    e2: '0 8px 16px rgba(0,0,0,0.30), 0 16px 32px rgba(0,0,0,0.30)',
    e3: '0 8px 32px rgba(0,0,0,0.45)',
    e4: '0 24px 64px rgba(0,0,0,0.60)',
    card: '0 4px 6px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.20)',
    'card-hover': '0 20px 25px rgba(0,0,0,0.40), 0 10px 10px rgba(0,0,0,0.25)',
    modal: '0 25px 50px rgba(0,0,0,0.60)',
  },
}

export const SHADOW_NAMES = Object.keys(SHADOWS.light) as (keyof typeof SHADOWS.light)[]

/* What goes on the brand fill, and the brand gradient. The primary button's
   label is white on forest in the light theme and pine on turquoise in the
   dark, as the app's --on-primary is. --on-brand-hover is the label once the
   button turns turquoise under the pointer: forest, or pine. */
const BRAND_VARS = {
  light: {
    '--on-brand': '255 255 255',
    '--on-brand-hover': '11 51 44',
    '--gradient-brand': 'linear-gradient(90deg, #0B332C, #345A53)',
  },
  dark: {
    '--on-brand': '5 36 30',
    '--on-brand-hover': '5 36 30',
    '--gradient-brand': 'linear-gradient(90deg, #26CDB2, #4FDCC4)',
  },
}

/* The pine bands, the app's --band-1…3. They are dark in both themes but sit a
   shade deeper and greyer in the dark one, as the app's do. They are not reset
   inside an island — they are what the islands are made of. */
const BANDS = {
  light: { 700: '#345A53', 800: '#1A3F38', 900: '#0B332C', 950: '#05241E' },
  dark: { 700: '#2B4D45', 800: '#173A33', 900: '#10332C', 950: '#0C231E' },
}
const HERO = {
  light: 'linear-gradient(135deg, #0D1817 0%, #05241E 55%, #0B332C 100%)',
  dark: 'linear-gradient(135deg, #0A1714 0%, #0C231E 55%, #10332C 100%)',
}

/** Tailwind colour values for the bands (`plug-navy-*`). */
export const bandColors = Object.fromEntries(
  Object.keys(BANDS.light).map((step) => [step, `rgb(var(--c-band-${step}) / <alpha-value>)`]),
)

/**
 * The custom properties for one theme, ready for addBase. `island` leaves out
 * the bands, for the light reset inside a dark ground (see ISLANDS).
 */
export function themeVars(theme: 'light' | 'dark', { island = false } = {}): Record<string, string> {
  const vars: Record<string, string> = {
    '--c-surface': triple(SURFACE[theme]),
    ...BRAND_VARS[theme],
  }
  for (const [name, scale] of Object.entries(SCALES)) {
    for (const [step, light] of Object.entries(scale.light)) {
      const { color, alpha } = parse(theme === 'dark' ? (scale.dark?.[step] ?? light) : light)
      vars[`--c-${name}-${step}`] = triple(color)
      if (scale.dark?.[step]?.includes('/')) vars[`--c-${name}-${step}-a`] = alpha
      if (scale.darkText?.[step]) {
        vars[`--t-${name}-${step}`] = triple(theme === 'dark' ? scale.darkText[step] : light)
      }
    }
  }
  for (const name of SHADOW_NAMES) vars[`--shadow-${name}`] = SHADOWS[theme][name]
  if (!island) {
    for (const [step, color] of Object.entries(BANDS[theme])) vars[`--c-band-${step}`] = triple(color)
    vars['--gradient-hero'] = HERO[theme]
  }
  return vars
}

/**
 * Grounds that look the same in both themes. Inside one, the light-theme
 * values apply, so the band and everything on it look as they always have.
 * `.theme-island` is the opt-in for a dark ground set with an arbitrary colour,
 * `.theme-light` for a ground that stays light (see the note at the top).
 */
export const ISLANDS = [
  '.theme-island',
  '.theme-light',
  '.bg-plug-navy-700',
  '.bg-plug-navy-800',
  '.bg-plug-navy-900',
  '.bg-plug-navy-950',
  '.bg-gradient-hero',
  '.bg-gradient-dark',
  '.gradient-hero-bg',
  '.glass-dark',
  '.bg-dark-base',
  '.bg-dark-elevated',
  '.bg-dark-card',
  '.bg-slate-900',
  '.bg-slate-950',
]
