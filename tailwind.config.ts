// tailwind.config.ts
import type { Config } from 'tailwindcss'

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
        'plug-blue': {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        'plug-cyan': {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },
        'plug-slate': {
          0: '#FFFFFF',
          25: '#FAFAFA',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        dark: {
          base: '#0A0F1E',
          elevated: '#0F172A',
          card: '#1E293B',
        },
      },
      fontFamily: {
        /*
          Poppins everywhere, with a real fallback stack behind it.

          The stack matters more than it looks. The old one was
          `system-ui, sans-serif` — two entries, the second a generic. If the
          Poppins files fail or are still in flight, what a reader sees is
          whatever the OS calls system-ui, which on older Android is a
          condensed Roboto and on Windows 8 is nothing at all. Naming the real
          faces in descending order means the fallback is a decision rather
          than a lottery, and every one of them is a humanist or geometric sans
          near enough to Poppins that the layout does not reflow noticeably.
        */
        sans: [
          'var(--font-poppins)',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        /*
          `display` is the same family now.

          It is kept as a separate key rather than deleted because 43 places use
          the `font-display` class — a stat figure, a card title set as a <p>,
          the auth wordmark. Pointing it at Poppins keeps every one of them
          working and leaves one token to change if a display face ever comes
          back. It no longer ends in `serif`: falling back from a sans to
          Georgia would have been jarring, and was only ever right while the
          display face was Playfair.
        */
        display: [
          'var(--font-poppins)',
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
      fontSize: {
        /**
         * The UI micro-scale. These sizes were already in use as one-off
         * arbitrary values (text-[15px] and friends, 82 occurrences across
         * nine distinct sizes) which meant the interface had a type scale
         * nobody could see or reuse. Naming them makes it a real scale:
         *   ui-xs   labels, badge text, table meta
         *   ui-sm   secondary lines, captions, distances
         *   ui      the default body size for dense product UI
         *   ui-lg   card titles
         * Prefer these over new bracket values.
         */
        /*
          Leading opened up by 1–2px per step when the body face became Poppins.

          Poppins has taller ascenders and deeper descenders than Inter at the
          same nominal size, so the line-heights that sat comfortably under Inter
          were letting descenders on one line approach the caps on the next. The
          sizes themselves are unchanged — this is only the space between lines,
          and every value is still a whole or half pixel at the default root size
          so nothing lands on a fractional baseline.
        */
        'ui-xs': ['0.6875rem', { lineHeight: '1.0625rem' }],
        'ui-sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        ui: ['0.9375rem', { lineHeight: '1.4375rem' }],
        'ui-lg': ['1.0625rem', { lineHeight: '1.5625rem' }],

        /*
          The two largest steps drop from 900 to 800.

          Poppins Black is close to circular and its counters — the holes in a, e,
          o — nearly close at 4.5rem, which reads as heavy rather than confident.
          800 holds the same weight in the layout and keeps the letterforms open.
          This is a choice about these two steps only — `font-black` still
          resolves to a real 900, which is loaded, because 62 places ask for it.
          See the weights note in src/app/layout.tsx.

          Tracking is tightened a little at the same time. Poppins is a wide,
          geometric face, so the gaps between round letters open up at display
          sizes in a way Inter's narrower forms did not.
        */
        'display-2xl': [
          '4.5rem',
          {
            lineHeight: '1.05',
            letterSpacing: '-0.045em',
            fontWeight: '800',
          },
        ],
        'display-xl': [
          '3.75rem',
          {
            lineHeight: '1.08',
            letterSpacing: '-0.035em',
            fontWeight: '800',
          },
        ],
        'display-lg': [
          '3rem',
          {
            lineHeight: '1.15',
            letterSpacing: '-0.025em',
            fontWeight: '800',
          },
        ],
        'display-md': [
          '2.25rem',
          {
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
            fontWeight: '700',
          },
        ],
        'display-sm': [
          '1.875rem',
          {
            lineHeight: '1.25',
            letterSpacing: '-0.015em',
            fontWeight: '700',
          },
        ],
      },
      boxShadow: {
        /**
         * Elevation scale. Before this there were 27 distinct one-off
         * shadow-[...] values across the app against 7 named tokens, so
         * surfaces at the same conceptual height rendered differently.
         *
         *   e1  resting card
         *   e2  raised / hovered card
         *   e3  floating panel: dropdown, popover, map overlay
         *   e4  modal, sheet, hero card
         * Reach for these first; a bracket value should be a deliberate
         * exception, not the default.
         */
        e1: '0 1px 2px rgba(15,23,42,0.04), 0 2px 8px rgba(15,23,42,0.05)',
        e2: '0 8px 16px rgba(15,23,42,0.06), 0 16px 32px rgba(15,23,42,0.08)',
        e3: '0 8px 32px rgba(15,23,42,0.12)',
        e4: '0 24px 64px rgba(15,23,42,0.20)',

        /** Focus ring used by every text input. */
        focus: '0 0 0 3px rgba(59,130,246,0.12)',

        blue: '0 8px 25px rgba(37, 99, 235, 0.25)',
        'blue-lg': '0 16px 40px rgba(37, 99, 235, 0.35)',
        cyan: '0 8px 25px rgba(6, 182, 212, 0.20)',
        card: '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
        'card-hover': '0 20px 25px rgba(0,0,0,0.08), 0 10px 10px rgba(0,0,0,0.04)',
        nav: '0 1px 40px rgba(0,0,0,0.08)',
        modal: '0 25px 50px rgba(0,0,0,0.20)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(90deg, #2563EB, #06B6D4)',
        'gradient-hero': 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0891B2 100%)',
        'gradient-card': 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0A0F1E 0%, #0F172A 100%)',
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
      },
      keyframes: {
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
  plugins: [],
}

export default config
