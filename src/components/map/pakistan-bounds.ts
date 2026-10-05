// src/components/map/pakistan-bounds.ts

/**
 * The box both map engines open on: Pakistan, edge to edge.
 *
 * Roughly the country's extreme points — Jiwani in the south-west, the
 * Khunjerab side of Gilgit-Baltistan in the north, the Indian border east of
 * Lahore and Sialkot — with a little room so no border sits on the card's edge.
 *
 * ── The Kashmir boundary needs a human decision ───────────────────────
 *
 * This box includes Azad Kashmir and Gilgit-Baltistan, but how the tiles DRAW
 * the Line of Control is up to each provider, not this file. OpenStreetMap's
 * tiles (MapLibre engine) show the de facto line as a disputed boundary; Google
 * localises its borders by `region`, which MapViewGoogle sets to PK. Both
 * should be reviewed by someone at Plug.pk for how they read to a Pakistani
 * audience before the map is promoted heavily — it is a sensitivity a code
 * change cannot settle on its own.
 */
export const PAKISTAN_BOUNDS = {
  south: 23.5,
  west: 60.8,
  north: 37.1,
  east: 77.8,
} as const
