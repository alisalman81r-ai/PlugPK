// src/components/business/BusinessHero.tsx
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

import { Button, ConnectorBadge } from '@/components/ui'

const TRUST = ['Free to list', 'No commission', 'Live in 24 hours']

const PREVIEW_STATS = [
  { value: '1,240', label: 'Views' },
  { value: '89', label: 'Clicks' },
  { value: '4.8', label: 'Rating' },
]

export function BusinessHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-24 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-600/[0.18] blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-cyan-500/[0.12] blur-[100px]"
      />

      <div className="container-plug relative z-10">
        <div className="grid items-center gap-20 lg:grid-cols-2">
          <div>
            <span className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-widest text-white/80">
              For Businesses
            </span>

            <h1 className="mb-6 text-5xl font-black text-white lg:text-display-xl">
              Reach Pakistan&apos;s
              <br />
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Growing EV Community
              </span>
            </h1>

            <p className="mb-10 max-w-lg text-lg text-white/65">
              List your business on Plug.pk and connect with thousands of active EV owners
              searching for charging destinations every day.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                href="/business/signup"
                rightIcon={<ArrowRight size={18} />}
                className="h-14 rounded-xl bg-white px-8 text-base font-bold text-plug-blue-600 shadow-e3 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-xl"
              >
                List Your Business Free
              </Button>

              <Button href="#how-it-works" variant="outline-white" className="h-14 rounded-xl px-8">
                See How It Works
              </Button>
            </div>

            <ul className="mt-10 flex flex-wrap items-center gap-6">
              {TRUST.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0 text-plug-cyan-400" aria-hidden="true" />
                  <span className="text-sm text-white/70">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Dashboard preview ─────────────────────────────── */}
          <div className="relative hidden lg:block">
            <span className="absolute -top-[10px] right-[20px] z-20 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white shadow-[0_4px_16px_rgba(34,197,94,0.45)]">
              &#10003; Live on Plug.pk
            </span>

            <div className="animate-float rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-e4 backdrop-blur-xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <span className="min-w-0">
                  <span className="block truncate font-bold text-white">
                    Mall Road Premium Hotel
                  </span>
                  <span className="block text-sm text-white/50">Lahore, Punjab</span>
                </span>

                <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-green-400/30 bg-green-500/20 px-2.5 py-1">
                  <ShieldCheck size={12} className="text-green-400" aria-hidden="true" />
                  <span className="text-[10px] font-semibold text-green-300">Verified</span>
                </span>
              </div>

              <div className="mb-5 grid grid-cols-3 gap-3">
                {PREVIEW_STATS.map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-white/[0.08] p-3 text-center">
                    <p className="font-mono text-xl font-bold text-white">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-white/40">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-white/5 p-4">
                <p className="mb-3 text-xs uppercase tracking-wider text-white/60">Charger Status</p>

                {[
                  { type: 'CCS2' as const, power: '150 kW' },
                  { type: 'Type2' as const, power: '22 kW' },
                ].map((charger, index) => (
                  <div
                    key={charger.type}
                    className={`flex items-center justify-between gap-3 py-2 ${index === 0 ? 'border-b border-white/5' : ''}`}
                  >
                    <ConnectorBadge type={charger.type} size="sm" />
                    <span className="font-mono text-sm text-white">{charger.power}</span>
                    <span className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full bg-green-400"
                      />
                      <span className="text-xs text-white/60">Available</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
