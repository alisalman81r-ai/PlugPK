// src/components/dashboard/AccountSettings.tsx
'use client'

import { AlertTriangle, Check, Eye, EyeOff, ImagePlus, Loader2, Lock, LogOut, Monitor, Trash2 } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as React from 'react'

import { MorphIcon } from '@/components/ui'
import { ActionButton, ALINK } from '@/components/auth/form-ui'
import { FIELD_EYE, PasswordStrength } from '@/components/auth/SignUpForm'
import { PAKISTAN_CITIES } from '@/lib/constants'
import { changeMyPassword, signOutEverywhere, updateMyProfile } from '@/lib/db/session-actions'
import { removeMyAvatar, uploadMyAvatar } from '@/lib/db/upload-actions'
import { ACCEPTED_FORMATS, IMAGE_ACCEPT } from '@/lib/upload-urls'
import { cn } from '@/lib/utils'

import { AIN, ALABEL, PANEL, PANEL_H2, PANEL_SUB } from './dash-ui'
import { DashAvatar } from './DashboardSidebar'

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
  /** The driver's car row, which links to the garage. Off in the admin portal. */
  showVehicle?: boolean
}

const FIELD =
  'h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-4 text-ui text-slate-900 outline-none transition-all focus:border-plug-blue-500'

export function AccountSettings({ user, mustChangePassword = false, showVehicle = true }: AccountSettingsProps) {
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

  const [showCurrent, setShowCurrent] = React.useState(false)
  const [showNew, setShowNew] = React.useState(false)
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
    <div className="flex flex-col gap-[18px]">
      {mustChange ? (
        <div role="alert" className="flex items-start gap-3 rounded-[22px] border border-[#FFE0A3] bg-[#FFF6E3] px-5 py-4">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-[#8A5300]" aria-hidden="true" />
          <div>
            <p className="font-semibold text-[#5c3800]">Choose a new password to finish signing in</p>
            <p className="mt-1 text-sm text-[#8A5300]">
              You signed in with a temporary password from the plugpk team. Enter it as your current
              password below and pick one of your own.
            </p>
          </div>
        </div>
      ) : null}

      <section className={PANEL}>
        <h2 className={PANEL_H2}>Profile</h2>

        {/* ── Picture ──────────────────────────────────────── */}
        <div className="my-6 flex flex-col items-start gap-[22px] border-b border-ink/10 pb-6 sm:flex-row sm:items-center">
          <span className="shrink-0 rounded-full shadow-[0_0_0_6px_#F4F3EE]">
            <DashAvatar name={user.name} src={avatar} size={96} />
          </span>

          <div>
            <p id="photo" className="scroll-mt-28 text-[15px] font-semibold text-ink">Profile picture</p>
            <p className="mb-3.5 mt-1.5 max-w-[520px] text-sm text-muted">
              {ACCEPTED_FORMATS}, up to 4MB. Shown in the header and on your account.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <label
                className={cn(
                  'inline-flex h-[42px] cursor-pointer items-center gap-2 rounded-full border border-ink/10 bg-white px-[18px] text-sm font-semibold text-ink transition-colors focus-within:shadow-focus hover:border-ink',
                  avatarBusy && 'pointer-events-none opacity-60',
                )}
              >
                {avatarBusy ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <ImagePlus size={16} aria-hidden="true" />
                )}
                {avatarBusy ? 'Working…' : avatar ? 'Change picture' : 'Add a picture'}
                <input
                  type="file"
                  accept={IMAGE_ACCEPT}
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
                  className="inline-flex h-[42px] items-center gap-2 rounded-full px-[18px] text-sm font-semibold text-ink transition-colors hover:bg-ember/[0.08] hover:text-[#b23b0d] disabled:opacity-45"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Remove
                </button>
              ) : null}
            </div>

            {avatarError ? (
              <p role="alert" className="mt-3 text-[13px] text-[#c2410c]">
                {avatarError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-x-5 gap-y-[18px] sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="acct-name" className={ALABEL}>
              Name
            </label>
            <input
              id="acct-name"
              type="text"
              value={name}
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
              className={AIN}
            />
          </div>

          <div>
            <label id="city" htmlFor="acct-city" className={cn(ALABEL, 'scroll-mt-28')}>
              City
            </label>
            <div className="relative">
              <select
                id="acct-city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className={cn(AIN, 'cursor-pointer pr-11')}
              >
                <option value="">Not set</option>
                {PAKISTAN_CITIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-[18px] top-[21px] h-2 w-2 rotate-45 border-b-2 border-r-2 border-fog"
              />
            </div>
          </div>

          {/* Cars are managed on their own page now — several per account,
              one primary — so this only shows the primary and links there. */}
          {showVehicle ? (
            <div>
              <p className={ALABEL}>Vehicle</p>
              <div className="flex h-[54px] items-center justify-between gap-3 rounded-[14px] bg-chalk px-4">
                <span className={cn('truncate', user.vehicle ? 'text-ink' : 'text-muted')}>{user.vehicle ?? 'None saved'}</span>
                <Link href="/dashboard/vehicles" className={cn(ALINK, 'shrink-0 py-1.5')}>
                  {user.vehicle ? 'Change' : 'Add'}
                </Link>
              </div>
            </div>
          ) : null}

          {/* Read-only: this is the address the account signs in with, and the
              link to any business listing behind it. */}
          <div className="sm:col-span-2">
            <p className={ALABEL}>Email</p>
            <div className="flex h-[54px] items-center justify-between gap-3 rounded-[14px] bg-chalk px-4 text-ink">
              <span className="truncate">{user.email}</span>
              <Lock size={18} className="shrink-0 text-fog" aria-hidden="true" />
            </div>
            <p className="mt-2 text-[13px] text-muted">Your email is how you sign in, so it can&apos;t be changed here.</p>
          </div>
        </div>

        {profileError ? (
          <p role="alert" className="mt-4 rounded-[14px] border border-[#FFCDBC] bg-[#FFECE6] px-4 py-3 text-sm text-[#B42E05]">
            {profileError}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <ActionButton onClick={handleProfile} isLoading={savingProfile} className="max-sm:w-full">
            {savingProfile ? 'Saving' : 'Save profile'}
          </ActionButton>
          {profileSaved ? (
            <span role="status" className="inline-flex items-center gap-2 text-sm text-[#12804a]">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#35D07F]" />
              Saved
            </span>
          ) : null}
        </div>
      </section>

      <section
        ref={passwordSection}
        id="password"
        className={cn(PANEL, 'scroll-mt-28', mustChange && 'border-[#FFB020] ring-4 ring-[#FFE0A3]')}
      >
        <h2 className={PANEL_H2}>Password</h2>
        <p className={PANEL_SUB}>
          Your current password is required, so a browser left unlocked cannot be used to lock you
          out of your own account.
        </p>

        <div className="mt-[22px] grid gap-x-5 gap-y-[18px] sm:grid-cols-2">
          <div>
            <label htmlFor="acct-current" className={ALABEL}>
              Current password
            </label>
            <div className="relative">
              <input
                ref={currentPasswordField}
                id="acct-current"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={cn(AIN, 'pr-14 [&::-ms-reveal]:hidden')}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((shown) => !shown)}
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
                aria-pressed={showCurrent}
                className={FIELD_EYE}
              >
                <MorphIcon active={showCurrent} on={EyeOff} off={Eye} size={20} />
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="acct-new" className={ALABEL}>
              New password
            </label>
            <div className="relative">
              <input
                id="acct-new"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                className={cn(AIN, 'pr-14 [&::-ms-reveal]:hidden')}
              />
              <button
                type="button"
                onClick={() => setShowNew((shown) => !shown)}
                aria-label={showNew ? 'Hide password' : 'Show password'}
                aria-pressed={showNew}
                className={FIELD_EYE}
              >
                <MorphIcon active={showNew} on={EyeOff} off={Eye} size={20} />
              </button>
            </div>
            {newPassword ? (
              <PasswordStrength password={newPassword} />
            ) : (
              <p className="mt-2 text-[13px] text-muted">At least 8 characters.</p>
            )}
          </div>
        </div>

        {passwordError ? (
          <p role="alert" className="mt-4 rounded-[14px] border border-[#FFCDBC] bg-[#FFECE6] px-4 py-3 text-sm text-[#B42E05]">
            {passwordError}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <ActionButton
            onClick={handlePassword}
            isLoading={savingPassword}
            disabled={!currentPassword || !newPassword}
            className="disabled:opacity-45 max-sm:w-full"
          >
            {savingPassword ? 'Changing' : 'Change password'}
          </ActionButton>
        </div>

        {passwordSaved ? (
          <p role="status" className="mt-4 flex items-start gap-2 rounded-[14px] border border-[#BFEBD1] bg-[#E9F8EF] px-4 py-3 text-sm text-[#157A45]">
            <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold">Password changed.</span> Any other phone or computer that
              was signed in to this account has been signed out. This one stays signed in.
            </span>
          </p>
        ) : null}
      </section>

      {/* ── Sessions ─────────────────────────────────────────── */}
      <section className={PANEL}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-[18px]">
          <Monitor size={32} className="mt-0.5 shrink-0 text-ink" aria-hidden="true" />
          <div>
            <h2 className={PANEL_H2}>Signed-in devices</h2>
            <p className={PANEL_SUB}>
              Lost a phone, or signed in on a shared computer? This ends every session on this account,
              including this one, and you will need your password to get back in.
            </p>
          </div>
        </div>

        {signOutError ? (
          <p role="alert" className="mt-4 rounded-[14px] border border-[#FFCDBC] bg-[#FFECE6] px-4 py-3 text-sm text-[#B42E05]">
            {signOutError}
          </p>
        ) : null}

        {/* Two steps rather than window.confirm, which some in-app browsers
            suppress — and then the first click would sign out everywhere. */}
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          {confirmEverywhere ? (
            <>
              <ActionButton
                tone="danger"
                onClick={handleSignOutEverywhere}
                isLoading={signingOut}
                leftIcon={<LogOut aria-hidden="true" />}
                className="max-sm:w-full"
              >
                Yes, sign out everywhere
              </ActionButton>
              <ActionButton
                tone="line"
                onClick={() => setConfirmEverywhere(false)}
                disabled={signingOut}
                className="max-sm:w-full"
              >
                Cancel
              </ActionButton>
            </>
          ) : (
            <ActionButton
              tone="line"
              onClick={() => setConfirmEverywhere(true)}
              leftIcon={<LogOut aria-hidden="true" />}
              className="max-sm:w-full"
            >
              Sign out of all devices
            </ActionButton>
          )}
        </div>
      </section>
    </div>
  )
}
