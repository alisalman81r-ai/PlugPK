/*
  The station pin, used by every labelled marker on the hero map.

  One constant rather than a path string copied per call site: two copies of a
  shape agree only until one of them is edited.

  Drawn from the pin's point at (0 0) upward: a marker is placed by
  translating to the coordinate it marks, with no centring maths at the call
  site.
*/
export const PIN_D =
  'M 0 0 C -6 -9 -13 -14 -13 -22 A 13 13 0 1 1 13 -22 C 13 -14 6 -9 0 0 Z'

/** A bolt, small enough to read as a mark rather than an icon. */
export const PIN_BOLT_D =
  'M 1.6 -29 L -3.2 -21.4 L 0 -21.4 L -1.6 -15 L 3.4 -22.8 L 0.2 -22.8 Z'

/**
 * Centre of the pin's head relative to its point, so haloes and rings can be
 * hung off the head instead of the tip. The head's radius is 13.
 */
export const PIN_HEAD_Y = -22
