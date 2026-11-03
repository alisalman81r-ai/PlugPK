// src/components/business/BusinessDashboardLayout.tsx
'use client'

import { ExternalLink } from '@/components/ui/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { BackButton } from '@/components/ui'
import {
  BusinessDashboardSidebar,
  isBusinessItemActive,
  ListingSwitcher,
  navFor,
  PortalSwitch,
  rememberPortal,
  type PortalListingSummary,
  type PortalMode,
} from './BusinessDashboardSidebar'
import { listingHref } from './listing-state'
import { Logo } from '@/components/ui/Logo'

export interface BusinessDashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
  /**
   * The signed-in owner's listing. Absent when the account has none, which is
   * why every field is read through it rather than from a fixture.
   */
  listing?: { id: string; name: string; type: string; city: string; status: string }
  /** Every listing on the account, for the switcher. */
  listings?: PortalListingSummary[]
  /** Charger listings or service listings; chargers unless a services page says so. */
  mode?: PortalMode
  /** The account lists both, so the Chargers | Services switch is shown. */
  canSwitch?: boolean
  /** The public page of the listing shown, when it is live. */
  publicHref?: string
}

/**
 * The business portal sits outside the (main) route group, so it renders no
 * consumer navbar or footer and supplies its own 64px top bar instead.
 */
export function BusinessDashboardLayout({
  children,
  title,
  subtitle,
  action,
  listing,
  listings = [],
  mode = 'chargers',
  canSwitch = false,
  publicHref,
}: BusinessDashboardLayoutProps) {
  const pathname = usePathname()
  const nav = navFor(mode)

  // The side last opened is where /business reopens.
  React.useEffect(() => {
    if (canSwitch) rememberPortal(mode)
  }, [canSwitch, mode])
  // Only an approved listing has a public page to open. This link used to
  // point at a mock station slug that was never the owner's, and linking a
  // pending listing would send them to a 404.
  const viewHref = publicHref ?? (mode === 'chargers' && listing && listing.status === 'approved' ? `/station/${listing.id}` : undefined)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="plugpk home">
          <Logo tone="light" size="text-lg" />
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Business
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {viewHref ? (
            <Link
              href={viewHref}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              View Listing
              <ExternalLink size={14} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </header>

      <div className="flex">
        <div className="hidden lg:flex">
          <BusinessDashboardSidebar listing={listing} listings={listings} mode={mode} canSwitch={canSwitch} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5 lg:px-8">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <BackButton
                  fallbackHref={pathname === nav[0]?.href ? '/dashboard' : (nav[0]?.href ?? '/business')}
                  label="Back"
                />
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>
                  {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
                </div>
              </div>
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>

          {/* The sidebar holds the switcher on wide screens; below lg it is
              hidden, so the same control sits at the top of the content. */}
          {canSwitch || listings.length > 1 ? (
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-6 py-3 lg:hidden">
              {canSwitch ? <PortalSwitch mode={mode} /> : null}
              <ListingSwitcher listings={listings} currentId={listing?.id} />
            </div>
          ) : null}

          <div className="p-6 pb-24 lg:p-8 lg:pb-8">{children}</div>
        </div>
      </div>

      <nav
        aria-label="Business portal"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[20px] lg:hidden"
      >
        <div className="scrollbar-hide flex h-16 overflow-x-auto">
          {nav.map((item) => {
            const active = isBusinessItemActive(pathname, item)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={listingHref(item.href, listing?.id, listings.length)}
                aria-current={active ? 'page' : undefined}
                className="flex min-w-[72px] flex-1 items-center justify-center"
              >
                <span
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5',
                    active && 'bg-plug-blue-50',
                  )}
                >
                  <Icon
                    size={20}
                    className={cn('shrink-0', active ? 'text-plug-blue-600' : 'text-slate-400')}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      'whitespace-nowrap text-[10px] font-medium',
                      active ? 'text-plug-blue-600' : 'text-slate-400',
                    )}
                  >
                    {item.label}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
