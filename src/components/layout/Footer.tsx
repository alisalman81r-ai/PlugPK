// src/components/layout/Footer.tsx
import { Facebook, Instagram, Linkedin, Twitter, Zap, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { Container } from '@/components/ui'
import { cn } from '@/lib/utils'

interface FooterLink {
  label: string
  href: string
}

interface FooterColumn {
  heading: string
  links: FooterLink[]
}

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Charging Map', href: '/map' },
      { label: 'Route Planner', href: '/routes' },
      { label: 'EV Services', href: '/services' },
      { label: 'Community', href: '/community' },
      { label: 'For Businesses', href: '/for-businesses' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Add a Station', href: '/add-station' },
      { label: 'Report Issue', href: '/report' },
      { label: 'Help Center', href: '/help' },
      { label: 'Advertise', href: '/advertise' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
]

interface SocialLink {
  label: string
  href: string
  icon: LucideIcon
}

const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Twitter', href: 'https://twitter.com/plugpk', icon: Twitter },
  { label: 'Instagram', href: 'https://instagram.com/plugpk', icon: Instagram },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/plugpk', icon: Linkedin },
  { label: 'Facebook', href: 'https://facebook.com/plugpk', icon: Facebook },
]

export function Footer() {
  return (
    <footer className="bg-slate-900 pb-12 pt-20 text-white">
      <Container>
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-6">
          <div className="col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 transition-opacity duration-150 hover:opacity-90"
              aria-label="Plug.pk home"
            >
              <Zap size={22} className="shrink-0 fill-plug-cyan-400 text-plug-cyan-400" aria-hidden="true" />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">plug</span>
                <span className="text-plug-cyan-400">.pk</span>
              </span>
            </Link>

            <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-slate-400">
              Pakistan&apos;s complete EV ecosystem. Find chargers, plan routes, and connect with your
              EV community.
            </p>

            <ul className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon

                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white transition-colors duration-150',
                        'hover:bg-white/[0.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
                      )}
                    >
                      <Icon size={16} aria-hidden="true" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="mb-4 text-sm font-semibold tracking-wide text-white">{column.heading}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="mb-2.5 block text-sm text-slate-400 transition-colors duration-150 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mb-8 mt-12 border-t border-white/[0.08]" />

        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <p className="text-sm text-slate-500">&copy; 2025 Plug.pk. All rights reserved.</p>
          <p className="text-sm text-slate-500">
            Made with <span aria-label="love">&hearts;</span> for Pakistan&apos;s EV Community
          </p>
          <p className="text-sm text-slate-400">Pakistan 🇵🇰</p>
        </div>
      </Container>
    </footer>
  )
}
