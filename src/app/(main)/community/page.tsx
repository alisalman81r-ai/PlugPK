// src/app/(main)/community/page.tsx
import { CommunityPageClient } from '@/components/community/CommunityPageClient'
import { getPosts } from '@/lib/db/queries'

/**
 * The board reads: orient, choose what to read, read it.
 *
 * It used to sit outside the shape the rest of the site had settled on. The
 * hero was a two-column block on the old navy-to-teal gradient with a floating
 * card duplicating the top post; below it a full-bleed sticky bar of tabs; below
 * that a 1280px column while /map and /routes both work to 1400px. Three
 * different treatments of the same three ideas.
 *
 * Now it is the map page's shape, for the same reasons: one dark band, one
 * measure down the page, and the card the reader needs first lifted up into the
 * band so it reads as the thing the page is for rather than the next section
 * down. The card here is the browse control — categories, sort, and the count
 * they produce — exactly where the map keeps its filter rail.
 */

/** One measure, matching /map and /routes, so the pages line up edge for edge. */
const STAGE = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'

/**
 * How far the browse card is pulled up into the dark band above it.
 *
 * Less than the map's -mt-32: this card is roughly half the height of a map
 * canvas, and a lift that clears its own height floats the whole thing inside
 * the band with nothing anchoring it to the page. The hero's bottom padding is
 * set against this, so 3rem of dark always shows between the figures and the
 * card's top edge — the same gap /map leaves.
 */
const CARD_LIFT = '-mt-20 sm:-mt-24 lg:-mt-28'

export const dynamic = 'force-dynamic'

export default async function CommunityPage() {
  return <CommunityPageClient initialPosts={await getPosts()} />
}
