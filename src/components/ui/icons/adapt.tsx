// src/components/ui/icons/adapt.tsx
import * as React from 'react'
import type { IconProps as PhosphorProps, IconWeight } from '@phosphor-icons/react'

/**
 * Every icon on the site, drawn by Phosphor.
 *
 * ── Why a registry, and why it keeps Lucide's names ───────────────────
 *
 * The site was drawn in Lucide and moved to Phosphor for its finer, more
 * even strokes and fuller shapes. 169 files used 137 Lucide icons, and a
 * find-and-replace across all of them would have meant renaming every call
 * site — `<Search />` to `<MagnifyingGlassIcon />`, `<Zap />` to
 * `<LightningIcon />` — in code other people are actively editing.
 *
 * Instead each file changes one import line and nothing else. The names here
 * are the ones the code already uses, each pointing at its Phosphor
 * counterpart, so this file is also the single place that decides which
 * Phosphor glyph stands for which idea. Swapping one icon site-wide is one
 * line below.
 *
 * ── The three Lucide habits it translates ─────────────────────────────
 *
 *   fill      A Lucide icon is strokes, so `className="fill-amber-400"`
 *             painted its inside and made a solid star. A Phosphor icon is
 *             already filled paths — the same class would only recolour the
 *             outline. So a `fill-*` class or a `fill` prop switches the
 *             icon to Phosphor's own `fill` weight. This reads the final
 *             className at render time, which is why a conditional fill — a
 *             heart that fills when liked — keeps working with no change at
 *             the call site.
 *
 *   stroke    `strokeWidth` means nothing to filled paths. It is mapped to
 *             a weight instead: 1.6 and under is `light`, 2.4 and over is
 *             `bold`, everything between is `regular`.
 *
 *   size      Lucide defaults to 24px; Phosphor defaults to 1em. Left alone,
 *             every icon without a size would have shrunk to the font size
 *             around it, so the default here is 24 — the size every icon was
 *             drawn at before.
 *
 * Server-safe: the SSR build of Phosphor carries no React context, and
 * nothing here uses a hook, so these render in server components too.
 */

export interface AppIconProps extends Omit<PhosphorProps, 'weight'> {
  weight?: IconWeight
  /** Lucide's stroke control, translated to a weight. */
  strokeWidth?: number | string
  /** Lucide-only. Accepted so old call sites type-check; has no effect. */
  absoluteStrokeWidth?: boolean
}

export type IconType = React.ForwardRefExoticComponent<
  AppIconProps & React.RefAttributes<SVGSVGElement>
>

/*
  Unprefixed only. `hover:fill-x` would mean "solid on hover", and forcing
  the fill weight for it would draw the icon solid at rest in its text colour.
  Nothing on the site uses a prefixed fill today; if one appears it renders
  as an outline, which is the safe way to be wrong.
*/
const SOLID_CLASS = /(?:^|\s)fill-(?!none\b)/

function weightFor(
  className: string | undefined,
  fill: string | undefined,
  strokeWidth: number | string | undefined,
): IconWeight {
  if ((fill && fill !== 'none') || SOLID_CLASS.test(className ?? '')) return 'fill'
  if (strokeWidth == null) return 'regular'
  const n = Number(strokeWidth)
  if (n <= 1.6) return 'light'
  if (n >= 2.4) return 'bold'
  return 'regular'
}

export function adapt(Glyph: React.ElementType, name: string): IconType {
  const Adapted = React.forwardRef<SVGSVGElement, AppIconProps>(function Icon(
    { className, fill, strokeWidth, absoluteStrokeWidth: _absolute, weight, size = 24, ...rest },
    ref,
  ) {
    return (
      <Glyph
        ref={ref}
        size={size}
        className={className}
        weight={weight ?? weightFor(className, fill as string | undefined, strokeWidth)}
        {...rest}
      />
    )
  })
  Adapted.displayName = name
  return Adapted
}
