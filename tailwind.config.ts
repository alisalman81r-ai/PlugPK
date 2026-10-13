// tailwind.config.ts
import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

import { ISLANDS, bandColors, scaleColors, surface, themeVars } from './tailwind.tokens'

/*
  ── The palette ─────────────────────────────────────────────────────────

  Ten colours, taken from a fintech reference and applied the way it applies
  them: a mist-grey page, deep forest green for type and primary actions, pine
  for dark grounds, and turquoise kept for the small moments that should catch
  the eye — hover, focus, the active item, a highlighted word.

    #E9EEEC  Mist           page ground, quiet fills
    #0B332C  Deep Forest    headings, body type, primary buttons
    #0D1817  Ink            the darkest surface
    #05241E  Pine           dark bands, nav menus, modals
    #989FA1  Cool Gray      placeholders, decorative icons
    #727C7A  Slate          borders that need to be seen, large muted type
    #BAC2C0  Silver Sage    borders, dividers, disabled
    #345A53  Mineral        secondary type, borders on dark
    #C4F8EC  Aero Mint      tinted badges and chips
    #26CDB2  Turquoise      the accent

  ── Why the scales are redefined rather than renamed ────────────────────

  The site asks for `slate-*`, `plug-blue-*` and `plug-cyan-*` about 3,400
  times. Pointing those names at the new palette moves every page at once and
  keeps each shade doing the job it already does — slate-500 is still "muted
  text", plug-blue-600 is still "the action colour" — so no component had to
  learn a new vocabulary to change colour.

  ── Contrast rules this scale is built around ───────────────────────────

  Turquoise on white is 2.0:1 and white on turquoise is the same. So turquoise
  is never a text colour on light grounds and never carries white text: a
  turquoise button takes forest type (6.9:1). On forest or pine it is fine as
  text (6.9:1 and 8.2:1).

  #727C7A is 4.3:1 on white, a hair under the 4.5:1 AA needs for body-size
  text, and 3.7:1 on Mist. It sits at slate-450, for large type and borders.
  slate-500 — the muted-text step, asked for over 600 times — is a deeper cut
  of the same grey at 5.4:1 on white and 4.6:1 on Mist.
*/

/* The scales themselves — light values above, dark values beside them — live
   in tailwind.tokens.ts as CSS custom properties, which is what lets the site
   change theme without a `dark:` variant on every class. See the note there. */
const neutral = scaleColors('neutral')
const brand = scaleColors('brand')
const accent = scaleColors('accent')

/* As type, some steps read differently in the dark theme: a forest link has to
   turn bright, where a forest button only lifts off the page. */
const neutralText = scaleColors('neutral', true)
const brandText = scaleColors('brand', true)
const accentText = scaleColors('accent', true)

