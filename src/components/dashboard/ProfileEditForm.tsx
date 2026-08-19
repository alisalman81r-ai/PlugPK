// src/components/dashboard/ProfileEditForm.tsx
'use client'

import { Calendar, Camera, CheckCircle2, Lock, MapPin, User as UserIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui'
import { PAKISTAN_CITIES } from '@/lib/constants'
import type { User } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'

/**
 * Was imported from the mock dashboard hook, which is gone now that every
 * dashboard page reads the database. Declared here instead, where it is used.
 */
export interface ProfileUpdate {
  name?: string
  city?: string
  avatar?: string
}

export interface ProfileEditFormProps {
  user: User
  onSave: (data: ProfileUpdate) => void
}

const FIELD =
  'h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white pl-11 pr-4 text-ui text-slate-900 outline-none transition-all duration-150 focus:border-plug-blue-500 focus:shadow-focus'

export function ProfileEditForm({ user, onSave }: ProfileEditFormProps) {
  const [name, setName] = React.useState(user.name)
  const [city, setCity] = React.useState(user.city ?? '')
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  const hasChanges = name !== user.name || city !== (user.city ?? '')

  const handleSave = async () => {
    setIsLoading(true)
    // Stands in for the profile API.
    await new Promise((resolve) => setTimeout(resolve, 1200))
    onSave({ name, city })
    setIsLoading(false)
    setIsSuccess(true)
    setTimeout(() => setIsSuccess(false), 3000)
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <span className="relative mx-auto inline-block">
          <span
            aria-hidden="true"
            className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-gradient-brand text-5xl font-black text-white"
          >
            {name.charAt(0) || 'U'}
          </span>
          <button
            type="button"
            aria-label="Change photo"
            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-200 bg-white shadow-sm transition-colors hover:border-blue-300"
          >
            <Camera size={16} className="text-slate-600" aria-hidden="true" />
          </button>
        </span>
        <p className="mt-3 text-sm text-slate-500">Change photo (Coming soon)</p>
      </div>

      <div className="mb-5">
        <label htmlFor="profile-name" className="mb-2 block text-sm font-semibold text-slate-700">
          Full Name
        </label>
        <div className="relative">
          <UserIcon
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={FIELD}
          />
        </div>
      </div>

      <div className="mb-5">
        <label htmlFor="profile-email" className="mb-2 block text-sm font-semibold text-slate-700">
          Email Address
        </label>
        <div className="relative">
          <Lock
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="profile-email"
            type="email"
            value={user.email}
            disabled
            className={cn(FIELD, 'cursor-not-allowed opacity-60')}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">Email cannot be changed</p>
      </div>

      <div className="mb-5">
        <label htmlFor="profile-city" className="mb-2 block text-sm font-semibold text-slate-700">
          City
        </label>
        <div className="relative">
          <MapPin
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <select
            id="profile-city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className={cn(FIELD, 'cursor-pointer')}
          >
            <option value="">Select your city</option>
            {PAKISTAN_CITIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-8">
        <label htmlFor="profile-joined" className="mb-2 block text-sm font-semibold text-slate-700">
          Member Since
        </label>
        <div className="relative">
          <Calendar
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="profile-joined"
            type="text"
            value={formatDate(user.joinedAt)}
            disabled
            className={cn(FIELD, 'cursor-not-allowed opacity-60')}
          />
        </div>
      </div>

      <hr className="my-8 border-slate-100" />

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

      {isSuccess ? (
        <p className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCircle2 size={16} aria-hidden="true" />
          Profile updated
        </p>
      ) : null}

      {/* Sticky above the dashboard's mobile tab bar; inline from lg up. */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-6 mt-8 border-t border-slate-200 bg-white px-6 py-4 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
        <Button
          size="lg"
          fullWidth
          className="h-12 bg-gradient-brand"
          isLoading={isLoading}
          disabled={!hasChanges}
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </div>

      {confirmDelete ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          onClick={() => setConfirmDelete(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[420px] rounded-3xl bg-white p-8 shadow-modal"
          >
            <h2 id="delete-account-title" className="mb-2 text-xl font-bold text-slate-900">
              Delete your account?
            </h2>
            <p className="mb-8 text-slate-500">
              This permanently removes your profile, saved stations, routes and reviews. It cannot
              be undone.
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
