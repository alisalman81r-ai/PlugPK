// src/components/home/AppBanner.tsx
import { BatteryCharging, Car, Navigation2, Search, Zap } from 'lucide-react'

import { getCityCoordinates } from '@/lib/city-coordinates'
import { PATH_D, VIEW_BOX, project } from './PakistanMap'
import { PIN_BOLT_D, PIN_D } from './station-pin'
import { LogoMark } from '@/components/ui/Logo'

/**
 * The app announcement: a handset on a dark panel, and the pitch beside it.
 *
 * Laid out like a store landing band — the phone tilted off a pine panel on
 * the left, a status line, the heading, three illustrated feature cards and
 * the app card beside them.
 *
 * The app does not exist yet, so nothing here pretends it does. The status
 * line says "Coming soon" where a store rating would sit, and the store
 * badges carry `aria-disabled` and a visible "Coming soon" rather than looking
 * like live download links. There is no QR code, because there is nothing for
 * it to point at. When the app ships, those three places are what change.
 *
 * The handset screen is an illustration of the app, not a screenshot of data:
 * the map is streets without names and the pins mark no real station, so it
 * never reads as a claim that a charger exists somewhere it does not.
 */

interface StoreBadge {
  eyebrow: string
  name: string
  icon: (props: { className?: string }) => React.JSX.Element
}

const STORES: StoreBadge[] = [
  { eyebrow: 'Download on the', name: 'App Store', icon: AppleLogo },
  { eyebrow: 'Get it on', name: 'Google Play', icon: GooglePlayLogo },
]

interface Feature {
  title: string
  art: () => React.JSX.Element
}

const FEATURES: Feature[] = [
  { title: 'Find a charger near you', art: ChargerArt },
  { title: 'Plan trips around your range', art: RouteArt },
  { title: 'See which ports are free', art: AvailabilityArt },
]

export function AppBanner() {
  return (
    <section id="app" className="scroll-mt-24 overflow-x-clip bg-white py-16 lg:py-24">
      <div className="container-plug">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,4.3fr)_minmax(0,7.7fr)] lg:gap-12 xl:gap-16">
          {/* ── The handset on its panel ─────────────────────────── */}
          <div aria-hidden="true" className="relative mx-auto h-[500px] w-full max-w-[520px] sm:h-[560px] lg:h-[600px]">
            <div className="absolute inset-y-6 left-0 right-[14%] overflow-hidden rounded-[2rem] rounded-tr-[7rem] bg-plug-navy-950 sm:rounded-tr-[9rem]">
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-plug-cyan-500/25 blur-[110px]" />
              <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-plug-cyan-500/10 blur-[90px]" />
              <div className="grain" />
            </div>

            {/* Ground shadow, so the phone stands off the panel. */}
            <div className="absolute bottom-10 left-[58%] h-10 w-56 -translate-x-1/2 rounded-full bg-black/40 blur-2xl" />

            <div className="absolute left-[58%] top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[14deg] scale-[0.82] sm:scale-95 lg:scale-[0.82] xl:scale-100">
              <Handset />
            </div>
          </div>

          {/* ── The pitch ──────────────────────────────────────── */}
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-plug-cyan-200 bg-plug-cyan-50 px-4 py-1.5 text-ui-sm font-semibold text-plug-cyan-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-plug-cyan-500 opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-plug-cyan-500" />
              </span>
              Coming soon to iOS &amp; Android
            </span>

            <h2 className="mt-6 text-balance text-[clamp(2.25rem,5vw,3.75rem)] font-black leading-[1.02] tracking-[-0.035em] text-slate-900">
              Get the <span className="text-plug-cyan-600">plug.pk</span> app
            </h2>

            <p className="mt-5 max-w-lg text-pretty text-ui-lg leading-relaxed text-slate-500">
              The one charging app an EV driver in Pakistan needs.
              <br className="hidden sm:block" /> Every charger, every route and every port, in your pocket.
            </p>

            <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.15fr)] xl:items-end">
                {FEATURES.map((feature) => {
                  const Art = feature.art
                  return (
                    <li
                      key={feature.title}
                      className="flex flex-col items-center rounded-2xl rounded-tr-[3.5rem] bg-plug-cyan-50 px-4 pb-7 pt-6 text-center sm:min-h-[270px] xl:min-h-[250px] xl:px-3"
                    >
                      <div className="flex h-36 w-full items-center justify-center xl:h-28">
                        <Art />
                      </div>
                      <p className="mt-auto text-balance pt-4 text-ui font-semibold leading-snug text-slate-900">
                        {feature.title}
                      </p>
                    </li>
                  )
                })}
              {/* The app card: its own row below the features, a raised fourth
                  column beside them on wide screens. */}
              <li className="mt-4 flex flex-col items-center rounded-3xl border border-slate-200 bg-white/95 p-6 text-center shadow-[0_24px_60px_-24px_rgba(5,36,30,0.35)] backdrop-blur sm:col-span-3 sm:flex-row sm:text-left xl:col-span-1 xl:mt-0 xl:translate-y-6 xl:flex-col xl:px-5 xl:text-center">
                <span className="-mt-14 flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-[1.4rem] bg-plug-navy-950 shadow-[0_12px_28px_-10px_rgba(5,36,30,0.6)] sm:-mt-0 xl:-mt-14">
                  <LogoMark className="h-7 w-7" />
                  <span className="mt-1 text-[13px] font-bold leading-none tracking-[-0.03em]">
                    <span className="text-white">plug</span>
                    <span className="text-[#6FE8B6]">.pk</span>
                  </span>
                </span>

                <div className="mt-4 sm:ml-5 sm:mt-0 xl:ml-0 xl:mt-4">
                  <p className="text-ui font-bold text-slate-900">Launching soon</p>
                  <p className="mt-1 text-ui-sm text-slate-500">
                    Free on iOS and Android.
                  </p>
                </div>

                <div className="mt-5 flex w-full max-w-[15rem] flex-col gap-2 sm:ml-auto sm:mt-0 sm:w-auto xl:ml-0 xl:mt-5 xl:w-full">
                  {STORES.map((store) => {
                    const Icon = store.icon
                    return (
                      <span
                        key={store.name}
                        role="button"
                        aria-disabled="true"
                        aria-label={`${store.name} — coming soon`}
                        className="flex cursor-not-allowed items-center gap-2.5 rounded-xl bg-black px-3.5 py-2.5 text-left ring-1 ring-white/10"
                      >
                        <Icon className="h-[22px] w-[22px] shrink-0" />
                        <span className="min-w-0">
                          <span className="block whitespace-nowrap text-[8.5px] uppercase leading-tight tracking-wide text-white/55">
                            {store.eyebrow}
                          </span>
                          <span className="block whitespace-nowrap text-ui-sm font-semibold leading-tight text-white">
                            {store.name}
                          </span>
                        </span>
                      </span>
                    )
                  })}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── The handset ──────────────────────────────────────────────────── */

