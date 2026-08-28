// src/components/home/AppBanner.tsx
import { Apple, Play, Smartphone } from 'lucide-react'

/**
 * The app announcement, as a bounded panel rather than a full-bleed band.
 *
 * Two problems, both of them about where this sits rather than what it says.
 *
 * It was slate-900 running the full width, directly above a slate-950 footer
 * that opens with its own call to action. Two dark bands stacked with nothing
 * between them read as one long dark mass holding two different asks — "get
 * the app" and "find a charger" — with no edge to say where the page ended and
 * the site chrome began. Bounded to the measure and set on white, this reads as
 * the page's last panel and the footer reads as the footer. It is the same
 * treatment the Partner Up page already uses to close itself, so the two pages
 * now end the same way.
 *
 * And it was the one section still off the page's heading system: a bare
 * `text-4xl` with no eyebrow, no accent word and no rule, while every band
 * above it opens with the same three-part heading. It now uses that heading.
 *
 * The store buttons stay disabled, because the app does not exist yet. They
 * carry `aria-disabled` and a visible "Coming soon" rather than looking like
 * live download links — the header's Download App pill points here for exactly
 * that reason, so this is the page that has to be honest about it.
 */

interface StoreBadge {
  eyebrow: string
  name: string
  icon: typeof Apple
}

const STORES: StoreBadge[] = [
  { eyebrow: 'Download on the', name: 'App Store', icon: Apple },
  { eyebrow: 'Get it on', name: 'Google Play', icon: Play },
]

export function AppBanner() {
  return (
    <section id="app" className="scroll-mt-24 bg-white py-16 lg:py-24">
      <div className="container-plug">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 shadow-e4 sm:px-10 lg:px-14 lg:py-20">
          {/* The same atmosphere the Partner Up closing panel carries: a fine
              dot field for texture, and two soft brand blooms for depth. All
              of it behind the content and none of it in the way of the text. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="absolute -top-32 left-1/4 h-80 w-[32rem] -translate-x-1/2 rounded-full bg-plug-blue-600/30 blur-[120px]" />
            <div className="absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-plug-cyan-500/20 blur-[110px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-12 lg:flex-row lg:justify-between lg:gap-16">
            {/* ── The pitch ──────────────────────────────────────── */}
            <div className="max-w-xl text-center lg:text-left">
              <span className="inline-flex items-center gap-2 text-ui-xs font-bold uppercase tracking-[0.2em] text-cyan-300/90">
                <Smartphone size={13} aria-hidden="true" />
                Coming soon
              </span>

              <h2 className="mt-5 text-balance text-[clamp(2rem,4.5vw,3rem)] font-black leading-[1.04] tracking-[-0.03em] text-white">
                Take Plug.pk{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">
                  everywhere
                </span>
                .
              </h2>

              {/* The cap rule, in the tone this panel uses. */}
              <span
                aria-hidden="true"
                className="mx-auto mt-6 block h-0.5 w-12 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 lg:mx-0"
              />

              <p className="mx-auto mt-6 max-w-md text-pretty text-ui-lg leading-relaxed text-white/60 lg:mx-0">
                The complete EV companion in your pocket. Available on iOS and Android
                once it ships.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                {STORES.map((store) => {
                  const Icon = store.icon

                  return (
                    <span
                      key={store.name}
                      role="button"
                      aria-disabled="true"
                      aria-label={`${store.name} — coming soon`}
                      className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3"
                    >
                      <Icon size={20} className="shrink-0 text-white/70" aria-hidden="true" />
                      <span className="text-left">
                        <span className="block text-[10px] uppercase tracking-wide text-white/45">
                          {store.eyebrow}
                        </span>
                        <span className="block text-ui-sm font-semibold text-white/90">
                          {store.name}
                        </span>
                      </span>
                    </span>
                  )
                })}
              </div>
            </div>

            {/* ── The handset ────────────────────────────────────── */}
            <div
              aria-hidden="true"
              className="relative h-[380px] w-[210px] shrink-0 rounded-[36px] border border-white/12 bg-gradient-to-b from-white/[0.10] to-white/[0.02] p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]"
            >
              <span className="relative flex h-full w-full flex-col items-center justify-center gap-3 rounded-[28px] bg-slate-950/60">
                <span className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-white/25" />
                  <span className="h-1 w-8 rounded-full bg-white/15" />
                  <span className="h-1 w-1 rounded-full bg-white/25" />
                </span>

                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-6xl leading-none text-transparent">
                  &#9889;
                </span>
                <span className="text-lg font-bold tracking-tight">
                  <span className="text-white">plug</span>
                  <span className="text-plug-cyan-400">.pk</span>
                </span>

                <span className="absolute bottom-3 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/20" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
