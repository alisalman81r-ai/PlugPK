// src/components/home/HeroShowcase.tsx

import {
  Bell,
  BatteryCharging,
  ChevronRight,
  Home,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Navigation,
  Route,
  Search,
  User,
  Zap,
} from 'lucide-react'
import Image from 'next/image'

import { FAST_CHARGER_KW, type HeroMapPin } from '@/lib/charging'
import { estimateDriveMinutes, getRoadDistanceKm } from '@/lib/route-distances'
import { Logo } from '@/components/ui/Logo'

/**
 * The right half of the hero: the app on a phone, the car it belongs to, and
 * the country behind them both, with readings floating around the group.
 *
 * ── One drawing, scaled as a whole ────────────────────────────────────
 *
 * The composition is laid out on a fixed 935 × 760 design frame. Positions are
 * percentages of that frame, and every size is in `em`, where the root sets
 * 1em to a tenth of a design pixel's worth of the container's width
 * (100cqw / 93.5). So `width: 30em` is 300 design pixels at any width, and the
 * phone, the car, the map and the cards shrink together instead of sliding
 * into one another on a narrower screen.
 *
 * ── What is real and what is the demo ─────────────────────────────────
 *
 * The station on the phone and on the cards is the fastest one in the
 * database, at the power it actually delivers and with the ports actually
 * free. The route reads its distance and time from the same table the route
 * planner uses. The battery level and range are the demo's — this is a picture
 * of the app, and a car has no battery to read until somebody signs in.
 *
 * aria-hidden throughout: every figure here is available, readably, on /map
 * and the station pages.
 */

/** The design frame, in design pixels. */
const FRAME_W = 935
const FRAME_H = 760

const pos = (x: number, y: number) => ({
  left: `${(x / FRAME_W) * 100}%`,
  top: `${(y / FRAME_H) * 100}%`,
})

/** A map pin: a teardrop with its point at (0, 0). */
function Pin({ x, y, bolt, scale = 1 }: { x: number; y: number; bolt?: boolean; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={0} rx={9} ry={3.5} fill="#3EE0B0" opacity={0.35} filter="url(#pm-soft)" />
      <path
        d="M0 0 C -4 -9 -16 -18 -16 -30 A 16 16 0 1 1 16 -30 C 16 -18 4 -9 0 0 Z"
        fill="#46E3B5"
        filter="url(#pm-pin-glow)"
      />
      {bolt ? (
        <path d="M2.5 -41 L -6 -28 L -0.5 -28 L -2.5 -19 L 6 -32 L 0.5 -32 Z" fill="#06231D" />
      ) : (
        <circle cx={0} cy={-30} r={6} fill="#06231D" />
      )}
    </g>
  )
}

/**
 * The route on the phone: Islamabad to Lahore, with a branch west to a
 * charger, over the design's network of pale veins.
 *
 * Drawn in the design's own pixel space — the viewBox is the tile's box in a
 * 3× enlargement of the reference — so every line and pin sits where the
 * design has it. The veins are strokes, not a noise filter: the design's are
 * distinct branching lines, and noise read as terrain.
 */
const PM_VEINS = [
  'M 25 130 C 90 120 150 112 200 98 S 270 64 305 38',
  'M 25 332 C 70 300 120 272 175 232 S 280 150 330 128 S 400 100 425 92',
  'M 170 440 C 210 390 250 344 300 314 S 380 250 430 228 S 540 170 600 160 S 690 150 725 146',
  'M 440 112 C 500 100 560 92 610 76 S 690 50 725 40',
  'M 455 205 C 520 212 575 228 620 252 S 690 290 725 300',
  'M 330 48 C 348 90 360 124 350 160 S 332 210 336 240',
  'M 590 300 C 612 336 632 372 668 398 S 710 420 725 428',
  'M 80 440 C 140 410 200 384 250 392 S 300 420 330 440',
  'M 25 222 C 70 214 110 200 150 204 S 220 226 240 250',
  'M 520 440 C 540 410 560 396 600 384 S 680 366 725 360',
  'M 250 30 C 262 60 280 80 300 92',
  'M 600 30 C 606 60 628 88 660 104 S 710 118 725 120',
]
const PM_ROUTES = [
  // Islamabad down to the junction, then up to the western charger.
  'M 415 100 C 410 140 392 204 372 238 S 334 282 316 290 C 300 268 292 232 290 186',
  // Islamabad down to Lahore.
  'M 415 100 C 424 150 428 208 440 262 S 474 352 490 405',
]