function Handset() {
  return (
    <div className="relative h-[520px] w-[258px] rounded-[46px] bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 p-[3px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.75)]">
      <div className="h-full w-full rounded-[43px] bg-slate-950 p-[9px]">
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[35px] bg-white">
          {/* Status bar and island */}
          <div className="relative flex h-9 shrink-0 items-center justify-between px-6 text-[11px] font-semibold text-slate-900">
            <span>9:41</span>
            <span className="absolute left-1/2 top-2 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-slate-950" />
            <span className="flex items-center gap-1">
              <span className="flex items-end gap-[1.5px]">
                <span className="h-1 w-[3px] rounded-sm bg-slate-900" />
                <span className="h-1.5 w-[3px] rounded-sm bg-slate-900" />
                <span className="h-2 w-[3px] rounded-sm bg-slate-900" />
                <span className="h-2.5 w-[3px] rounded-sm bg-slate-900" />
              </span>
              <span className="ml-1 h-2.5 w-5 rounded-[3px] border border-slate-900 p-[1px]">
                <span className="block h-full w-3/4 rounded-[1px] bg-slate-900" />
              </span>
            </span>
          </div>

          {/* Greeting and vehicle */}
          <div className="px-4 pb-3 pt-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Assalam-o-Alaikum</p>
                <p className="text-[19px] font-black leading-tight tracking-[-0.02em] text-slate-900">Where to today?</p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-plug-cyan-50">
                <Zap size={14} className="fill-plug-cyan-600 text-plug-cyan-600" />
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-plug-navy-950">
                <Car size={14} className="text-plug-cyan-300" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold leading-tight text-slate-900">My EV</p>
                <p className="whitespace-nowrap text-[10px] leading-tight text-slate-500">72% · 263 km range</p>
              </div>
              <span className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-200">
                <span className="block h-full w-[72%] rounded-full bg-plug-cyan-500" />
              </span>
            </div>
          </div>

          {/* Map */}
          <div className="relative min-h-0 flex-1">
            <PhoneMap />

            <div className="absolute left-3 right-3 top-3 flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-[0_6px_16px_-6px_rgba(5,36,30,0.35)]">
              <Search size={12} className="text-slate-400" />
              <span className="text-[11px] text-slate-400">Search chargers or cities</span>
            </div>

            <span className="absolute right-3 top-14 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_6px_16px_-6px_rgba(5,36,30,0.35)]">
              <Navigation2 size={13} className="fill-plug-navy-950 text-plug-navy-950" />
            </span>

            {/* Bottom sheet */}
            <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-4 pb-6 pt-2 shadow-[0_-10px_24px_-12px_rgba(5,36,30,0.3)]">
              <span className="mx-auto block h-1 w-9 rounded-full bg-slate-200" />
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-plug-cyan-50">
                  <BatteryCharging size={17} className="text-plug-cyan-600" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold leading-tight text-slate-900">Nearest fast charger</p>
                  <p className="text-[10px] leading-tight text-slate-500">DC · 60 kW · 2.4 km away</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                  2 free
                </span>
              </div>
              <span className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-plug-navy-950 py-2.5 text-[11px] font-bold text-white">
                <Zap size={11} className="fill-plug-cyan-400 text-plug-cyan-400" />
                Navigate there
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Side buttons */}
      <span className="absolute -left-[3px] top-28 h-10 w-[3px] rounded-l bg-slate-400" />
      <span className="absolute -left-[3px] top-40 h-14 w-[3px] rounded-l bg-slate-400" />
      <span className="absolute -right-[3px] top-32 h-16 w-[3px] rounded-r bg-slate-400" />
    </div>
  )
}

