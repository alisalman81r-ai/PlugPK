// tailwind.config.ts
import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

import { bandColors, scaleColors, surface, themeVars } from './tailwind.tokens'

/*
  ── The palette: "night drive" ──────────────────────────────────────────

  Ink grounds, chalk paper, one volt accent — the landing-v2 brand.

    #0B0C0E  Ink         dark grounds, headings, body type, primary buttons
    #131519  Ink 2       raised dark surfaces, menus
    #1C1F24  Ink 3       a step up again on dark
    #FAF9F6  Paper       light section ground
    #F2F0EA  Chalk       the page ground of inner pages
    #E6E3DA  Stone       quiet fills, tracks, segmented controls
    #5B5F66  Muted       secondary type
    #A3A7AE  Fog         placeholders, decorative icons
    #D4FF3A  Volt        the accent: one volt moment per view
    #3F5200  Volt ink    volt as text on light grounds (AA)
    #FF5A1F  Ember       the rare warm counterpoint

  ── Why the scales are redefined rather than renamed ────────────────────

  The site asks for `slate-*`, `plug-blue-*` and `plug-cyan-*` about 3,400
  times. Pointing those names at the new palette moves every page at once and
  keeps each shade doing the job it already does — slate-500 is still "muted
  text", plug-blue-600 is still "the action colour" — so no component had to
  learn a new vocabulary to change colour. New code uses the named colours
  below (ink, paper, chalk, volt…) directly.

  ── Contrast rules ──────────────────────────────────────────────────────

  Volt on white is 1.1:1: volt is never a text colour on light grounds — use
  volt-ink (plug-cyan-700) there — and a volt button takes ink type. On ink,
  volt is fine as text (16.8:1).
*/

/* The scales themselves live in tailwind.tokens.ts as CSS custom properties,
   so globals.css reads the same values. See the note there. */
const neutral = scaleColors('neutral')
const brand = scaleColors('brand')
const accent = scaleColors('accent')

