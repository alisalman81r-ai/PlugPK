// src/components/dashboard/ActivityFeed.tsx
import { Bookmark, Clock, Route, Star, UserPlus, type LucideIcon } from 'lucide-react'

import type { ActivityItem, ActivityType } from '@/lib/types'
import { cn, formatRelativeTime } from '@/lib/utils'

export interface ActivityFeedProps {
  activity: ActivityItem[]
  maxItems?: number
}

const ACTIVITY_ICON: Record<ActivityType, { icon: LucideIcon; tone: string }> = {
  review: { icon: Star, tone: 'text-amber-500' },
  save: { icon: Bookmark, tone: 'text-plug-blue-600' },
  route: { icon: Route, tone: 'text-purple-600' },
  join: { icon: UserPlus, tone: 'text-green-600' },
}

export function ActivityFeed({ activity, maxItems }: ActivityFeedProps) {
  const items = maxItems ? activity.slice(0, maxItems) : activity

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">No recent activity</p>
  }

  return (
    <div className="relative flex flex-col">
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-[19px] top-0 w-0.5 bg-gradient-to-b from-slate-200 to-transparent"
      />

      {items.map((item, index) => {
        const meta = ACTIVITY_ICON[item.type]
        const Icon = meta.icon
        const isLast = index === items.length - 1

        return (
          <div key={item.id} className={cn('relative flex items-start gap-4', !isLast && 'pb-6')}>
            <span className="relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white">
              <Icon size={16} className={meta.tone} aria-hidden="true" />
            </span>

            <span className="min-w-0 flex-1 pt-2">
              <span className="block text-sm leading-relaxed text-slate-700">
                {item.text}{' '}
                {item.highlight ? (
                  <span className="font-semibold text-slate-900">{item.highlight}</span>
                ) : null}
              </span>
              <span className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <Clock size={11} aria-hidden="true" />
                {formatRelativeTime(item.date)}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
