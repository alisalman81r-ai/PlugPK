// src/components/home/PartnerCTA.tsx
import { PlugZap } from 'lucide-react'
import Image from 'next/image'

import { DiscButton } from '@/components/ui'

/**
 * Partner Up, on the home page.
 *
 * One dark band, one question and one button. The band is solid pine at rest;
 * pointing at (or tabbing to) the button fades a photograph of someone
 * plugging in up through it, and leaving the button fades it back out. The
 * picture is the answer to the question — this is what hosting a charger
 * looks like — so it only arrives when the reader shows interest.
 *
 * The reveal is CSS alone: the panel is a named group and the photo listens
 * for `:has(.disc-cta:hover)` on it, so there is no client boundary and no
 * state. Touch screens have no hover, so they simply keep the solid band.
 *
 * The button is the shared DiscButton, whose `disc-cta` class is what the
 * photo listens for.
 *
 * The copy says "free to list" because that is true — PartnerPricing publishes
 * a free tier. It deliberately does not promise "no cost, no maintenance":
 * plug.pk lists chargers, it does not install or service them.
 */
export function PartnerCTA() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container-plug">
        <div className="group/panel relative isolate overflow-hidden rounded-[2rem] bg-plug-navy-950 px-6 py-20 text-center sm:px-10 sm:py-24 lg:rounded-tr-[9rem] lg:py-32">
          {/* ── The ground: solid at rest, the photo on hover ───────── */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:26px_26px]" />
            <div className="absolute -top-40 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-plug-cyan-500/15 blur-[120px]" />

            <div className="absolute inset-0 scale-105 opacity-0 transition-[opacity,transform] duration-700 ease-out group-has-[.disc-cta:hover]/panel:scale-100 group-has-[.disc-cta:hover]/panel:opacity-100 group-has-[.disc-cta:focus-visible]/panel:scale-100 group-has-[.disc-cta:focus-visible]/panel:opacity-100 motion-reduce:transition-none">
              <Image
                src="/images/stations/mall-road-ev-hub-3.jpg"
                alt=""
                fill
                sizes="(min-width: 1280px) 1280px, 100vw"
                className="object-cover"
              />
              {/* Keeps the white type readable over any part of the photo. */}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,36,30,0.6)_0%,rgba(5,36,30,0.5)_50%,rgba(5,36,30,0.7)_100%)]" />
            </div>
          </div>

          {/* ── The ask ────────────────────────────────────────────── */}
          <span className="text-ui-sm font-bold uppercase tracking-[0.2em] text-plug-cyan-300">
            Partner up
          </span>

          <h2 className="mx-auto mt-5 max-w-4xl text-balance text-[clamp(2.25rem,6vw,4.5rem)] font-black leading-[1.05] tracking-[-0.035em] text-white">
            Own a hotel, restaurant or shopping mall?
          </h2>

          <p className="mx-auto mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-white/80 sm:text-xl">
            Host a charger and give EV drivers a reason to stop at yours. Listing on plug.pk is free.
          </p>

          <DiscButton href="/partners" icon={<PlugZap size={20} />} className="mx-auto mt-12">
            Partner up
          </DiscButton>
        </div>
      </div>
    </section>
  )
}
