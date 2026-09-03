// src/lib/motion.ts

/**
 * The stagger scale.
 *
 * Two values, and a rule for which to reach for. Before this the site used
 * five — 60ms in the post feed, 80ms in the services grid and the clubs
 * directory, 90ms on the featured stations, 100ms on related stations and
 * 110ms on the home page's three steps — none of them derived from anything.
 * Nobody would name the difference between an 80ms and a 90ms stagger, but a
 * reader does feel a page where every list enters to a slightly different
 * rhythm; it is the kind of inconsistency that makes an interface feel
 * assembled rather than designed.
 *
 * The two figures are the ones the motion guidance settles on (0.05s and 0.1s),
 * and they hold up against the content here:
 *
 *   TIGHT is for a grid. Twelve service cards at 100ms take 1.2 seconds to
 *   finish arriving, which is long enough that the last row lands after the
 *   reader has already started reading the first — the animation stops being
 *   an entrance and becomes a wait. At 50ms the same grid completes in 600ms.
 *
 *   STEP is for a short sequence that is meant to be read in order: the three
 *   steps on the home page, the three on Partner Up. Four items at 100ms is
 *   400ms in total, and the spacing is what says "first, then, then" rather
 *   than "all at once".
 *
 * The dividing line is whether the order carries meaning. A grid of services
 * has no first; a set of numbered steps does.
 */
export const STAGGER = {
  /** Grids and feeds — many items, no meaningful order. */
  TIGHT: 50,
  /** Short ordered sequences, where the spacing is the point. */
  STEP: 100,
} as const

/**
 * How long a single element takes to arrive.
 *
 * Kept here beside the stagger because the two are read together: a 650ms
 * reveal on a 50ms stagger overlaps by design, so a grid looks like one
 * movement rather than twelve separate ones.
 */
export const REVEAL_MS = 650
