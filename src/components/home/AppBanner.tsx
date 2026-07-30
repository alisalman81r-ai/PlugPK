// src/components/home/AppBanner.tsx
import { Smartphone } from 'lucide-react'

interface StoreBadge {
  eyebrow: string
  name: string
}

const STORES: StoreBadge[] = [
  { eyebrow: 'Download on the', name: 'App Store' },
  { eyebrow: 'Get it on', name: 'Google Play' },
]

export function AppBanner() {
  return (
    <section className="bg-slate-900 py-20">
      <div className="container-plug">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:justify-between">
          {/* ── Left ─────────────────────────────────────────────── */}
          <div>
            <span className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white">
              Coming Soon
            </span>

            <h2 className="mb-4 text-4xl font-black text-white">Take Plug.pk Everywhere</h2>

            <p className="mb-8 max-w-md text-lg text-white/60">
              The complete EV companion in your pocket. Available soon on iOS and Android.
            </p>

            <div className="flex flex-wrap gap-4">
              {STORES.map((store) => (
                <button
                  key={store.name}
                  type="button"
                  disabled
                  aria-label={`${store.name} — coming soon`}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-5 py-3 transition-colors duration-150 hover:bg-white/20 disabled:cursor-not-allowed"
                >
                  <Smartphone size={20} className="shrink-0 text-white" aria-hidden="true" />
                  <span className="text-left">
                    <span className="block text-[10px] text-white/50">{store.eyebrow}</span>
                    <span className="block text-sm font-semibold text-white">{store.name}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Right — phone mockup ─────────────────────────────── */}
          <div
            aria-hidden="true"
            className="relative h-[360px] w-[200px] shrink-0 rounded-[32px] border border-white/10 bg-white/5 shadow-[0_40px_80px_rgba(0,0,0,0.40)]"
          >
            <span className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span className="h-1 w-8 rounded-full bg-white/15" />
              <span className="h-1 w-1 rounded-full bg-white/25" />
            </span>

            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-6xl text-transparent">
                &#9889;
              </span>
              <span className="text-lg font-bold tracking-tight">
                <span className="text-white">plug</span>
                <span className="text-plug-cyan-400">.pk</span>
              </span>
            </span>

            <span className="absolute bottom-3 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </section>
  )
}