/* Tailwind's own hues, which carry status, made theme-aware the same way. */
const STATUS = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const status = Object.fromEntries(STATUS.map((name) => [name, scaleColors(name)]))
const statusText = Object.fromEntries(STATUS.map((name) => [name, scaleColors(name, true)]))

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: neutral,
        'plug-slate': neutral,
        'plug-blue': brand,
        'plug-cyan': accent,
        /* Decorative uses of Tailwind's own cyan, sky and teal follow the
           accent. `blue` is left as Tailwind ships it: the admin screens use
           it as the "limited" station status, and a status must not share a
           hue with the brand. */
        cyan: accent,
        sky: accent,
        teal: accent,
        /* Dark grounds. 900 and 950 are forest and pine; 800 and 700 step up
           to mineral so a hover on a dark band has somewhere to go. White on
           900 is 13.8:1, on 950 16.4:1. In the dark theme they take the
           app's band values — see BANDS in tailwind.tokens.ts. */
        'plug-navy': bandColors,
        /* The light end, for type and rules on the dark grounds. */
        'plug-sky': {
          100: '#C4F8EC',
          300: '#BAC2C0',
          500: '#727C7A',
        },
        ...status,
        dark: {
          base: '#0D1817',
          elevated: '#05241E',
          card: '#0B332C',
        },
      },
      /* Type reads the text variants of each scale. `white` is not among them:
         as type it is the label on dark buttons and bands, white in both themes. */
      textColor: {
        slate: neutralText,
        'plug-slate': neutralText,
        'plug-blue': brandText,
        'plug-cyan': accentText,
        cyan: accentText,
        sky: accentText,
        teal: accentText,
        ...statusText,
      },
      /* As a ground, a border or a ring, white is a surface — see surface(). */
      backgroundColor: { white: surface },
      borderColor: { white: surface },
      ringColor: { white: surface },
      ringOffsetColor: { white: surface },
      gradientColorStops: { white: surface },
      fontFamily: {
        /*
          Figtree everywhere, with a real fallback stack behind it.

          Naming the real system faces in descending order means the fallback
          is a decision rather than a lottery, and every one of them is a
          grotesque near enough to Figtree that the layout does not reflow
          noticeably while the webfont is in flight.
        */
        sans: [
          'var(--font-sans)',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        /*
          `display` is the same family. It is kept as a separate key because
          about forty places use the `font-display` class, and it leaves one
          token to change if a display face ever comes back.
        */
        display: [
          'var(--font-sans)',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      /*
        The two heaviest weights, pulled back one step.

        The reference sets its headings at a confident semibold, not a black:
        weight is carried by size and by the forest colour, not by ink. About
        sixty headings and figures across the site ask for `font-black` and
        another hundred for `font-extrabold`, which in this palette read as
        shouting. Both now resolve to bold: at display sizes Figtree 700 has all
        the presence a heading needs, and the size step already separates a
        headline from a card title, so the extra weight added nothing but ink.
      */
      fontWeight: {
        extrabold: '700',
        black: '700',
      },
      fontSize: {
        /**
         * The UI micro-scale. These sizes were already in use as one-off
         * arbitrary values (text-[15px] and friends) which meant the interface
         * had a type scale nobody could see or reuse. Naming them makes it a
         * real scale:
         *   ui-xs   labels, badge text, table meta
         *   ui-sm   secondary lines, captions, distances
         *   ui      the default body size for dense product UI
         *   ui-lg   card titles
         * Prefer these over new bracket values.
         *
         * ui-xs is the floor: 12px. It was 11px, and with about a hundred
         * text-[10px] and text-[11px] one-offs beside it the smallest type on
         * the site — badge text, table meta, the legal line — was below what
         * most phones render legibly. Nothing on the site should be set
         * smaller than this step.
         *
         * Leading is a touch calmer than it was under Poppins: Figtree has
         * shorter ascenders, so the same line-height read tighter.
         */
        'ui-xs': ['0.75rem', { lineHeight: '1.125rem' }],
        'ui-sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        ui: ['0.9375rem', { lineHeight: '1.5rem' }],
        'ui-lg': ['1.0625rem', { lineHeight: '1.625rem' }],

        /*
          The display scale.

          Semibold at the largest steps, as the reference sets them, with tight
          leading and tracking. Figtree is narrower than Poppins, so the
          negative tracking is lighter than it was: at -0.045em Figtree's round
          letters start to touch.
        */
        'display-2xl': [
          '4.5rem',
          {
            lineHeight: '1.02',
            letterSpacing: '-0.035em',
            fontWeight: '600',
          },
        ],
        'display-xl': [
          '3.75rem',
          {
            lineHeight: '1.05',
            letterSpacing: '-0.03em',
            fontWeight: '600',
          },
        ],
        'display-lg': [
          '3rem',
          {
            lineHeight: '1.1',
            letterSpacing: '-0.025em',
            fontWeight: '600',
          },
        ],
        'display-md': [
          '2.25rem',
          {
            lineHeight: '1.15',
            letterSpacing: '-0.02em',
            fontWeight: '600',
          },
        ],
        'display-sm': [
          '1.875rem',
          {
            lineHeight: '1.2',
            letterSpacing: '-0.015em',
            fontWeight: '600',
          },
        ],
      },
      boxShadow: {
        /**
         * Elevation scale, tinted with pine rather than slate so shadows sit
         * in the same hue family as the page instead of reading as grey smudge.
         *
         *   e1  resting card
         *   e2  raised / hovered card
         *   e3  floating panel: dropdown, popover, map overlay
         *   e4  modal, sheet, hero card
         * Reach for these first; a bracket value should be a deliberate
         * exception, not the default.
         */
        e1: 'var(--shadow-e1)',
        e2: 'var(--shadow-e2)',
        e3: 'var(--shadow-e3)',
        e4: 'var(--shadow-e4)',

        /** Focus ring used by every text input: a turquoise halo. */
        focus: '0 0 0 3px rgba(38,205,178,0.22)',

        /* The "blue" names are kept so no call site had to change. They are
           forest now, the colour of the buttons they sit under. */
        blue: '0 8px 24px rgba(11,51,44,0.22)',
        'blue-lg': '0 16px 40px rgba(11,51,44,0.30)',
        cyan: '0 8px 24px rgba(38,205,178,0.28)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        nav: '0 1px 40px rgba(5,36,30,0.08)',
        modal: 'var(--shadow-modal)',
      },
      backgroundImage: {
        /* Carries the label in buttons and avatars. Light theme: forest to
           mineral under white type (7.7:1 at the lighter end). Dark theme: the
           app's turquoise gradient under pine type (--on-brand), see globals.css. */
        'gradient-brand': 'var(--gradient-brand)',
        /* For fills with nothing on them — progress bars, rules, stripes —
           where the turquoise end can show. Never put type on this one. */
        'gradient-accent': 'linear-gradient(90deg, #0B332C, #26CDB2)',
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-card': 'linear-gradient(180deg, rgb(var(--c-surface)) 0%, rgb(var(--c-neutral-50)) 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0D1817 0%, #05241E 100%)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
        accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0, 0, 0.2, 1) forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0, 0, 0.2, 1) forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'grow-x': 'growX 800ms cubic-bezier(0, 0, 0.2, 1) both',
        /**
         * A seamless horizontal loop. Pairs with a track holding its content
         * twice: translating exactly -50% lands the second copy where the first
         * began, so the seam never shows. Linear, because any easing makes a
         * continuous scroll visibly stutter at the loop point.
         */
        marquee: 'marquee 45s linear infinite',
        /** The same loop, vertical: the home community card scrolls its posts on hover. */
        'feed-scroll': 'feedScroll 9s linear infinite',
        /** A map pin dropping in and settling, used on the clubs card on hover. */
        'pin-pop': 'pinPop 800ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
      keyframes: {
        feedScroll: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' },
        },
        pinPop: {
          '0%': { transform: 'translateY(-16px) scale(0.3)', opacity: '0' },
          '55%': { transform: 'translateY(2px) scale(1.6)', opacity: '1' },
          '75%': { transform: 'translateY(-3px) scale(0.9)' },
          '100%': { transform: 'translateY(0) scale(1.15)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        // Horizontal fill for progress/rating bars. Pairs with `origin-left`
        // so a server-rendered bar can animate on mount without any JS.
        growX: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      screens: {
        xs: '375px',
      },
      maxWidth: {
        container: '1280px',
      },
      spacing: {
        // 3.25rem / 52px — the `lg` button and SearchInput height.
        '13': '3.25rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '128': '32rem',
      },
    },
  },
  plugins: [
    /* The theme's custom properties: light on :root, dark under .dark, and the
       light set again on grounds that are dark in both themes. */
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...themeVars('light'), colorScheme: 'light' },
        '.dark': { ...themeVars('dark'), colorScheme: 'dark' },
        [ISLANDS.map((island) => `.dark ${island}`).join(', ')]: themeVars('light', { island: true }),
      })
    }),
  ],
}

export default config
