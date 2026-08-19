// src/components/dashboard/AccountSettings.tsx
'use client'

import { Check, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Avatar, Button } from '@/components/ui'
import { PAKISTAN_CITIES } from '@/lib/constants'
import { changeMyPassword, updateMyProfile } from '@/lib/db/session-actions'
import { removeMyAvatar, uploadMyAvatar } from '@/lib/db/upload-actions'

/**
 * Editing the signed-in account.
 *
 * The old version had Profile, Notifications and Privacy tabs whose switches
 * set React state and nothing else — no notification preference or privacy
 * setting is stored anywhere, so every toggle reset itself on reload. Only the
 * fields that persist are offered here.
 *
 * Changing the password lives here too, which the old page had no way to do at
 * all.
 */

export interface AccountSettingsProps {
  user: {
    name: string
    email: string
    city: string | null
    vehicle: string | null
    avatar: string | null
  }
}

const FIELD =
  'h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-ui text-slate-900 outline-none transition-all focus:border-plug-blue-500'

export function AccountSettings({ user }: AccountSettingsProps) {
  const router = useRouter()
  const [avatar, setAvatar] = React.useState(user.avatar)
  const [avatarBusy, setAvatarBusy] = React.useState(false)
  const [avatarError, setAvatarError] = React.useState<string | null>(null)

  /**
   * The picture saves on its own, not with the rest of the form.
   *
   * It appears in the header, which is server-rendered, so the page is
   * refreshed afterwards — otherwise the settings page would show the new
   * picture while the header above it still showed the old one.
   */
  const changeAvatar = async (file: File) => {
    setAvatarBusy(true)
    setAvatarError(null)

    const form = new FormData()
    form.set('file', file)

    const result = await uploadMyAvatar(form)
    setAvatarBusy(false)

    if (!result.ok || !result.url) {
      setAvatarError(result.message ?? 'Could not set that picture.')
      return
    }
    setAvatar(result.url)
    router.refresh()
  }

  const clearAvatar = async () => {
    setAvatarBusy(true)
    setAvatarError(null)
    await removeMyAvatar()
    setAvatar(null)
    setAvatarBusy(false)
    router.refresh()
  }

  const [name, setName] = React.useState(user.name)
  const [city, setCity] = React.useState(user.city ?? '')
  const [vehicle, setVehicle] = React.useState(user.vehicle ?? '')
  const [savingProfile, setSavingProfile] = React.useState(false)
  const [profileSaved, setProfileSaved] = React.useState(false)
  const [profileError, setProfileError] = React.useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [savingPassword, setSavingPassword] = React.useState(false)
  const [passwordSaved, setPasswordSaved] = React.useState(false)
  const [passwordError, setPasswordError] = React.useState<string | null>(null)

  const handleProfile = async () => {
    setSavingProfile(true)
    setProfileError(null)

    const form = new FormData()
    form.set('name', name)
    form.set('city', city)
    form.set('vehicle', vehicle)

    const result = await updateMyProfile(form)
    setSavingProfile(false)

    if (!result.ok) {
      setProfileError(result.message ?? 'Could not save your profile.')
      return
    }
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  const handlePassword = async () => {
    setSavingPassword(true)
    setPasswordError(null)

    const result = await changeMyPassword(currentPassword, newPassword)
    setSavingPassword(false)

    if (!result.ok) {
      setPasswordError(result.message ?? 'Could not change your password.')
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setPasswordSaved(true)
    setTimeout(() => setPasswordSaved(false), 4000)
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 text-lg font-bold text-slate-900">Profile</h2>

        {/* ── Picture ──────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-center gap-5 border-b border-slate-100 pb-6">
          <Avatar name={user.name} src={avatar} size={80} />

          <div>
            <p className="text-sm font-semibold text-slate-900">Profile picture</p>
            <p className="mt-0.5 text-ui-sm text-slate-500">
              JPEG, PNG or WebP, up to 5MB. Shown in the header and on your account.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label
                className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border-[1.5px] border-slate-200 px-4 text-ui-sm font-medium text-slate-700 transition-colors hover:border-plug-blue-300 hover:bg-blue-50 ${avatarBusy ? 'pointer-events-none opacity-60' : ''}`}
              >
                {avatarBusy ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                ) : (
                  <ImagePlus size={15} aria-hidden="true" />
                )}
                {avatarBusy ? 'Working…' : avatar ? 'Change picture' : 'Add a picture'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    // Cleared so picking the same file twice still fires.
                    event.target.value = ''
                    if (file) void changeAvatar(file)
                  }}
                />
              </label>

              {avatar ? (
                <button
                  type="button"
                  onClick={() => void clearAvatar()}
                  disabled={avatarBusy}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-ui-sm font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                >
                  <Trash2 size={15} aria-hidden="true" />
                  Remove
                </button>
              ) : null}
            </div>

            {avatarError ? (
              <p role="alert" className="mt-3 text-ui-sm text-red-600">
                {avatarError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mb-5">
          <label htmlFor="acct-name" className="mb-2 block text-sm font-semibold text-slate-700">
            Name
          </label>
          <input
            id="acct-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={FIELD}
          />
        </div>

        <div className="mb-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="acct-city" className="mb-2 block text-sm font-semibold text-slate-700">
              City
            </label>
            <select
              id="acct-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className={`${FIELD} cursor-pointer`}
            >
              <option value="">Not set</option>
              {PAKISTAN_CITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="acct-vehicle" className="mb-2 block text-sm font-semibold text-slate-700">
              Vehicle
            </label>
            <input
              id="acct-vehicle"
              type="text"
              value={vehicle}
              onChange={(event) => setVehicle(event.target.value)}
              placeholder="e.g. BYD Atto 3"
              className={FIELD}
            />
          </div>
        </div>

        {/* Read-only: this is the address the account signs in with, and the
            link to any business listing behind it. */}
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-ui-xs font-semibold uppercase tracking-wide text-slate-400">Email</p>
          <p className="mt-0.5 text-ui-sm text-slate-700">{user.email}</p>
        </div>

        {profileError ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-ui-sm text-red-700">{profileError}</p>
        ) : null}

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleProfile} disabled={savingProfile}>
            {savingProfile ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Saving
              </>
            ) : (
              'Save profile'
            )}
          </Button>
          {profileSaved ? (
            <span className="inline-flex items-center gap-1.5 text-ui-sm font-semibold text-green-600">
              <Check size={16} aria-hidden="true" />
              Saved
            </span>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Password</h2>
        <p className="mb-5 text-ui-sm text-slate-500">
          Your current password is required, so a browser left unlocked cannot be used to lock you
          out of your own account.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="acct-current" className="mb-2 block text-sm font-semibold text-slate-700">
              Current password
            </label>
            <input
              id="acct-current"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={FIELD}
            />
          </div>

          <div>
            <label htmlFor="acct-new" className="mb-2 block text-sm font-semibold text-slate-700">
              New password
            </label>
            <input
              id="acct-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 8 characters"
              className={FIELD}
            />
          </div>
        </div>

        {passwordError ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-ui-sm text-red-700">{passwordError}</p>
        ) : null}

        <div className="mt-6 flex items-center gap-3">
          <Button
            onClick={handlePassword}
            disabled={savingPassword || !currentPassword || !newPassword}
          >
            {savingPassword ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Changing
              </>
            ) : (
              'Change password'
            )}
          </Button>
          {passwordSaved ? (
            <span className="inline-flex items-center gap-1.5 text-ui-sm font-semibold text-green-600">
              <Check size={16} aria-hidden="true" />
              Password changed
            </span>
          ) : null}
        </div>
      </section>
    </div>
  )
}
