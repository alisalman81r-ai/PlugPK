// src/components/dashboard/AccountSettings.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { ThemedSelect } from '@/components/ui/ThemedSelect'
import { PAKISTAN_CITIES } from '@/lib/constants'
import { changeMyPassword, signOutEverywhere, updateMyProfile } from '@/lib/db/session-actions'
import { removeMyAvatar, uploadMyAvatar } from '@/lib/db/upload-actions'
import { ACCEPTED_FORMATS, IMAGE_ACCEPT } from '@/lib/upload-urls'
import { cn } from '@/lib/utils'

import { ICheck, IDevices, IEye, IEyeOff, IImg, ILock, IOut, ISpin, ITrash } from './acct-icons'
import {
  abtn,
  ACCT_DELAY,
  ADLG,
  ADLG_BTNS,
  ADLG_H2,
  ADLG_P,
  AIN,
  ALABEL,
  ALINK,
  ErrorNote,
  FERR,
  FHINT,
  PANEL,
  PANEL_H2,
  PANEL_SUB,
  SavedNote,
} from './dash-ui'
import { DashAvatar } from './DashboardSidebar'

/**
 * Editing the signed-in account (account-settings.html of the design):
 * Profile — picture, name, city, the car, the email — then Password, then
 * Signed-in devices with its "Sign out of all devices?" dialog.
 *
 * Every field here persists. The old page had notification and privacy
 * switches that set React state and nothing else; they are gone.
 *
 * Also used by the admin portal's own settings page (showVehicle={false}).
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

/** page-account.js: one point each for length ≥ 8, ≥ 12, mixed case, and a digit with a symbol. */
function score(p: string) {
  return (
    Number(p.length >= 8) +
    Number(p.length >= 12) +
    Number(/[A-Z]/.test(p) && /[a-z]/.test(p)) +
    Number(/\d/.test(p) && /[^A-Za-z0-9]/.test(p))
  )
}

const METER_ON = ['', 'bg-ember', 'bg-[#FFB020]', 'bg-[#9bc53d]', 'bg-[#35D07F]']

/** .ameter + #pwHint */
function PasswordMeter({ password }: { password: string }) {
  const s = password ? Math.max(1, score(password)) : 0
  const hint = !password
    ? 'At least 8 characters.'
    : password.length < 8
      ? `${8 - password.length} more character${8 - password.length === 1 ? '' : 's'} to go.`
      : ['', 'Long enough.', 'Good.', 'Strong.', 'Very strong.'][score(password)]
  return (
    <>
      <div aria-hidden="true" className="grid grid-cols-4 gap-[5px]">
        {[1, 2, 3, 4].map((i) => (
          <i key={i} className={cn('h-[5px] rounded-[3px] transition-colors duration-300', i <= s ? METER_ON[s] : 'bg-stone')} />
        ))}
      </div>
      <p className={FHINT} aria-live="polite">
        {hint}
      </p>
    </>
  )
}

/** .apw — a password field with its show/hide eye. */
function PasswordField({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  inputRef,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
  placeholder?: string
  inputRef?: React.Ref<HTMLInputElement>
}) {
  const [shown, setShown] = React.useState(false)
  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(AIN, 'pr-14 [&::-ms-reveal]:hidden')}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        className="absolute right-1.5 top-[5px] grid h-11 w-11 place-items-center rounded-xl text-fog transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:shadow-focus"
      >
        {shown ? <IEyeOff size={20} /> : <IEye size={20} />}
      </button>
    </div>
  )
}

