// src/components/ui/button-styles.ts
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/*
  Kept out of Button.tsx because that file is 'use client', and a function
  exported from a client module cannot be called from a server component —
  buttonClasses() is wanted on server-rendered <a> and <summary> elements.
*/

/**
 * The one button.
 *
 * ── Why this file is the canonical set ────────────────────────────────
 *
 * An audit counted at least five different "primary" treatments across the
 * site — forest fill, navy-900 fill, navy-950 fill, the brand gradient and the
 * PillButton — and about 235 hand-styled <button>s against 50 uses of this
 * component. Each was reasonable where it was written; together they meant the
 * main action looked different on every page.
 *
 * So there are four variants, and a page should need nothing else:
 *
 *   primary      the one main action in view. Forest, turquoise under the pointer.
 *   secondary    an alternative beside it. Outlined.
 *   ghost        low-emphasis actions in toolbars, menus and lists.
 *   destructive  deleting, revoking, signing out everywhere.
 *
 * plus `inverse` and `outline-white` for the same two roles on a dark band,
 * where a forest fill would vanish into the ground.
 *
 * ── Radius ────────────────────────────────────────────────────────────
 *
 * rounded-xl at every size. It was the most common radius on hand-written
 * action buttons (rounded-full is just as common, but almost all of those are
 * round icon buttons and filter chips, which are not this component's job).
 *
 * ── Disabled ──────────────────────────────────────────────────────────
 *
 * A disabled button used to be the live one at 50% opacity, which on a light
 * card is grey type on a grey fill at about 2:1 — readable as "broken" rather
 * than as "not yet". It is now an explicit, flat fill with type at 5.5:1, so
 * the label still says what the button will do once it is available.
 */
export const buttonVariants = cva(
  'group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        /*
          Forest at rest, turquoise under the pointer. The type flips to forest
          with the fill: white on turquoise is 2.0:1, forest on it is 6.9:1.
        */
        primary:
          'bg-plug-blue-600 text-white hover:-translate-y-0.5 hover:bg-plug-cyan-500 hover:text-plug-blue-600 hover:shadow-cyan active:scale-[0.98] focus-visible:ring-plug-blue-500',
        secondary:
          'border-[1.5px] border-slate-300 bg-white text-plug-blue-600 hover:border-plug-blue-600 hover:bg-slate-50 focus-visible:ring-plug-blue-500',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
        /* red-600, not 500: white on red-500 is 3.8:1, on 600 it is 4.8:1. */
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
        /* The primary role on a dark band: a white fill with forest type. */
        inverse:
          'bg-white text-plug-blue-600 hover:-translate-y-0.5 hover:bg-plug-cyan-500 focus-visible:ring-white focus-visible:ring-offset-plug-navy-950',
        /* The secondary role on a dark band. */
        'outline-white':
          'border border-white/80 bg-transparent text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-plug-navy-950',
        /**
         * @deprecated The brand gradient is no longer a separate primary. Kept
         * as an alias so existing call sites compile; it renders as primary.
         */
        gradient:
          'bg-plug-blue-600 text-white hover:-translate-y-0.5 hover:bg-plug-cyan-500 hover:text-plug-blue-600 hover:shadow-cyan active:scale-[0.98] focus-visible:ring-plug-blue-500',
      },
      size: {
        sm: 'h-9 px-3.5 text-ui-sm',
        md: 'h-11 px-5 text-ui',
        lg: 'h-13 px-7 text-base',
        /** @deprecated Use lg. Kept so existing call sites compile. */
        xl: 'h-[60px] px-9 text-ui-lg',
        /**
         * A square, icon-only button at the 44px touch minimum. Give it an
         * aria-label: there is no text for a screen reader to read.
         */
        icon: 'h-11 w-11 p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
)

/** What a disabled button looks like, per variant. See "Disabled" above. */
export const DISABLED: Record<ButtonVariant, string> = {
  primary: 'bg-slate-200 text-slate-600 shadow-none',
  gradient: 'bg-slate-200 text-slate-600 shadow-none',
  secondary: 'border-slate-200 bg-slate-50 text-slate-500',
  ghost: 'text-slate-500',
  destructive: 'bg-slate-200 text-slate-600',
  inverse: 'bg-white/20 text-white/70',
  'outline-white': 'border-white/30 text-white/60',
}

export type ButtonVariants = VariantProps<typeof buttonVariants>
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'inverse'
  | 'outline-white'
  | 'gradient'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon'

/**
 * The classes alone, for the rare element that has to look like a button but
 * cannot be one — a <summary>, a <label> for a file input, an <a> to a mailto.
 */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
} = {}) {
  return cn(buttonVariants({ variant, size, fullWidth }), className)
}

