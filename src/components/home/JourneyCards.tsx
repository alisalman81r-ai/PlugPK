// src/components/home/JourneyCards.tsx

import { MapPin, Route, Zap } from 'lucide-react'

/**
 * Three ambient product cards floating around the Pakistan silhouette.
 *
 * ── Around it, never containing it ────────────────────────────────────
 *
 * They are absolutely positioned siblings of the map, not a frame drawn on
 * it. Each one is its own small surface; there is deliberately no element
 * that encloses the country, and the hero's background runs uninterrupted
 * between them and behind the silhouette.
 *
 * ── HTML, not SVG ─────────────────────────────────────────────────────
 *
 * The opposite call to the charging popup, and for the opposite reason. The
 * popup has to stay welded to a point on the route through every resize, so
 * it lives in the map's coordinate space. These are ambient chrome anchored
 * to the panel, not to any geography — as HTML they get the site's real type
 * rendering, the same border and shadow tokens as every other card on the
 * page, and lucide icons rather than hand-drawn paths.
 *
 * ── Placement ─────────────────────────────────────────────────────────
 *
 * A loose triangle rather than a stack or a grid: one high on the left, one
 * low on the left, one low on the right.
 *
 * Percentages of the PANEL, which is not quite the same as percentages of the
 * map. The silhouette is height-constrained and letterboxes, so a wider panel
 * puts more empty space either side of it and the same percentage drifts away
 * from the coast. Measured: at 1440 the cards sat 39%, 49% and 24% over land;
 * at 1920 the same values gave 29%, 10% and 0%.
 *
 * Hence the 2xl overrides, which pull them back in above 1536px. 2xl and not
 * xl, because xl starts at 1280 and would also move them at 1440, where they
 * are already right.
 *
 * They are pushed slightly INTO the map's edge — a card fully outside reads
 * as a caption, one overlapping by a fifth reads as a layer above it. The
 * overlap is on the western and southern coasts on purpose: the route runs
 * up the eastern side, so nothing here can sit on top of it.
 *
 * ── Not attached to the journey ───────────────────────────────────────
 *
 * No scroll binding, no ScrollTrigger, no progress. The drift is three CSS
 * keyframes at different periods so they never beat together, and it stops
 * entirely under prefers-reduced-motion.
 */

interface CardProps {
  icon: React.ReactNode
  title: string
  detail: string
  className?: string
}

function Card({ icon, title, detail, className }: CardProps) {
  return (
    <div
      aria-hidden="true"
      className={
        'pointer-events-none absolute flex items-center gap-2.5 rounded-xl border border-slate-200/90 ' +
        'bg-white/90 px-3 py-2.5 shadow-[0_8px_24px_-10px_rgba(15,23,42,0.28)] backdrop-blur-[2px] ' +
        (className ?? '')
      }
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-plug-blue-50 text-plug-blue-600">
        {icon}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[12.5px] font-semibold text-plug-navy-900">{title}</span>
        <span className="text-[11px] font-medium text-slate-500">{detail}</span>
      </span>
    </div>
  )
}

export function JourneyCards() {
  return (
    <>
      {/*
        Card A — high on the left, over the northern coast.
        Hidden below `sm`: on a phone the map is small enough that three
        cards would cover more of the country than they annotate.
      */}
      <Card
        icon={<Zap size={14} aria-hidden="true" />}
        title="Fast charging"
        detail="Find compatible stations"
        className="journey-float-a left-[34%] top-[8%] hidden sm:flex lg:left-[45%] lg:top-[9%]"
      />

      {/*
        Card B — low on the left, against Balochistan's coast. The one card
        shown at every width, because it is the furthest from the route.

        Inset from the edge rather than flush to it: at left-0 the panel is
        full-bleed below lg, so the card sat hard against the viewport and
        its icon was clipped at both 820 and 390.
      */}
      <Card
        icon={<Route size={14} aria-hidden="true" />}
        title="Route ready"
        detail="Plan charging stops"
        className="journey-float-b bottom-[16%] left-[4%] lg:bottom-[18%] lg:left-[2%] 2xl:left-[7%]"
      />

      {/*
        Card C — low right, clear of the route's southern leg. Dropped below
        `lg`: at 820 and under it collides with the road.
      */}
      <Card
        icon={<MapPin size={14} aria-hidden="true" />}
        title="Live network"
        detail="Explore across Pakistan"
        className="journey-float-c bottom-[9%] right-[24%] hidden lg:flex 2xl:right-[29%]"
      />
    </>
  )
}
