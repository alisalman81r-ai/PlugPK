// src/components/shared/frame.ts

/**
 * The card treatment shared by Partner Up and the home page.
 *
 * Class strings rather than a component, because these are applied to a div,
 * an li and an anchor in different sections, and a polymorphic wrapper would
 * cost more than it saves. Keeping them here means the whole page's card
 * weight is tuned in one file instead of four.
 *
 * The rule the design follows: prominence comes from the edge, the depth and
 * the space — never from filling the card. Every face below is white on a
 * white or near-white section, so the surface itself stays unpainted.
 *
 * How the graded edge works: the frame element carries the gradient and 1.5px
 * of padding, and the face sits on top of it. CSS has no gradient border, so
 * the padding is the border.
 */

/** Grey at rest, brand on hover. Pair with FACE on the child. */
export const FRAME =
  'group h-full rounded-3xl bg-gradient-to-b from-slate-300 via-slate-300 to-slate-200 p-[1.5px] ' +
  'shadow-[0_1px_2px_rgba(15,23,42,0.05),0_16px_36px_-20px_rgba(15,23,42,0.35)] ' +
  'transition-all duration-300 ' +
  'hover:from-plug-blue-500 hover:via-plug-cyan-400 hover:to-plug-blue-300 ' +
  'hover:shadow-[0_12px_26px_-8px_rgba(37,99,235,0.22),0_30px_64px_-24px_rgba(37,99,235,0.38)]'

/**
 * For the one card that should already look chosen — the recommended plan.
 * It carries the brand edge at rest rather than waiting for a hover.
 */
export const FRAME_FEATURED =
  'group h-full rounded-3xl bg-gradient-to-b from-plug-blue-500 via-plug-cyan-400 to-plug-blue-300 p-[1.5px] ' +
  'shadow-[0_14px_30px_-10px_rgba(37,99,235,0.28),0_34px_70px_-28px_rgba(37,99,235,0.45)] ' +
  'transition-all duration-300 hover:shadow-[0_18px_38px_-10px_rgba(37,99,235,0.36),0_40px_80px_-28px_rgba(37,99,235,0.55)]'

/** The unpainted face. The radius is the frame's minus its padding. */
export const FACE =
  'relative flex h-full flex-col rounded-[calc(1.5rem-1.5px)] bg-white ' +
  'transition-transform duration-300 group-hover:-translate-y-0.5'

/** An outlined icon holder, replacing the filled chips these sections had. */
export const ICON_FRAME =
  'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-slate-300 ' +
  'transition-all duration-300 group-hover:border-plug-blue-400 ' +
  'group-hover:shadow-[0_0_0_4px_rgba(37,99,235,0.06)]'

export const ICON_GLYPH =
  'text-slate-500 transition-colors duration-300 group-hover:text-plug-blue-600'

/** The rule above a heading, which draws wider and warms on hover. */
export const CAP_RULE =
  'block h-0.5 w-10 origin-left rounded-full bg-slate-300 transition-all duration-300 ' +
  'group-hover:w-16 group-hover:bg-gradient-brand'