/** An unnamed street map. No labels and no real places. */
function PhoneMap() {
  return (
    <svg viewBox="0 0 240 320" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <rect width="240" height="320" fill="#EEF3F1" />
      {/* Parks */}
      <path d="M 14 60 L 78 52 L 92 112 L 30 124 Z" fill="#D2EEDC" />
      <path d="M 150 170 L 226 160 L 232 224 L 160 236 Z" fill="#D2EEDC" />
      <circle cx="60" cy="230" r="22" fill="#D2EEDC" />
      {/* Water */}
      <path d="M -10 150 C 40 140, 70 175, 120 165 S 200 120, 260 132" fill="none" stroke="#C9E6F2" strokeWidth="11" />
      {/* Minor streets */}
      <g stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round">
        <path d="M 0 40 L 240 20" />
        <path d="M 0 96 L 240 80" />
        <path d="M 0 205 L 240 190" />
        <path d="M 0 270 L 240 258" />
        <path d="M 40 0 L 56 320" />
        <path d="M 112 0 L 126 320" />
        <path d="M 190 0 L 204 320" />
      </g>
      {/* Main roads */}
      <path d="M -10 300 C 60 240, 110 200, 150 120 S 210 30, 260 10" fill="none" stroke="#E4DBB8" strokeWidth="11" strokeLinecap="round" />
      <path d="M -10 300 C 60 240, 110 200, 150 120 S 210 30, 260 10" fill="none" stroke="#FBEFC2" strokeWidth="8" strokeLinecap="round" />
      <path d="M 0 140 L 240 118" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
      {/* The route to the highlighted pin */}
      <path d="M 96 214 L 118 188 L 150 120 L 168 96" fill="none" stroke="#26CDB2" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 7" />
      {/* Pins */}
      {[
        { x: 40, y: 92 },
        { x: 204, y: 68 },
        { x: 190, y: 210 },
        { x: 70, y: 175 },
      ].map((p) => (
        <g key={`${p.x}-${p.y}`} transform={`translate(${p.x} ${p.y}) scale(0.72)`}>
          <path d={PIN_D} fill="#05241E" />
          <path d={PIN_BOLT_D} fill="#FFFFFF" />
        </g>
      ))}
      <g transform="translate(168 96) scale(0.95)">
        <path d={PIN_D} fill="#26CDB2" stroke="#05241E" strokeWidth="2" />
        <path d={PIN_BOLT_D} fill="#05241E" />
      </g>
      {/* You */}
      <circle cx="96" cy="214" r="14" fill="#26CDB2" opacity="0.2" />
      <circle cx="96" cy="214" r="6.5" fill="#26CDB2" stroke="#FFFFFF" strokeWidth="3" />
    </svg>
  )
}

/* ── Feature illustrations ────────────────────────────────────────── */

const INK = '#05241E'

/** Karachi up the corridor to Islamabad, through the map's own projection. */
const ROUTE_CITIES = ['karachi', 'multan', 'lahore', 'islamabad']
  .map(getCityCoordinates)
  .map((c) => (c ? project(c.lng, c.lat) : null))

