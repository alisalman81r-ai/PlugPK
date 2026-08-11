// src/components/dashboard/NotificationSettings.tsx
'use client'

import { CheckCircle2, Mail, MapPin, Newspaper, Route, Users, Zap, type LucideIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface NotificationState {
  emailReviewReplies: boolean
  emailCommunityPosts: boolean
  emailNewStations: boolean
  emailWeeklyDigest: boolean
  pushChargerAvailable: boolean
  pushTripReminders: boolean
}

type NotificationKey = keyof NotificationState

interface NotificationRow {
  key: NotificationKey
  icon: LucideIcon
  label: string
  description: string
}

const EMAIL_ROWS: NotificationRow[] = [
  {
    key: 'emailReviewReplies',
    icon: Mail,
    label: 'Review Replies',
    description: 'Get notified when someone replies to your review',
  },
  {
    key: 'emailCommunityPosts',
    icon: Users,
    label: 'Community Activity',
    description: 'New replies to your posts and comments',
  },
  {
    key: 'emailNewStations',
    icon: MapPin,
    label: 'New Stations Nearby',
    description: 'When new stations are added in your city',
  },
  {
    key: 'emailWeeklyDigest',
    icon: Newspaper,
    label: 'Weekly Digest',
    description: 'Weekly summary of EV news and community highlights',
  },
]

const PUSH_ROWS: NotificationRow[] = [
  {
    key: 'pushChargerAvailable',
    icon: Zap,
    label: 'Charger Available',
    description: 'When a saved station frees up a bay',
  },
  {
    key: 'pushTripReminders',
    icon: Route,
    label: 'Trip Reminders',
    description: 'Reminders before a planned journey',
  },
]

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-green-500' : 'bg-slate-200',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-1/2 block h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-[23px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  )
}

export function NotificationSettings() {
  const [notifications, setNotifications] = React.useState<NotificationState>({
    emailReviewReplies: true,
    emailCommunityPosts: false,
    emailNewStations: true,
    emailWeeklyDigest: true,
    pushChargerAvailable: false,
    pushTripReminders: false,
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)

  const toggle = (key: NotificationKey) => {
    setNotifications((current) => ({ ...current, [key]: !current[key] }))
    setIsSaved(false)
  }

  const handleSave = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setIsLoading(false)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  const renderRow = (row: NotificationRow, disabled = false) => {
    const Icon = row.icon

    return (
      <div
        key={row.key}
        className={cn(
          'mb-2 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4',
          disabled && 'opacity-60',
        )}
      >
        <span className="flex min-w-0 items-center">
          <span className="mr-4 shrink-0 rounded-lg bg-blue-50 p-1.5">
            <Icon size={20} className="text-plug-blue-600" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-900">{row.label}</span>
            <span className="mt-0.5 block text-xs text-slate-400">{row.description}</span>
          </span>
        </span>

        <Toggle
          checked={notifications[row.key]}
          onChange={() => toggle(row.key)}
          disabled={disabled}
          label={row.label}
        />
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-slate-900">Notification Preferences</h2>
      <p className="mb-8 text-sm text-slate-500">Choose what updates you receive.</p>

      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
        Email Notifications
      </h3>
      {EMAIL_ROWS.map((row) => renderRow(row))}

      <h3 className="mb-1 mt-8 text-sm font-bold uppercase tracking-wider text-slate-400">
        Push Notifications
      </h3>
      <p className="mb-4 text-xs text-slate-400">Coming soon to mobile app</p>
      {PUSH_ROWS.map((row) => renderRow(row, true))}

      {isSaved ? (
        <p className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCircle2 size={16} aria-hidden="true" />
          Preferences saved
        </p>
      ) : null}

      <Button fullWidth className="mt-8" isLoading={isLoading} onClick={handleSave}>
        Save Preferences
      </Button>
    </div>
  )
}
