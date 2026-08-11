// src/components/dashboard/AccountSettings.tsx
'use client'

import { Download } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui'
import type { ProfileUpdate } from '@/hooks/useDashboard'
import type { User } from '@/lib/types'
import { cn } from '@/lib/utils'
import { NotificationSettings } from './NotificationSettings'
import { ProfileEditForm } from './ProfileEditForm'

export interface AccountSettingsProps {
  user: User
  onUpdateProfile: (data: ProfileUpdate) => void
}

type TabKey = 'profile' | 'notifications' | 'privacy'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'privacy', label: 'Privacy' },
]

function PrivacyTab() {
  const [showInCommunity, setShowInCommunity] = React.useState(true)
  const [locationSharing, setLocationSharing] = React.useState(false)
  const [visibility, setVisibility] = React.useState('members')
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  const toggleClass = (on: boolean) =>
    cn('relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200', on ? 'bg-green-500' : 'bg-slate-200')

  const thumbClass = (on: boolean) =>
    cn(
      'absolute top-1/2 block h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-200',
      on ? 'translate-x-[23px]' : 'translate-x-[3px]',
    )

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-slate-900">Your Data</h2>

      <div className="mb-2 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <label htmlFor="visibility" className="text-sm font-semibold text-slate-900">
          Profile Visibility
        </label>
        <select
          id="visibility"
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
          className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
        >
          <option value="public">Public</option>
          <option value="members">Members only</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div className="mb-2 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900">Show in Community</span>
          <span className="mt-0.5 block text-xs text-slate-400">
            Show my activity in community feeds
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={showInCommunity}
          aria-label="Show in community"
          onClick={() => setShowInCommunity((value) => !value)}
          className={toggleClass(showInCommunity)}
        >
          <span aria-hidden="true" className={thumbClass(showInCommunity)} />
        </button>
      </div>

      <div className="mb-8 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900">Location Sharing</span>
          <span className="mt-0.5 block text-xs text-slate-400">
            Allow location for nearby stations
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={locationSharing}
          aria-label="Location sharing"
          onClick={() => setLocationSharing((value) => !value)}
          className={toggleClass(locationSharing)}
        >
          <span aria-hidden="true" className={thumbClass(locationSharing)} />
        </button>
      </div>

      <Button variant="secondary" leftIcon={<Download size={16} />} className="mb-8">
        Download My Data
      </Button>

      <div className="rounded-2xl border border-red-200 p-5">
        <h3 className="mb-4 text-base font-bold text-red-600">Danger Zone</h3>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">Delete Account</p>
            <p className="mt-1 text-sm text-slate-500">
              Permanently delete your account and all data.
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
            Delete Account
          </Button>
        </div>
      </div>

      {confirmDelete ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-delete-title"
          onClick={() => setConfirmDelete(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[420px] rounded-3xl bg-white p-8 shadow-modal"
          >
            <h2 id="privacy-delete-title" className="mb-2 text-xl font-bold text-slate-900">
              Delete your account?
            </h2>
            <p className="mb-8 text-slate-500">
              This permanently removes your profile and all data. It cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => setConfirmDelete(false)}>
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function AccountSettings({ user, onUpdateProfile }: AccountSettingsProps) {
  const [activeTab, setActiveTab] = React.useState<TabKey>('profile')

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-pressed={activeTab === tab.key}
            className={cn(
              'h-9 flex-1 rounded-lg text-center text-sm font-semibold transition-all duration-150',
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' ? <ProfileEditForm user={user} onSave={onUpdateProfile} /> : null}
      {activeTab === 'notifications' ? <NotificationSettings /> : null}
      {activeTab === 'privacy' ? <PrivacyTab /> : null}
    </div>
  )
}
