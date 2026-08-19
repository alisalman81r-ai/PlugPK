// src/components/business/BusinessDashboardLayout.tsx
'use client'

import { ExternalLink, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { BUSINESS_NAV, BusinessDashboardSidebar, isBusinessItemActive } from './BusinessDashboardSidebar'

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
}: BusinessDashboardLayoutProps) {
  const pathname = usePathname()
  // Only an approved listing has a public page to open. This link used to
  // point at a mock station slug that was never the owner's, and linking a
  // pending listing would send them to a 404.
  const listingSlug = listing && listing.status === 'approved' ? listing.id : undefined

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Plug.pk home">
          <Zap size={20} className="shrink-0 fill-plug-blue-600 text-plug-blue-600" aria-hidden="true" />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-slate-900">plug</span>
            <span className="text-plug-blue-600">.pk</span>
          </span>
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Business
          </span>
        </Link>

        {listingSlug ? (
          <Link
            href={`/station/${listingSlug}`}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            View Listing
            <ExternalLink size={14} aria-hidden="true" />
          </Link>
        ) : null}
      </header>

      <div className="flex">
        <div className="hidden lg:flex">
          <BusinessDashboardSidebar listing={listing} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5 lg:px-8">
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>

          <div className="p-6 pb-24 lg:p-8 lg:pb-8">{children}</div>
        </div>
      </div>

      <nav
        aria-label="Business portal"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[20px] lg:hidden"
      >
        <div className="scrollbar-hide flex h-16 overflow-x-auto">
          {BUSINESS_NAV.map((item) => {
            const active = isBusinessItemActive(pathname, item)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className="flex min-w-[72px] flex-1 items-center justify-center"
              >
                <span
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5',
                    active && 'bg-blue-50',
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