function ChargerArt() {
  return (
    <svg viewBox="0 0 160 140" className="h-full w-auto" aria-hidden="true">
      <ellipse cx="80" cy="128" rx="46" ry="5" fill={INK} opacity="0.85" />
      {/* Pillar */}
      <rect x="44" y="16" width="52" height="108" rx="12" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
      <rect x="54" y="28" width="32" height="36" rx="6" fill="#26CDB2" stroke={INK} strokeWidth="2.5" />
      <path d="M 73 34 L 63 48 L 70 48 L 66 58 L 78 43 L 71 43 Z" fill={INK} />
      <rect x="54" y="74" width="32" height="6" rx="3" fill="#8EEEDA" />
      <rect x="54" y="86" width="20" height="6" rx="3" fill="#8EEEDA" />
      {/* Cable and plug */}
      <path d="M 96 90 C 128 90, 130 50, 116 40" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <rect x="104" y="20" width="24" height="24" rx="6" transform="rotate(-20 116 32)" fill="#FBBF24" stroke={INK} strokeWidth="3" />
      <path d="M 110 14 L 108 6 M 120 11 L 119 3" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      {/* Sparks */}
      <path d="M 136 58 L 146 54 M 138 70 L 148 72 M 20 40 L 30 44 M 18 58 L 28 56" stroke="#26CDB2" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function RouteArt() {
  const [khi, mul, lhr, isb] = ROUTE_CITIES
  return (
    <svg viewBox="0 0 160 140" className="h-full w-auto" aria-hidden="true">
      <ellipse cx="80" cy="130" rx="44" ry="5" fill={INK} opacity="0.85" />
      <svg x="14" y="2" width="132" height="124" viewBox={VIEW_BOX} overflow="visible">
        <path d={PATH_D} fill="#4FDCC4" stroke={INK} strokeWidth="14" strokeLinejoin="round" />
        {khi && mul && lhr && isb && (
          <>
            <path
              d={`M ${khi.x} ${khi.y} Q ${mul.x - 40} ${mul.y + 60} ${mul.x} ${mul.y} T ${lhr.x} ${lhr.y} L ${isb.x} ${isb.y}`}
              fill="none"
              stroke={INK}
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1 38"
            />
            <circle cx={khi.x} cy={khi.y} r="30" fill="#FFFFFF" stroke={INK} strokeWidth="14" />
            <g transform={`translate(${isb.x} ${isb.y}) scale(4)`}>
              <path d={PIN_D} fill="#FBBF24" stroke={INK} strokeWidth="2.5" />
              <path d={PIN_BOLT_D} fill={INK} />
            </g>
          </>
        )}
      </svg>
    </svg>
  )
}

function AvailabilityArt() {
  return (
    <svg viewBox="0 0 160 140" className="h-full w-auto" aria-hidden="true">
      <ellipse cx="72" cy="130" rx="38" ry="5" fill={INK} opacity="0.85" />
      {/* Phone */}
      <g transform="rotate(-10 70 72)">
        <rect x="40" y="14" width="62" height="110" rx="12" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
        <rect x="47" y="24" width="48" height="88" rx="6" fill="#8EEEDA" />
        <rect x="62" y="18" width="18" height="4" rx="2" fill={INK} />
        {/* Port meter */}
        <g>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={52 + i * 10} y="84" width="7" height="18" rx="2" fill={i < 2 ? '#26CDB2' : '#FFFFFF'} stroke={INK} strokeWidth="2" />
          ))}
        </g>
        <path d="M 74 40 L 62 58 L 70 58 L 66 72 L 80 52 L 72 52 Z" fill={INK} />
      </g>
      {/* Notification */}
      <g>
        <rect x="84" y="26" width="66" height="32" rx="10" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
        <circle cx="98" cy="42" r="6" fill="#22C55E" stroke={INK} strokeWidth="2" />
        <rect x="109" y="35" width="32" height="5" rx="2.5" fill={INK} />
        <rect x="109" y="45" width="22" height="4" rx="2" fill="#8EEEDA" />
      </g>
      <path d="M 120 70 L 130 76 M 128 64 L 140 64" stroke="#26CDB2" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* ── Store marks ──────────────────────────────────────────────────── */

/** The Apple mark, in white for the dark badge. */
function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path
        fill="#FFFFFF"
        d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
      />
    </svg>
  )
}

/** The Google Play mark, in its four colours. */
function GooglePlayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 26" className={className} aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M1.6 1.2 C1.2 1.5 1 2 1 2.6 V23.4 C1 24 1.2 24.5 1.6 24.8 L13.3 13 Z" />
      <path fill="#34A853" d="M1.6 1.2 C2.1 0.8 2.9 0.8 3.6 1.2 L17.4 9 L13.3 13 Z" />
      <path fill="#FBBC04" d="M17.4 9 L21.6 11.4 C22.9 12.1 22.9 13.9 21.6 14.6 L17.4 17 L13.3 13 Z" />
      <path fill="#EA4335" d="M1.6 24.8 C2.1 25.2 2.9 25.2 3.6 24.8 L17.4 17 L13.3 13 Z" />
    </svg>
  )
}
