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

/**
 * Grey at rest, brand on hover. Pair with FACE on the child.
 *
 * `block` matters, and is easy to lose. This file says the frame is applied to
 * "a div, an li and an anchor", and an anchor is `display: inline` by default.
 * An inline box holding a block child does not wrap it — it paints its
 * background across line boxes instead, so the gradient appears as stray
 * slivers above and below the card rather than as its border. Measured on the
 * community feed before this was added: a 303px frame around a 252px face, with
 * 26px of gradient showing at each end.
 *
 * It goes unnoticed wherever the card is a grid or flex item, because those are
 * blockified anyway — which is exactly why it survived on every other page and
 * only appeared in the one feed that stacks its cards in normal flow.
 */
export const FRAME =
  'group card-frame block h-full rounded-3xl p-[1.5px] ' +
  'shadow-[0_1px_2px_rgba(5,36,30,0.05),0_16px_36px_-20px_rgba(5,36,30,0.35)] ' +
  'hover:shadow-[0_16px_34px_-10px_rgba(11,51,44,0.24),0_36px_72px_-26px_rgba(11,51,44,0.42)]'

/**
 * For the one card that should already look chosen — the recommended plan.
 * It carries the brand edge at rest rather than waiting for a hover.
 */
export const FRAME_FEATURED =
  'group card-frame--featured block h-full rounded-3xl p-[1.5px] ' +
  'shadow-[0_14px_30px_-10px_rgba(11,51,44,0.28),0_34px_70px_-28px_rgba(11,51,44,0.45)] ' +
  'transition-all duration-300 hover:shadow-[0_18px_38px_-10px_rgba(11,51,44,0.36),0_40px_80px_-28px_rgba(11,51,44,0.55)]'

/** The unpainted face. The radius is the frame's minus its padding. */
export const FACE =
  'relative flex h-full flex-col rounded-[calc(1.5rem-1.5px)] bg-white ' +
  'transition-transform duration-300 group-hover:-translate-y-0.5'

/**
 * The icon holder — now a position, not a container.
 *
 * It was an outlined box: a 56px rounded square with a 1.5px slate border that
 * warmed to brand and grew a soft ring on hover. That replaced filled chips,
 * and it has now gone the rest of the way. Two frames nested inside each other
 * — the card's own edge, then a second edge around the glyph — is one border
 * too many, and at this size the box drew more attention than the icon it was
 * holding.
 *
 * The dimensions stay. Every section that uses this lays its icon out above a
 * cap rule and a heading, and dropping to the glyph's intrinsic size would
 * shift all of them up by a few pixels and leave the rules no longer aligned
 * across a row of cards. So the 56px square remains as space; only the border,
 * the radius and the hover ring are gone.
 *
 * Hover now lives entirely on the glyph — see ICON_GLYPH, which still warms to
 * brand. The card keeps its own edge transition, so a card still responds; it
 * just responds once instead of three times.
 */
export const ICON_FRAME = 'flex h-14 w-14 shrink-0 items-center justify-center'

export const ICON_GLYPH =
  'text-slate-500 transition-colors duration-300 group-hover:text-plug-blue-600'

/**
 * The rule that sat between a card's icon and its heading — now nothing.
 *
 * It was a 40px slate bar that drew to 64px and warmed to brand on hover. On
 * a card that already carries its own edge, a second horizontal line inside
 * it divides two things that were never separate: the glyph and the title are
 * one idea, and ruling between them broke each card into halves.
 *
 * Kept as an exported empty string rather than deleted. Ten sections spread
 * this into a className, and every one of them would otherwise need its span
 * removing by hand; emptying it here clears all ten at once and leaves a
 * single place to put the rule back.
 *
 * The margins stay on the call sites, so the spacing those layouts were tuned
 * against does not shift.
 */
export const CAP_RULE = ''

/**
 * The stroke-only numeral that sits in a card's corner.
 *
 * Outline rather than fill, so it counts the cards without competing with the
 * heading inside them. Both states are classes: setting the base stroke inline
 * would outrank the hover variant and the colour could never change.
 *
 * On alignment, which this got wrong twice.
 *
 * It was `-top-3` inside a face with `overflow-hidden`, so the digit's box
 * began 12px above the card's top edge and the card then clipped it: every
 * numeral was sliced flat across the top. That reads as a rendering fault
 * rather than as a deliberate crop, and it lined up with nothing — the numeral
 * started at -12px while the icon holder beside it started at 32px.
 *
 * It now shares a box with the icon. `top-8` matches the p-8 the faces use, and
 * `h-14` matches the icon holder's height, so centring the digit in that box
 * puts it on the icon's optical centre line. The two sit as one row, and
 * nothing overhangs, so nothing is cut.
 *
 * Slightly smaller than before as a result: at 88px the digit had to overhang
 * to fit at all, which is what led to the crop in the first place.
 */
/*
  Sans, not mono, and the reason is the zero.

  JetBrains Mono draws its 0 with a dot in the counter — that is the only zero
  it has. Measured against the loaded font: the `zero` OpenType feature makes
  no difference at 1 or at 0, because the dotted form is the default glyph
  rather than an alternate. At 4.5rem and hollow, that dot reads as a bullet
  someone left inside the numeral, and every step card starts with one.

  So the numeral takes the interface face, whose 0 is a plain oval. It loses
  the technical character the mono gave it; a stroked outline at this size is
  carrying the character anyway. Every other mono figure on the site — port
  counts, distances, slugs — keeps JetBrains, where a dotted zero is an
  advantage rather than a blemish.
*/
export const NUMERAL =
  'pointer-events-none absolute right-7 top-8 flex h-14 select-none items-center ' +
  'font-sans text-[4.5rem] font-black leading-none tracking-[-0.04em] text-transparent transition-all duration-300 ' +
  '[-webkit-text-stroke:2px_#BAC2C0] group-hover:[-webkit-text-stroke:2px_#26CDB2]'
