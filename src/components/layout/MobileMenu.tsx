// src/components/layout/MobileMenu.tsx
'use client'

import { ChevronRight, MapPin, Route, Users, Wrench, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui'
import { NAV_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

/** NAV_LINKS carries no icon component, so routes are mapped to icons here. */
const NAV_ICONS: Record<string, LucideIcon> = {
  '/map': MapPin,
  '/routes': Route,
  '/services': Wrench,
  '/community': Users,
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {isOpen ? (
        <div
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/20 transition-opacity duration-300 lg:hidden"
        />
      ) : null}

      <div
        id="mobile-menu"
        aria-hidden={!isOpen}
        className={cn(
          'fixed inset-0 z-40 flex flex-col bg-white pt-[72px] transition-transform duration-[350ms] ease-decelerate lg:hidden',
          isOpen ? 'translate-y-0' : 'pointer-events-none -translate-y-full',
        )}
      >
        <div className="flex h-full flex-col px-6 pb-6 pt-8">
          <nav>
            {NAV_LINKS.map((link) => {
              const active = isActivePath(pathname, link.href)
              const Icon = NAV_ICONS[link.href] ?? MapPin

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  tabIndex={isOpen ? undefined : -1}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-14 items-center gap-3 border-b border-slate-100 text-lg font-medium transition-colors duration-150',
                    active ? 'rounded-xl bg-blue-50 px-4 text-plug-blue-600' : 'text-slate-700',
                  )}
                >
                  <Icon
                    size={20}
                    className={cn('shrink-0', active ? 'text-plug-blue-600' : 'text-slate-400')}
                    aria-hidden="true"
                  />
                  {link.label}
                  {active ? null : (
                    <ChevronRight size={16} className="ml-auto shrink-0 text-slate-300" aria-hidden="true" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex-1" />

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              href="/login"
              onClick={onClose}
              tabIndex={isOpen ? undefined : -1}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              href="/for-businesses"
              onClick={onClose}
              tabIndex={isOpen ? undefined : -1}
            >
              List Your Business
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Pakistan&apos;s EV Ecosystem Platform
          </p>
        </div>
      </div>
    </>
  )
}