/* Tailwind's own hues, which carry status, read the same way. */
const STATUS = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const status = Object.fromEntries(STATUS.map((name) => [name, scaleColors(name)]))

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  /* Light only. Nothing sets `.dark`, so this keeps any stray `dark:` class
     from following the device's dark mode, as the default `media` would. */
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
           900 is 13.8:1, on 950 16.4:1. See BANDS in tailwind.tokens.ts. */
        'plug-navy': bandColors,
        /* The light end, for type and rules on the dark grounds. */
        'plug-sky': {
          100: '#C4F8EC',
          300: '#BAC2C0',
          500: '#727C7A',
        },
        ...status,
        dark: {
          base: '#0B0C0E',
          elevated: '#131519',
          card: '#1C1F24',
        },
        /* The landing-v2 names, for new code. */
        ink: { DEFAULT: '#0B0C0E', 2: '#131519', 3: '#1C1F24' },
        paper: '#FAF9F6',
        chalk: '#F2F0EA',
        stone: '#E6E3DA',
        muted: '#5B5F66',
        fog: '#A3A7AE',
        volt: { DEFAULT: '#D4FF3A', 2: '#BDEB1F', ink: '#3F5200', tint: '#F1FFD0', edge: '#DDF58C' },
        ember: '#FF5A1F',
      },
      /* As a ground, a border or a ring, white is a surface — see surface(). */
      backgroundColor: { white: surface },
      borderColor: { white: surface },
      ringColor: { white: surface },
      ringOffsetColor: { white: surface },
      gradientColorStops: { white: surface },
      fontFamily: {
        /*
          Poppins for the interface, Power Grotesk for display, JetBrains Mono
          for numbers, units and labels — the landing-v2 type system.
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
          Power Grotesk, Regular only. Heavier weights are drawn with a text
          stroke (the pg-medium and pg-bold utilities below) rather than the
          browser's synthetic bold, which smears it.
        */
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        /* --font-plain-zero covers the digit 0 only (see layout.tsx), so every
           other character, and the line metrics, still come from JetBrains. */
        mono: ['var(--font-plain-zero)', 'var(--font-jetbrains)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      /*
        The two heaviest weights, pulled back one step.

        The reference sets its headings at a confident semibold, not a black:
        weight is carried by size and by the forest colour, not by ink. About
        sixty headings and figures across the site ask for `font-black` and
        another hundred for `font-extrabold`, which in this palette read as
        shouting. Both now resolve to bold: at display sizes Poppins 700 has all
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

          Power Grotesk Regular at every step (the pg-medium and pg-bold
          utilities draw heavier weights), with tight leading and the brand's
          -0.012em tracking.
        */
        'display-2xl': [
          '4.5rem',
          {
            lineHeight: '1.02',
            letterSpacing: '-0.012em',
            fontWeight: '400',
          },
        ],
        'display-xl': [
          '3.75rem',
          {
            lineHeight: '1.05',
            letterSpacing: '-0.012em',
            fontWeight: '400',
          },
        ],
        'display-lg': [
          '3rem',
          {
            lineHeight: '1.1',
            letterSpacing: '-0.012em',
            fontWeight: '400',
          },
        ],
        'display-md': [
          '2.25rem',
          {
            lineHeight: '1.15',
            letterSpacing: '-0.012em',
            fontWeight: '400',
          },
        ],
        'display-sm': [
          '1.875rem',
          {
            lineHeight: '1.2',
            letterSpacing: '-0.012em',
            fontWeight: '400',
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

        /** Focus ring used by every text input: a volt halo. */
        focus: '0 0 0 4px rgba(212,255,58,0.45)',

        /* The "blue" names are kept so no call site had to change. They are
           ink now, the colour of the buttons they sit under. */
        blue: '0 8px 24px rgba(11,12,14,0.22)',
        'blue-lg': '0 16px 40px rgba(11,12,14,0.30)',
        cyan: '0 10px 30px -10px rgba(212,255,58,0.55)',
        volt: '0 10px 30px -10px rgba(212,255,58,0.55)',
        'volt-lg': '0 20px 60px -20px rgba(212,255,58,0.35)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        nav: '0 1px 40px rgba(5,36,30,0.08)',
        modal: 'var(--shadow-modal)',
      },
      backgroundImage: {
        /* Carries the label in buttons and avatars: forest to mineral under
           white type (7.7:1 at the lighter end). */
        'gradient-brand': 'var(--gradient-brand)',
        /* For fills with nothing on them — progress bars, rules, stripes —
           where the turquoise end can show. Never put type on this one. */
        'gradient-accent': 'linear-gradient(90deg, #0B0C0E, #D4FF3A)',
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-card': 'linear-gradient(180deg, rgb(var(--c-surface)) 0%, rgb(var(--c-neutral-50)) 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0B0C0E 0%, #131519 100%)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
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
        /* landing-v2's .wrap measure. */
        wrap: '1320px',
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
    /* The palette's custom properties, on :root. `color-scheme: light` keeps
       form controls and scrollbars light on a device set to dark mode. */
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...themeVars(), colorScheme: 'light', '--pg-medium': '.016em', '--pg-bold': '.034em' },
      })
    }),
    /*
      Power Grotesk's weights, drawn with a stroke in the text's own colour
      (only the Regular file is licensed), and the volt highlighter: a marker
      stroke behind one phrase per headline on light grounds.
    */
    plugin(({ addUtilities }) => {
      addUtilities({
        '.pg-medium': { '-webkit-text-stroke': 'var(--pg-medium) currentColor', letterSpacing: '0' },
        '.pg-bold': { '-webkit-text-stroke': 'var(--pg-bold) currentColor', letterSpacing: '.012em' },
        '.pg-none': { '-webkit-text-stroke': '0' },
        '.hl': {
          background: 'linear-gradient(transparent 58%, #D4FF3A 58%, #D4FF3A 92%, transparent 92%)',
          padding: '0 .06em',
          margin: '0 -.06em',
          '-webkit-box-decoration-break': 'clone',
          boxDecorationBreak: 'clone',
        },
      })
    }),
  ],
}

export default config