function PhoneMap() {
  return (
    <svg viewBox="25 5 700 435" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="pm-ground" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F3A2F" />
          <stop offset="55%" stopColor="#0B2F26" />
          <stop offset="100%" stopColor="#0A2A22" />
        </linearGradient>
        <filter id="pm-terrain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="3" result="n" />
          <feDiffuseLighting in="n" surfaceScale="5" lightingColor="#6FE9C2" result="l">
            <feDistantLight azimuth="225" elevation="40" />
          </feDiffuseLighting>
          <feColorMatrix in="l" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.85  0 0 0 0 0.66  0 1.1 0 0 -0.55" />
        </filter>
        <filter id="pm-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="pm-vein-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id="pm-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="pm-pin-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="25" y="5" width="700" height="435" fill="url(#pm-ground)" />
      <rect x="25" y="5" width="700" height="435" filter="url(#pm-terrain)" opacity={0.28} />

      {/* The veins: a soft pass for the glow, a thin pass for the line. */}
      <g fill="none" stroke="#5CF0C3" strokeLinecap="round">
        {PM_VEINS.map((d) => (
          <path key={`g${d}`} d={d} strokeWidth={6} strokeOpacity={0.12} filter="url(#pm-vein-glow)" />
        ))}
        {PM_VEINS.map((d) => (
          <path key={d} d={d} strokeWidth={2} strokeOpacity={0.32} />
        ))}
      </g>

      {/* The routes, lit. */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {PM_ROUTES.map((d) => (
          <path key={`g${d}`} d={d} stroke="#46E3B5" strokeWidth={22} strokeOpacity={0.4} filter="url(#pm-glow)" />
        ))}
        {PM_ROUTES.map((d) => (
          <path key={d} d={d} stroke="#8AF8D8" strokeWidth={8} />
        ))}
      </g>

      <Pin x={415} y={100} scale={1.2} />
      <Pin x={290} y={186} scale={1.85} bolt />
      <Pin x={490} y={405} scale={1.85} bolt />

      {/* Labels on dark chips, as the design sets them. */}
      <g fontWeight={500} fontSize={30} fill="#fff">
        <rect x={442} y={52} width={170} height={48} rx={12} fill="#08231D" fillOpacity={0.85} />
        <text x={455} y={87}>Islamabad</text>
        <rect x={522} y={364} width={138} height={48} rx={12} fill="#08231D" fillOpacity={0.85} />
        <text x={535} y={399}>Lahore</text>
      </g>
    </svg>
  )
}

interface FloatCardProps {
  x: number
  y: number
  w: number
  icon: React.ReactNode
  children: React.ReactNode
  float?: 'a' | 'b' | 'c'
}

function FloatCard({ x, y, w, icon, children, float = 'a' }: FloatCardProps) {
  return (
    <div
      className={
        'absolute z-30 flex items-center gap-[1.3em] text-white rounded-[1.4em] border border-[#7CF5CF]/[0.16] ' +
        'bg-[#0A221D]/80 px-[1.5em] py-[1.35em] shadow-[0_1.6em_3.2em_-1.2em_rgba(0,0,0,0.7)] backdrop-blur-md ' +
        `journey-float-${float} motion-reduce:animate-none`
      }
      style={{ ...pos(x, y), width: `${w / 10}em` }}
    >
      <span className="flex shrink-0 items-center justify-center text-[#46E3B5]">{icon}</span>
      <span className="flex min-w-0 flex-col">{children}</span>
    </div>
  )
}

/** The phone's extrusion, front to back: lit metal darkening toward the rear. */
const PHONE_DEPTH = [
  { z: 0.5, color: '#869A93' },
  { z: 1, color: '#74877F' },
  { z: 1.5, color: '#63756F' },
  { z: 2, color: '#52635E' },
  { z: 2.5, color: '#41514C' },
] as const

/**
 * The bed's soft edges: two linear fades intersected, so it dissolves over
 * 16em at the left (under the phone), 7em above, 4em below — the band ends
 * soon after the frame — and runs out past the right edge of the viewport.
 */
const BED_MASK = {
  maskImage:
    'linear-gradient(to right, transparent, #000 16em, #000), linear-gradient(to bottom, transparent, #000 7em, #000 calc(100% - 4em), transparent)',
  WebkitMaskImage:
    'linear-gradient(to right, transparent, #000 16em, #000), linear-gradient(to bottom, transparent, #000 7em, #000 calc(100% - 4em), transparent)',
  maskComposite: 'intersect',
  WebkitMaskComposite: 'source-in',
} as const

export interface HeroShowcaseProps {
  pins: readonly HeroMapPin[]
}

export function HeroShowcase({ pins }: HeroShowcaseProps) {
  const byPower = [...pins].sort((a, b) => b.maxPowerKw - a.maxPowerKw)
  const station = byPower[0]

  const kw = station ? Math.round(station.maxPowerKw) : 150
  const isFast = station ? station.maxPowerKw >= FAST_CHARGER_KW : true
  const stationName = station?.name ?? 'Shell Recharge'
  const ports = station ? `${station.availablePorts} / ${station.ports}` : '4 / 4'
  const available = station ? station.availablePorts > 0 : true

  const routeKm = getRoadDistanceKm('Lahore', 'Islamabad')
  const routeMin = routeKm !== null ? estimateDriveMinutes(routeKm) : null
  const routeLine =
    routeKm !== null && routeMin !== null
      ? `${Math.floor(routeMin / 60)}h ${routeMin % 60}m  •  ${routeKm} km`
      : 'Plan charging stops'

  return (
    <div className="w-full [container-type:inline-size]" aria-hidden="true">
      <div
        className="relative w-full select-none text-[calc(100cqw/93.5)]"
        style={{ aspectRatio: `${FRAME_W} / ${FRAME_H}` }}
      >
        {/*
          ── The scene ─────────────────────────────────────────────────
          The map, its route and pins, the light pooling round them, the car,
          the charger and the car's shadow on the floor — cut from the design
          by scripts/make-hero-scene.mjs, so they are the design's own and not
          a redrawing of it. It starts at design x 294, on the design's own phone
          frame, and the live phone's frame and side cover that edge.

          Held still. The map used to bob on an 11.6s loop, which read as the
          country drifting loose behind a car standing on the ground.
        */}
        {/*
          The bed the scene lies on: the design's own ground colour, sampled
          along the scene's edges (#09261F), fading out beyond them. Without it
          the scene's rectangle showed wherever the page's ground is a shade
          lighter than the design's — most of all on a phone — and the page's
          dot lattice stopped dead at its edge.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-[1] bg-[#09261F]"
          style={{ ...pos(110, -70), width: '96em', height: '86em', ...BED_MASK }}
        />
        <div className="absolute z-10" style={{ ...pos(294, 0), width: '64.1em' }}>
          <Image
            src="/images/hero/hero-scene-v4.png"
            alt=""
            width={641}
            height={760}
            sizes="(max-width: 1024px) 70vw, 680px"
            quality={92}
            className="h-auto w-full"
            priority
          />
        </div>

        {/* ── The phone ───────────────────────────────────────────── */}
        {/*
          Turned the way the design turns it.

          The transform is fitted, not eyeballed: a small search over
          perspective and the three rotations against the four corners of the
          phone in the reference, which it hits to within a design pixel. The
          phone faces a little left (its right side toward you) and leans back,
          which is why its right edge is taller than its left and its foot wider
          than its head.

          The phone has depth: five copies of the frame's outline stacked
          behind it in the same 3D space. Turned, they show as one metal band
          down the right side that follows the rounded corners — a flat side
          panel could not, and stopped short of them. preserve-3d is what keeps
          them in the phone's space rather than flattened onto it.
        */}
        <div
          className="absolute z-40 [transform-style:preserve-3d] [transform:translate(0.02em,-0.83em)_perspective(217.4em)_rotateY(-18.24deg)_rotateX(7.87deg)_rotateZ(0.13deg)_scale(0.989)]"
          style={{ ...pos(0, 36), width: '30em', height: '63.4em' }}
        >
          {PHONE_DEPTH.map((layer) => (
            <div
              key={layer.z}
              aria-hidden="true"
              className="absolute inset-0 rounded-[4.8em]"
              style={{ transform: `translateZ(-${layer.z}em)`, background: layer.color }}
            />
          ))}
          <div className="absolute inset-0 rounded-[4.8em] bg-[linear-gradient(145deg,#AFC2BB_0%,#7D918A_16%,#55675F_45%,#6C8079_72%,#3A4A45_100%)] p-[0.8em] shadow-[0_4em_8em_-2em_rgba(0,0,0,0.85),0_0_5em_-1em_rgba(70,227,181,0.16),inset_0_0_0_0.1em_rgba(255,255,255,0.22)]">
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[4.1em] bg-gradient-to-b from-[#0A1F1C] to-[#061513] px-[1.4em] pb-[0.9em] text-white shadow-[0_0_0_0.3em_#050A09]">
              {/* Dynamic island */}
              <div className="absolute left-1/2 top-[1em] h-[2.6em] w-[9em] -translate-x-1/2 rounded-full bg-black" />

              {/* Status bar */}
              <div className="flex items-center justify-between px-[1.6em] pt-[1.5em] text-[1.15em] font-semibold">
                <span>9:41</span>
                <span className="flex items-center gap-[0.3em]">
                  <svg viewBox="0 0 17 11" className="h-[0.75em] w-[1.1em]" fill="currentColor">
                    <rect x="0" y="7" width="3" height="4" rx="0.7" />
                    <rect x="4.5" y="5" width="3" height="6" rx="0.7" />
                    <rect x="9" y="2.5" width="3" height="8.5" rx="0.7" />
                    <rect x="13.5" y="0" width="3" height="11" rx="0.7" />
                  </svg>
                  <svg viewBox="0 0 16 11" className="h-[0.75em] w-[1.05em]" fill="currentColor">
                    <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.3 10.3 0 0 0 8 .4 10.3 10.3 0 0 0 .8 3.3L2 4.6a8.5 8.5 0 0 1 6-2.4Zm0 3.5c1.3 0 2.5.5 3.5 1.4l1.2-1.3A6.8 6.8 0 0 0 8 3.9a6.8 6.8 0 0 0-4.7 1.9l1.2 1.3c1-.9 2.2-1.4 3.5-1.4Zm0 3.4a1.6 1.6 0 1 0 0 3.2l1.9-2a2.7 2.7 0 0 0-1.9-1.2Z" />
                  </svg>
                  <span className="relative ml-[0.1em] h-[0.8em] w-[1.7em] rounded-[0.25em] border border-white/60 p-[0.1em]">
                    <span className="block h-full w-[80%] rounded-[0.12em] bg-white" />
                  </span>
                </span>
              </div>

              {/* App header */}
              <div className="mt-[2em] flex items-center justify-between px-[0.4em]">
                <Logo size="text-[1.65em]" />
                <span className="relative">
                  <Bell className="h-[1.7em] w-[1.7em] text-white/90" strokeWidth={1.8} />
                  <span className="absolute right-[0.1em] top-[0.1em] h-[0.55em] w-[0.55em] rounded-full bg-[#FF5A5F] ring-[0.15em] ring-[#0A1F1C]" />
                </span>
              </div>

              {/* Battery card */}
              <div className="relative mt-[1.4em] flex h-[7.2em] items-center overflow-hidden rounded-[1.6em] border border-white/[0.07] bg-gradient-to-r from-[#12332C] to-[#0E2622] pl-[1.2em]">
                <span className="relative flex h-[3.6em] w-[2.3em] items-end rounded-[0.5em] bg-[#46E3B5] shadow-[0_0_1.2em_rgba(70,227,181,0.35)]">
                  <span className="absolute -top-[0.55em] left-1/2 h-[0.35em] w-[0.9em] -translate-x-1/2 rounded-t-[0.2em] bg-[#46E3B5]" />
                  <span className="absolute inset-x-[0.35em] top-[0.35em] h-[0.5em] rounded-[0.15em] bg-[#0A2A22]/25" />
                </span>
                <span className="ml-[1.1em] flex flex-col">
                  <span className="text-[1.9em] font-bold leading-none tracking-[-0.02em]">72%</span>
                  <span className="mt-[0.5em] text-[0.75em] leading-tight text-white/60">
                    Estimated range
                    <br />
                    210 km
                  </span>
                </span>
                {/* The reference's own thumbnail, faded in from the left so
                    it prints onto the card rather than sitting on it. */}
                <Image
                  src="/images/hero/hero-car-thumb.png"
                  alt=""
                  width={91}
                  height={62}
                  sizes="100px"
                  className="absolute bottom-0 right-0 h-full w-auto [mask-image:linear-gradient(to_right,transparent,#000_28%)]"
                />
              </div>

              {/* Route row */}
              <div className="mt-[1em] flex h-[5.6em] items-center gap-[1em] rounded-[1.5em] border border-white/[0.07] bg-[#0F2723] px-[1.2em]">
                <Route className="h-[1.7em] w-[1.7em] shrink-0 text-white/80" strokeWidth={1.8} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[1.1em] font-semibold">Lahore → Islamabad</span>
                  <span className="mt-[0.2em] whitespace-pre text-[0.9em] text-white/60">{routeLine}</span>
                </span>
                <ChevronRight className="h-[1.5em] w-[1.5em] shrink-0 text-white/60" />
              </div>

              {/* Search */}
              <div className="mt-[1em] flex h-[4.2em] items-center justify-between rounded-[1.4em] border border-white/[0.07] bg-[#132B26] px-[1.4em]">
                <span className="text-[1em] text-white/75">Search chargers, cities or services...</span>
                <Search className="h-[1.4em] w-[1.4em] text-white/80" strokeWidth={2} />
              </div>

              {/* Map */}
              <div className="mt-[1em] h-[14.6em] overflow-hidden rounded-[1.6em] border border-white/[0.07]">
                <PhoneMap />
              </div>

              {/* Station card */}
              <div className="mt-[1em] rounded-[1.6em] border border-white/[0.07] bg-[#0F2723] p-[0.9em]">
                <div className="flex items-center gap-[1em]">
                  <span className="relative h-[5em] w-[4.6em] shrink-0 overflow-hidden rounded-[0.8em]">
                    <Image src="/images/hero/hero-station-thumb.png" alt="" fill sizes="48px" className="object-cover" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[1.15em] font-semibold">{stationName}</span>
                    <span className="mt-[0.15em] text-[0.9em] text-white/60">{kw} kW  •  2.4 km</span>
                    <span className="mt-[0.35em] flex items-center justify-between text-[0.95em] font-semibold">
                      <span className={available ? 'text-[#46E3B5]' : 'text-white/60'}>
                        {available ? 'Available' : 'All in use'}
                      </span>
                      <span className="text-white/75">{ports}</span>
                    </span>
                  </span>
                  <ChevronRight className="-mt-[2.2em] h-[1.4em] w-[1.4em] shrink-0 text-white/60" />
                </div>
                <div className="mt-[0.9em] flex h-[3.4em] items-center justify-center gap-[0.5em] rounded-[1em] bg-[#46E3B5] text-[1.1em] font-semibold text-[#06231D]">
                  <Navigation className="h-[1em] w-[1em] fill-[#06231D]" strokeWidth={2} />
                  Start Navigation
                </div>
              </div>

              {/* Tab bar */}
              <div className="mt-auto flex items-end justify-between px-[0.6em] pt-[1em]">
                {[
                  { icon: Home, label: 'Home', active: true },
                  { icon: MapIcon, label: 'Map' },
                  { icon: Route, label: 'Routes' },
                  { icon: LayoutGrid, label: 'Services' },
                  { icon: User, label: 'Profile' },
                ].map(({ icon: Icon, label, active }) => (
                  <span
                    key={label}
                    className={
                      'flex flex-col items-center gap-[0.35em] ' + (active ? 'text-[#46E3B5]' : 'text-white/55')
                    }
                  >
                    <Icon className={'h-[1.6em] w-[1.6em] ' + (active ? 'fill-[#46E3B5]/90' : '')} strokeWidth={1.8} />
                    <span className="text-[0.8em]">{label}</span>
                  </span>
                ))}
              </div>
              <div className="mx-auto mt-[1.1em] h-[0.4em] w-[11em] rounded-full bg-white/85" />
            </div>
          </div>
        </div>

        {/* ── The floating readings ───────────────────────────────── */}
        <FloatCard x={332} y={60} w={164} float="a" icon={<Zap className="h-[2.6em] w-[2.6em]" strokeWidth={1.6} />}>
          <span className="text-[1.45em] font-semibold leading-tight">{kw} kW</span>
          <span className="mt-[0.2em] text-[1.2em] text-white/70">{isFast ? 'Fast charger' : 'Standard charger'}</span>
          <span className={'mt-[0.25em] text-[1.2em] font-semibold ' + (available ? 'text-[#46E3B5]' : 'text-white/60')}>
            {available ? 'Available' : 'All in use'}
          </span>
        </FloatCard>

        <FloatCard x={707} y={72} w={176} float="b" icon={<BatteryCharging className="h-[2.8em] w-[2.8em] -rotate-90" strokeWidth={1.6} />}>
          <span className="text-[1.45em] font-semibold leading-tight">72%</span>
          <span className="mt-[0.2em] text-[1.15em] text-white/70">Battery level</span>
          <span className="mt-[0.9em] h-[0.4em] w-[9em] overflow-hidden rounded-full bg-white/15">
            <span className="block h-full w-[60%] rounded-full bg-white" />
          </span>
        </FloatCard>

        <FloatCard x={672} y={218} w={211} float="c" icon={<Route className="h-[2.6em] w-[2.6em]" strokeWidth={1.6} />}>
          <span className="text-[1.45em] font-semibold leading-tight">Lahore → Islamabad</span>
          <span className="mt-[0.25em] whitespace-pre text-[1.2em] text-white/70">{routeLine}</span>
        </FloatCard>

        <FloatCard x={697} y={367} w={180} float="a" icon={<MapPin className="h-[2.6em] w-[2.6em] fill-[#46E3B5] text-[#46E3B5] [&>circle]:fill-[#0A221D]" strokeWidth={1.6} />}>
          <span className="text-[1.45em] font-semibold leading-tight">2.4 km away</span>
          <span className="mt-[0.25em] truncate text-[1.2em] text-white/70">{stationName}</span>
        </FloatCard>
      </div>
    </div>
  )
}