export function AccountSettings({ user, mustChangePassword = false, showVehicle = true }: AccountSettingsProps) {
  const router = useRouter()
  const [mustChange, setMustChange] = React.useState(mustChangePassword)
  const passwordSection = React.useRef<HTMLFormElement>(null)
  const currentPasswordField = React.useRef<HTMLInputElement>(null)

  /*
    Takes the visitor straight to the password form when they signed in with
    a temporary password: scrolled to and focused, so the first keystroke goes
    where it needs to.
  */
  React.useEffect(() => {
    if (!mustChangePassword) return
    passwordSection.current?.scrollIntoView({ block: 'start' })
    currentPasswordField.current?.focus({ preventScroll: true })
  }, [mustChangePassword])

  /* ── Picture: saves on its own, then refreshes the server-rendered header. ── */
  const [avatar, setAvatar] = React.useState(user.avatar)
  const [avatarBusy, setAvatarBusy] = React.useState(false)
  const [avatarError, setAvatarError] = React.useState<string | null>(null)

  const changeAvatar = async (file: File) => {
    setAvatarBusy(true)
    setAvatarError(null)
    const form = new FormData()
    form.set('file', file)
    const result = await uploadMyAvatar(form).catch(() => ({ ok: false, url: undefined, message: 'We could not reach the server. Try again.' }))
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

  /* ── Profile ── */
  const [name, setName] = React.useState(user.name)
  const [nameError, setNameError] = React.useState('')
  const nameField = React.useRef<HTMLInputElement>(null)
  const [city, setCity] = React.useState(user.city ?? '')
  const [savingProfile, setSavingProfile] = React.useState(false)
  const [profileSaved, setProfileSaved] = React.useState(false)
  const [profileError, setProfileError] = React.useState<string | null>(null)
  const savedTimer = React.useRef<ReturnType<typeof setTimeout>>()

  const handleProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setNameError('Enter your name.')
      nameField.current?.focus()
      return
    }
    setNameError('')
    setSavingProfile(true)
    setProfileError(null)
    const form = new FormData()
    form.set('name', name)
    form.set('city', city)
    const result = await updateMyProfile(form).catch(() => ({ ok: false, message: 'We could not reach the server. Try again.' }))
    setSavingProfile(false)
    if (!result.ok) {
      setProfileError(result.message ?? 'Could not save your profile.')
      return
    }
    setProfileSaved(true)
    router.refresh()
    // page-account.js clears the saved note after 4 seconds.
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setProfileSaved(false), 4000)
  }

  /* ── Password ── */
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [savingPassword, setSavingPassword] = React.useState(false)
  const [passwordSaved, setPasswordSaved] = React.useState(false)
  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const canChange = Boolean(currentPassword) && newPassword.length >= 8

  const handlePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canChange || savingPassword) return
    setSavingPassword(true)
    setPasswordError(null)
    setPasswordSaved(false)

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
    // Stays up rather than fading: it says other devices were signed out.
    setPasswordSaved(true)
    if (mustChange) {
      setMustChange(false)
      // Drops ?changePassword=1 so a reload does not bring the banner back.
      router.replace(window.location.pathname)
      router.refresh()
    }
  }

  /* ── Sign out everywhere ── */
  const dialog = React.useRef<HTMLDialogElement>(null)
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
        dialog.current?.close()
        return
      }
    } catch {
      setSignOutError('We could not reach the server. Check your connection and try again.')
      setSigningOut(false)
      dialog.current?.close()
      return
    }
    // This browser's session went too, so the account pages are no longer ours.
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {mustChange ? (
        <div role="alert" className="flex items-start gap-3 rounded-[22px] border border-[#FFB020]/35 bg-[#FFF9EA] px-5 py-4">
          <span aria-hidden="true" className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border border-[#FFB020]/35 bg-white text-[#8a5a00]">
            <ILock size={17} />
          </span>
          <div>
            <p className="font-semibold text-ink">Choose a new password to finish signing in</p>
            <p className="mt-1 text-sm text-muted">
              You signed in with a temporary password from the plugpk team. Enter it as your current password below and pick one of your own.
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Profile ─────────────────────────────────────────────── */}
      <form id="profile" noValidate onSubmit={handleProfile} className={PANEL}>
        <h2 className={PANEL_H2}>Profile</h2>

        <div className="my-6 flex items-center gap-[22px] border-b border-ink/10 pb-6 max-[640px]:flex-col max-[640px]:items-start">
          <span className="shrink-0 rounded-full shadow-[0_0_0_6px_#F2F0EA]">
            <DashAvatar name={name || user.name} src={avatar} size={96} />
          </span>
          <div>
            <b id="photo" className="scroll-mt-28 text-[15px] font-semibold text-ink">
              Profile picture
            </b>
            <p className="mb-3.5 mt-1.5 max-w-[520px] text-sm text-muted">
              {ACCEPTED_FORMATS}, up to 4 MB. Shown in the header and on your account.
            </p>
            <div className="flex flex-wrap gap-2">
              <label className={abtn('line', 'sm', cn('cursor-pointer focus-within:shadow-focus', avatarBusy && 'pointer-events-none opacity-45'))}>
                {avatarBusy ? <ISpin /> : <IImg />}
                <span>{avatarBusy ? 'Working…' : 'Change picture'}</span>
                <input
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="sr-only"
                  disabled={avatarBusy}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    // Cleared so picking the same file twice still fires.
                    event.target.value = ''
                    if (file) void changeAvatar(file)
                  }}
                />
              </label>
              <button type="button" onClick={() => void clearAvatar()} disabled={!avatar || avatarBusy} className={abtn('plain', 'sm')}>
                <ITrash />
                <span>Remove</span>
              </button>
            </div>
            {avatarError ? (
              <p role="alert" className={cn(FERR, 'mt-3')}>
                {avatarError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-[22px] grid grid-cols-2 gap-x-5 gap-y-[18px] max-[640px]:grid-cols-1">
          <div className="col-span-full grid content-start gap-2">
            <label htmlFor="acct-name" className={ALABEL}>
              Name
            </label>
            <input
              ref={nameField}
              id="acct-name"
              type="text"
              value={name}
              autoComplete="name"
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? 'acct-name-err' : undefined}
              onChange={(event) => setName(event.target.value)}
              className={cn(AIN, nameError && 'border-ember')}
            />
            {nameError ? (
              <p id="acct-name-err" role="alert" className={FERR}>
                {nameError}
              </p>
            ) : null}
          </div>

          <div className="grid content-start gap-2">
            <label id="city" htmlFor="acct-city" className={cn(ALABEL, 'scroll-mt-28')}>
              City
            </label>
            <ThemedSelect
              id="acct-city"
              value={city}
              onChange={setCity}
              className="h-[54px] rounded-[14px] px-4 text-base font-normal"
              wrapperClassName="w-full"
              options={[{ value: '', label: 'Not set' }, ...PAKISTAN_CITIES.map((option) => ({ value: option, label: option }))]}
            />
          </div>

          {/* Cars live on their own page (several per account, one primary): this shows the primary and links there. */}
          {showVehicle ? (
            <div className="grid content-start gap-2">
              <span className={ALABEL}>Vehicle</span>
              <div className="flex h-[54px] items-center justify-between gap-3 rounded-[14px] bg-chalk px-4 text-muted">
                <span className={cn('truncate', user.vehicle && 'text-ink')}>{user.vehicle ?? 'None saved'}</span>
                <Link href="/dashboard/vehicles" className={cn(ALINK, 'shrink-0')}>
                  {user.vehicle ? 'Change' : 'Add'}
                </Link>
              </div>
            </div>
          ) : null}

          {/* Read-only: the address the account signs in with. */}
          <div className="col-span-full grid content-start gap-2">
            <span className={ALABEL}>Email</span>
            <div className="flex h-[54px] items-center justify-between gap-3 rounded-[14px] bg-chalk px-4 text-ink">
              <span className="truncate">{user.email}</span>
              <ILock size={18} className="shrink-0 text-fog" />
            </div>
            <p className={FHINT}>Your email is how you sign in, so it can&apos;t be changed here.</p>
          </div>
        </div>

        {profileError ? <ErrorNote className="mt-4">{profileError}</ErrorNote> : null}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={savingProfile} className={abtn('ink', 'md', 'max-[640px]:w-full')}>
            {savingProfile ? <ISpin /> : null}
            <span>{savingProfile ? 'Saving…' : 'Save profile'}</span>
          </button>
          <SavedNote>{profileSaved ? 'Saved to your account.' : null}</SavedNote>
        </div>
      </form>

      {/* ── Password ────────────────────────────────────────────── */}
      <form
        ref={passwordSection}
        id="password"
        noValidate
        onSubmit={handlePassword}
        className={cn(PANEL, ACCT_DELAY.password, 'scroll-mt-28', mustChange && 'border-[#FFB020] ring-4 ring-[#FFB020]/25')}
      >
        <h2 className={PANEL_H2}>Password</h2>
        <p className={PANEL_SUB}>
          Your current password is required, so a browser left unlocked cannot be used to lock you out of your own account.
        </p>

        <div className="mt-[22px] grid grid-cols-2 gap-x-5 gap-y-[18px] max-[640px]:grid-cols-1">
          <div className="grid content-start gap-2">
            <label htmlFor="acct-current" className={ALABEL}>
              Current password
            </label>
            <PasswordField
              id="acct-current"
              inputRef={currentPasswordField}
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
          </div>
          <div className="grid content-start gap-2">
            <label htmlFor="acct-new" className={ALABEL}>
              New password
            </label>
            <PasswordField
              id="acct-new"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            <PasswordMeter password={newPassword} />
          </div>
        </div>

        {passwordError ? <ErrorNote className="mt-4">{passwordError}</ErrorNote> : null}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={!canChange || savingPassword} className={abtn('ink', 'md', 'max-[640px]:w-full')}>
            {savingPassword ? <ISpin /> : null}
            <span>{savingPassword ? 'Changing…' : 'Change password'}</span>
          </button>
        </div>

        {passwordSaved ? (
          <p role="status" className="mt-4 flex items-start gap-2 text-sm text-[#12804a]">
            <ICheck size={16} className="mt-0.5 shrink-0" />
            <span>
              <span className="font-semibold">Password changed.</span> Any other phone or computer that was signed in to this account has been signed
              out. This one stays signed in.
            </span>
          </p>
        ) : null}
      </form>

      {/* ── Signed-in devices ───────────────────────────────────── */}
      <section id="devices" className={cn(PANEL, ACCT_DELAY.devices)}>
        <div className="flex items-start gap-[18px] max-[640px]:flex-col max-[640px]:gap-3">
          <IDevices size={32} className="mt-0.5 shrink-0 text-ink" />
          <div>
            <h2 className={PANEL_H2}>Signed-in devices</h2>
            <p className={PANEL_SUB}>
              Lost a phone, or signed in on a shared computer? This ends every session on this account, including this one, and you will need your password
              to get back in.
            </p>
          </div>
        </div>

        {signOutError ? <ErrorNote className="mt-4">{signOutError}</ErrorNote> : null}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => dialog.current?.showModal()} className={abtn('line', 'md', 'max-[640px]:w-full')}>
            <IOut />
            <span>Sign out of all devices</span>
          </button>
        </div>
      </section>

      {/* .adlg — a real dialog rather than window.confirm, which some in-app browsers suppress. */}
      <dialog ref={dialog} aria-labelledby="outDlgT" data-lenis-prevent className={ADLG}>
        <h2 id="outDlgT" className={ADLG_H2}>
          Sign out of all devices?
        </h2>
        <p className={ADLG_P}>Every session on this account ends, including this one. You will need your password to sign back in.</p>
        <div className={ADLG_BTNS}>
          <button type="button" disabled={signingOut} onClick={() => dialog.current?.close()} className={abtn('line', 'md', 'max-[640px]:w-full')}>
            Cancel
          </button>
          <button type="button" disabled={signingOut} onClick={() => void handleSignOutEverywhere()} className={abtn('danger', 'md', 'max-[640px]:w-full')}>
            {signingOut ? <ISpin /> : null}
            <span>Sign out everywhere</span>
          </button>
        </div>
      </dialog>
    </div>
  )
}
