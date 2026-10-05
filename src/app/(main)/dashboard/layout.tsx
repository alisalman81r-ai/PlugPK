// src/app/(main)/dashboard/layout.tsx
import type { Metadata } from 'next'

/*
  The dashboard is one person's account, so none of it belongs in a search
  index. The root layout says `index: true` for the whole site, and without
  this every page under here inherited it.

  The title template gives each page "Saved Stations · Dashboard | Plug.pk"
  rather than the site default; the root template still adds the brand.
*/
export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s · Dashboard | Plug.pk',
  },
  robots: { index: false, follow: false },
}

export default function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  return children
}
