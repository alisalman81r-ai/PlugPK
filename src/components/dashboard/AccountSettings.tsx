// src/components/dashboard/AccountSettings.tsx
'use client'

import { AlertTriangle, Check, ImagePlus, Loader2, LogOut, Trash2 } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as React from 'react'

import { Avatar, Button } from '@/components/ui'
import { PAKISTAN_CITIES } from '@/lib/constants'
import { changeMyPassword, signOutEverywhere, updateMyProfile } from '@/lib/db/session-actions'
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
  /**
   * The account is on a temporary password an operator issued, or sign-in
   * sent it here with ?changePassword=1. Either way the password form is the
   * first thing on the page until it is changed.
   */
  mustChangePassword?: boolean
}

const FIELD =
  'h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-ui text-slate-900 outline-none transition-all focus:border-plug-blue-500'

export function AccountSettings({ user, mustChangePassword = false }: AccountSettingsProps) {
  const router = useRouter()
  const [mustChange, setMustChange] = React.useState(mustChangePassword)
  const passwordSection = React.useRef<HTMLElement>(null)
  const currentPasswordField = React.useRef<HTMLInputElement>(null)

  /*
    Takes the visitor straight to the password form. Somebody signing in with
    a temporary password used to land on the dashboard with nothing telling
    them it had to be replaced; now the form is scrolled to and focused, so the
    first keystroke goes where it needs to.
  */
  React.useEffect(() => {
    if (!mustChangePassword) return
    passwordSection.current?.scrollIntoView({ block: 'start' })
    currentPasswordField.current?.focus({ preventScroll: true })
  }, [mustChangePassword])
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

    let result: Awaited<ReturnType<typeof changeMyPassword>>
    try {
      result = await changeMyPassword(currentPassword, newPassword)
    } catch {
      result = { ok: false, message: 'We could not reach the server. Check your connection and try again.' }
    }
    setSavingPassword(false)

    if (!result.ok) {
      setPasswordError(result.message ?? 'Could not change your password.')
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    // Stays up rather than fading: it carries the news that other devices
    // were signed out, which somebody may want to read twice.
    setPasswordSaved(true)
    if (mustChange) {
      setMustChange(false)
      // Drops ?changePassword=1 so a reload does not bring the banner back.
      router.replace('/dashboard/settings')
      router.refresh()
    }
  }

  const [confirmEverywhere, setConfirmEverywhere] = React.useState(false)
  const [signingOut, setSigningOut] = React.useState(false)
  const [signOutError, setSignOutError] = React.useState<string | null>(null)

  const handleSignOutEverywhere = async () => {
    setSigningOut(true)
    setSignOutError(null)
    try {
      const result = await signOutEverywhere()
      if (!result.ok) {
        setSignOutError(result.message ?? 'Could not sign out your other devices.')
        setSigningOut(false)
        return
      }
    } catch {
      setSignOutError('We could not reach the server. Check your connection and try again.')
      setSigningOut(false)
      return
    }
    // This browser's session went too, so the account pages are no longer ours.
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      {mustChange ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <p className="font-semibold text-amber-900">Choose a new password to finish signing in</p>
            <p className="mt-1 text-ui-sm text-amber-900/80">
              You signed in with a temporary password from the Plug.pk team. Enter it as your current
              password below and pick one of your own.
            </p>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 text-lg font-bold text-slate-900">Profile</h2>

        {/* ── Picture ──────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-center gap-5 border-b border-slate-100 pb-6">
          <Avatar name={user.name} src={avatar} size={80} />

          <div>
            <p id="photo" className="scroll-mt-28 text-sm font-semibold text-slate-900">Profile picture</p>
            <p className="mt-0.5 text-ui-sm text-slate-500">
              JPEG, PNG or WebP, up to 4MB. Shown in the header and on your account.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label
                className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border-[1.5px] border-slate-200 px-4 text-ui-sm font-medium text-slate-700 transition-colors hover:border-plug-blue-300 hover:bg-plug-blue-50 ${avatarBusy ? 'pointer-events-none opacity-60' : ''}`}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void clearAvatar()}
                  disabled={avatarBusy}
                  leftIcon={<Trash2 size={15} aria-hidden="true" />}
                  className="h-10 hover:bg-red-50 hover:text-red-600"
                >
                  Remove
                </Button>
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
            <label id="city" htmlFor="acct-city" className="mb-2 block scroll-mt-28 text-sm font-semibold text-slate-700">
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

          {/* Cars are managed on their own page now — several per account,
              one primary — so this only shows the primary and links there. */}
          <div>
            <p className="mb-2 block text-sm font-semibold text-slate-700">Vehicle</p>
            <div className="flex h-12 items-center justify-between gap-3 rounded-xl bg-slate-50 px-4">
              <span className="truncate text-ui text-slate-700">{user.vehicle ?? 'None saved'}</span>
              <Link href="/dashboard/vehicles" className="shrink-0 text-ui-sm font-semibold text-plug-blue-600 hover:underline">
                {user.vehicle ? 'Change' : 'Add'}
              </Link>
            </div>
          </div>
        </div>

        {/* Read-only: this is the address the account signs in with, and the
            link to any business listing behind it. */}
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-ui-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
          <p className="mt-0.5 text-ui-sm text-slate-700">{user.email}</p>
        </div>

        {profileError ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-ui-sm text-red-700">{profileError}</p>
        ) : null}

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleProfile} isLoading={savingProfile}>
            {savingProfile ? 'Saving' : 'Save profile'}
          </Button>
          {profileSaved ? (
            <span className="inline-flex items-center gap-1.5 text-ui-sm font-semibold text-green-600">
              <Check size={16} aria-hidden="true" />
              Saved
            </span>
          ) : null}
        </div>
      </section>

      <section
        ref={passwordSection}
        id="password"
        className={`scroll-mt-28 rounded-2xl border bg-white p-6 ${mustChange ? 'border-amber-300 ring-2 ring-amber-200' : 'border-slate-200'}`}
      >
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
              ref={currentPasswordField}
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
            isLoading={savingPassword}
            disabled={!currentPassword || !newPassword}
          >
            {savingPassword ? 'Changing' : 'Change password'}
          </Button>
        </div>

        {passwordSaved ? (
          <p role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-green-50 px-4 py-3 text-ui-sm text-green-800">
            <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold">Password changed.</span> Any other phone or computer that
              was signed in to this account has been signed out. This one stays signed in.
            </span>
          </p>
        ) : null}
      </section>

      {/* ── Sessions ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Signed-in devices</h2>
        <p className="mb-5 text-ui-sm text-slate-500">
          Lost a phone, or signed in on a shared computer? This ends every session on this account,
          including this one, and you will need your password to get back in.
        </p>

        {signOutError ? (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-ui-sm text-red-700">
            {signOutError}
          </p>
        ) : null}

        {/* Two steps rather than window.confirm, which some in-app browsers
            suppress — and then the first click would sign out everywhere. */}
        {confirmEverywhere ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="destructive"
              onClick={handleSignOutEverywhere}
              isLoading={signingOut}
              leftIcon={<LogOut size={16} aria-hidden="true" />}
            >
              Yes, sign out everywhere
            </Button>
            <Button variant="ghost" onClick={() => setConfirmEverywhere(false)} disabled={signingOut}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            onClick={() => setConfirmEverywhere(true)}
            leftIcon={<LogOut size={16} aria-hidden="true" />}
          >
            Sign out of all devices
          </Button>
        )}
      </section>
    </div>
  )
}
