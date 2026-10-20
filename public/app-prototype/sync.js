// public/app-prototype/sync.js — connects the app to the website's accounts and database.
//
// The app is served from the website's own domain, so the website's session
// cookie (httpOnly, never visible here) rides along on every request below,
// and the server (src/app/api/app/**) runs each write as the signed-in account
// through the website's own actions.
//
// How it fits in without touching every button: the screens keep changing the
// local state S and calling save(), as before. save() is wrapped here, and after
// each one the state is compared with what the server last confirmed (SYNC.base);
// only the differences are sent. New posts, replies, reviews and routes carry a
// `sid` once the server has them, so nothing is sent twice. Offline, the changes
// simply wait for the next save or launch.

const SYNC = { base: null, ready: false, sending: false, again: false }

async function api(path, { method = 'GET', body } = {}) {
  try {
    const response = await fetch(`/api/app/${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
    const data = await response.json().catch(() => ({}))
    return response.ok || data.message ? data : { ok: false, offline: true }
  } catch {
    return { ok: false, offline: true }
  }
}

const synced = () => ({
  saved: [...S.saved],
  clubs: [...S.clubs],
  liked: Object.keys(S.liked),
  garage: [...S.garage],
  primary: S.primary,
  photo: S.user?.photo || null,
  routes: S.routes.filter((r) => r.sid).map((r) => r.sid),
})

// Server ids are the only ones the server can act on: example polls and posts
// still waiting to be sent have local ids.
const serverPost = (id) => D.posts.some((p) => p.id === id)

/** Puts the server's copy of the account into S. `merge` keeps what was chosen
 *  on this phone before signing in (onboarding car, saves) and sends it up. */
function applyServer(snapshot, { merge = false } = {}) {
  const { user, state } = snapshot
  if (!user) {
    // A name typed into the old offline-only sign-in is not an account; drop it
    // so the next sign-in is a real one.
    if (S.user) { S.user = null; toast('Please sign in again to keep your data in sync', 'user') }
    SYNC.base = null
    return
  }
  const union = (a, b) => [...new Set([...(b || []), ...(a || [])])]
  const keepCar = (slug) => !!carBySlug(slug)
  S.user = { name: user.name, email: user.email, joined: user.joined, photo: user.avatar || null }
  S.saved = merge ? union(S.saved, state.saved) : state.saved
  S.clubs = merge ? union(S.clubs, state.clubs) : state.clubs
  const liked = merge ? union(Object.keys(S.liked), state.liked) : state.liked
  S.liked = Object.fromEntries(liked.map((id) => [id, true]))
  S.garage = (merge ? union(S.garage, state.garage) : state.garage).filter(keepCar)
  S.primary = merge && S.primary && keepCar(S.primary) ? S.primary : state.primary && keepCar(state.primary) ? state.primary : S.garage[0] || null
  // Server routes and reviews, plus anything made here that has not gone up yet.
  S.routes = [...S.routes.filter((r) => !r.sid), ...state.routes.map((r) => ({ id: 'r-' + r.sid, ...r }))]
  S.myReviews = [
    ...S.myReviews.filter((r) => !r.sid),
    ...state.reviews.map((r) => ({ ...r, sid: r.id, name: user.name, mine: true })),
  ]
  // What the server already has; the next push sends only what differs.
  SYNC.base = merge ? { ...synced(), saved: state.saved, clubs: state.clubs, liked: state.liked, garage: state.garage, primary: state.primary, photo: user.avatar || null } : synced()
  _save()
}

/** Latest posts, replies and club counts from the database. */
async function loadFeed() {
  const feed = await api('feed')
  if (!feed.posts) return
  // The server's like count includes this account's own like; the screens add
  // it back from S.liked, so take it out here to avoid counting it twice.
  D.posts = feed.posts.map((p) => ({ ...p, likes: Math.max(0, p.likes - (S.liked[p.id] ? 1 : 0)) }))
  D.clubs = feed.clubs
  const onServer = new Set(D.posts.map((p) => p.id))
  const commentsOnServer = new Set(D.posts.flatMap((p) => p.comments.map((c) => c.id)))
  // Posts and replies made here are now in the feed itself.
  S.myPosts = S.myPosts.filter((p) => !p.sid || !onServer.has(p.sid))
  for (const key of Object.keys(S.myComments)) {
    S.myComments[key] = S.myComments[key].filter((c) => !c.sid || !commentsOnServer.has(c.sid))
    if (!S.myComments[key].length) delete S.myComments[key]
  }
  _save()
}

/** Sends every difference between S and what the server last confirmed. */
async function push() {
  if (!S.user || !SYNC.base) return
  if (SYNC.sending) { SYNC.again = true; return }
  SYNC.sending = true
  const now = synced()
  const base = SYNC.base
  const fail = (result) => { if (result && !result.ok && !result.offline && result.message) toast(result.message, 'info') }
  const send = async (body) => { const r = await api('sync', { method: 'POST', body }); fail(r); return r }
  try {
    for (const id of now.saved.filter((x) => !base.saved.includes(x))) await send({ type: 'station.save', id, on: true })
    for (const id of base.saved.filter((x) => !now.saved.includes(x))) await send({ type: 'station.save', id, on: false })
    for (const id of now.clubs.filter((x) => !base.clubs.includes(x))) await send({ type: 'club.join', id })
    for (const id of base.clubs.filter((x) => !now.clubs.includes(x))) await send({ type: 'club.leave', id })
    for (const id of now.liked.filter((x) => !base.liked.includes(x) && serverPost(x))) await send({ type: 'post.like', id, on: true })
    for (const id of base.liked.filter((x) => !now.liked.includes(x) && serverPost(x))) await send({ type: 'post.like', id, on: false })
    if (now.garage.join() !== base.garage.join() || now.primary !== base.primary) {
      await send({ type: 'garage.set', cars: now.garage, primary: now.primary })
    }
    // What the server holds once this pass is done: the state as it was when the
    // pass began — not as it is now, since anything changed during the pass has
    // not been sent yet and must stay a difference for the next one.
    let photo = now.photo
    if (now.photo !== base.photo) {
      if (now.photo?.startsWith('data:')) {
        const r = await send({ type: 'profile.photo', dataUrl: now.photo })
        if (r.ok && r.url) {
          photo = r.url
          if (S.user && S.user.photo === now.photo) S.user.photo = r.url
        } else if (!r.ok) photo = base.photo
      } else if (!now.photo) {
        await send({ type: 'profile.photoRemove' })
      }
    }
    // New things made on this phone.
    for (const p of S.myPosts.filter((x) => !x.sid && !x.syncErr)) {
      const content = p.poll ? `Poll — ${p.poll.options.map((o) => `• ${o}`).join('\n')}` : p.body || p.title
      const r = await send({ type: 'post.create', title: p.title, content, category: p.category })
      if (r.ok) p.sid = r.id; else if (!r.offline) p.syncErr = true
    }
    for (const [postId, list] of Object.entries(S.myComments)) {
      if (!serverPost(postId)) continue
      for (const c of list.filter((x) => !x.sid && !x.syncErr)) {
        const r = await send({ type: 'comment.create', postId, text: c.text })
        if (r.ok) c.sid = true; else if (!r.offline) c.syncErr = true
      }
    }
    for (const rv of S.myReviews.filter((x) => !x.sid && !x.syncErr)) {
      const r = await send({ type: 'review.create', stationId: rv.stationId, rating: rv.rating, text: rv.text, car: rv.car || '' })
      if (r.ok) rv.sid = true; else if (!r.offline) rv.syncErr = true
    }
    for (const rt of S.routes.filter((x) => !x.sid && !x.syncErr)) {
      const car = carBySlug(rt.slug)
      const km = typeof routeKm === 'function' ? routeKm(rt.from, rt.to) : 0
      const r = await send({ type: 'route.save', from: rt.from, to: rt.to, start: rt.start, carId: rt.slug, carName: car?.name || '', km: km || 0, min: 0, stops: 0 })
      if (r.ok) rt.sid = r.id; else if (!r.offline) rt.syncErr = true
    }
    for (const sid of base.routes.filter((x) => !now.routes.includes(x))) await send({ type: 'route.remove', sid })
    SYNC.base = { ...now, photo, routes: [...new Set([...now.routes, ...S.routes.filter((r) => r.sid).map((r) => r.sid)])] }
    _save()
  } finally {
    SYNC.sending = false
    if (SYNC.again) { SYNC.again = false; push() }
  }
}

// Every save() now also syncs. The original is kept for saving locally only.
const _save = save
// eslint-disable-next-line no-global-assign
save = function () { _save(); if (SYNC.ready) push() }

/** On launch: who is signed in, their data, the live feed, and any new update. */
async function bootSync() {
  const snapshot = await api('session')
  if (snapshot.offline) return
  applyServer(snapshot)
  SYNC.ready = true
  await loadFeed()
  render()
  push()
  const rel = snapshot.release
  if (rel && S.onboarded && S.seenRelease !== rel.id) {
    U.release = rel
    openSheet('whatsNew')
  }
}

/** Returned by signInRemote when the next step is entering the emailed code. */
const VERIFY = '__verify__'

/**
 * Real sign-in or sign-up. Returns an error message, null on success, or
 * VERIFY when the account needs its emailed 6-digit code first (a new
 * sign-up, or signing in before confirming) — U.verify then holds the state.
 */
async function signInRemote(mode, values) {
  const r = await api('session', { method: 'POST', body: { mode, name: values.name, email: values.email, password: values.password } })
  if (r.offline) return 'You seem to be offline. Connect and try again.'
  if (!r.ok && r.unverified) return startVerify(values.email, r.emailSent, r.message)
  if (!r.ok) return r.message || 'That did not work. Please try again.'
  // A new account has no session until its email is confirmed.
  if (r.verifyEmail) return startVerify(r.verifyEmail, r.emailSent, r.message)
  return finishSignIn(r.mustChangePassword)
}

/** After the server set the session cookie: load the account into the app. */
async function finishSignIn(mustChangePassword) {
  const snapshot = await api('session')
  if (!snapshot.user) return 'Signed in, but this browser blocked the session cookie.'
  applyServer(snapshot, { merge: true })
  SYNC.ready = true
  await loadFeed()
  push()
  if (mustChangePassword) toast('Set a new password on plug.pk before anything else', 'lock')
  return null
}

// ─── Email verification: the 6-digit code ──────────────────────────
//
// Same server actions as the website (api/app/session modes 'verify' and
// 'resend'): the same code, expiry, attempt limit and rate limits. Shown in
// place of the sign-in form — the full screen during onboarding, the sheet
// after it — and on success carries on exactly as a sign-in would.

function startVerify(email, sent, message) {
  const sentOk = sent === true
  U.verify = { email: String(email || '').trim().toLowerCase(), err: sentOk ? null : message || null, note: sentOk ? message || null : null }
  U.authErr = null
  return VERIFY
}

const reRenderAuth = () => (S.onboarded ? renderSheet() : render())

function verifyFormHtml() {
  const v = U.verify
  return `<form class="stack gap-12" data-submit="verifySubmit" novalidate>
      <p class="t14 muted">We sent a 6-digit code to <b>${esc(v.email)}</b>. Your account stays inactive until you enter it. It expires in 10 minutes — check spam if it isn’t there.</p>
      <div><label class="label" for="vf-code">Verification code</label>
        <input class="input ${v.err ? 'bad' : ''}" id="vf-code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" placeholder="123456" style="text-align:center;font-size:24px;letter-spacing:.5em;font-family:var(--mono, ui-monospace, monospace)"></div>
      ${v.err ? `<p class="err-msg" role="alert">${ic('info', 15)}${esc(v.err)}</p>` : ''}
      ${v.note ? `<p class="t14" role="status" style="color:var(--ok-fg)">${esc(v.note)}</p>` : ''}
      <button class="btn btn-primary btn-lg btn-block" type="submit">Verify email ${ic('arrowR', 18)}</button>
      <button class="btn btn-secondary btn-block" type="button" data-a="verifyResend">Send a new code</button>
      <button class="link" type="button" style="width:100%;justify-content:center" data-a="verifyBack">Use a different email</button>
    </form>`
}

/** The onboarding screen's version: same header as the account step. */
function verifyScreen() {
  return {
    sb: 'light',
    html: `<div class="pk"><div class="scroll" style="padding-bottom:32px">
      <header class="pk-head">
        <div class="row between">
          <button class="icon-btn" data-a="verifyBack" aria-label="Back">${ic('arrowL', 22)}</button>
          <span class="mono t12" style="color:rgba(255,255,255,.6);letter-spacing:.08em">STEP 1 OF 2</span>
          <span></span>
        </div>
        <div class="ob-progress mt-12" style="grid-template-columns:1fr 1fr"><i class="on"></i><i></i></div>
        <div class="eyebrow mt-16" style="color:#8EEEDA">${ic('mail', 13)} Confirm your email</div>
        <h1 class="band-title mt-8">Enter your <span class="hl">code</span></h1>
      </header>
      <div class="pad mt-16">${verifyFormHtml()}</div>
    </div></div>`,
  }
}

A.verifySubmit = async (_, f) => {
  if (U.verifyBusy) return
  const code = String(new FormData(f).get('code') || '').replace(/\D/g, '')
  if (code.length !== 6) { U.verify.err = 'Enter the 6-digit code from the email.'; U.verify.note = null; return reRenderAuth() }
  U.verifyBusy = true
  const btn = f.querySelector('[type="submit"]')
  if (btn) { btn.disabled = true; btn.textContent = 'Checking…' }
  const r = await api('session', { method: 'POST', body: { mode: 'verify', email: U.verify.email, code } })
  let error = r.offline ? 'You seem to be offline. Connect and try again.' : !r.ok ? r.message || 'That code is not right.' : null
  if (!error) error = await finishSignIn(false)
  U.verifyBusy = false
  if (error) { U.verify.err = error; U.verify.note = null; return reRenderAuth() }
  U.verify = null
  if (S.onboarded) { closeSheet(); render(); return toast(`Signed in as ${S.user.name}`, 'user') }
  // Onboarding carries on to choosing a car, as after any sign-in.
  U.onbStep = SLIDES.length + 1
  render()
}

A.verifyResend = async () => {
  if (U.verifyBusy) return
  U.verifyBusy = true
  const r = await api('session', { method: 'POST', body: { mode: 'resend', email: U.verify.email } })
  U.verifyBusy = false
  if (r.offline) { U.verify.err = 'You seem to be offline. Connect and try again.'; U.verify.note = null }
  else if (r.ok) { U.verify.note = r.message; U.verify.err = null }
  else { U.verify.err = r.message || 'Could not send a new code. Try again in a minute.'; U.verify.note = null }
  reRenderAuth()
}

A.verifyBack = () => { U.verify = null; U.authErr = null; reRenderAuth() }

async function signOutRemote() {
  SYNC.ready = false
  SYNC.base = null
  await api('session', { method: 'DELETE' })
}

/** Partner Up meeting request: works signed in or not. */
async function requestMeetingRemote(values) {
  const r = await api('sync', {
    method: 'POST',
    body: { type: 'meeting.request', name: values.name, company: values.biz, email: values.email, phone: values.phone, note: values.msg },
  })
  if (r.offline) return 'You seem to be offline. Connect and try again.'
  return r.ok ? null : r.message || 'That did not go through. Please try again.'
}

SHEETS.whatsNew = () => {
  const r = U.release
  return {
    title: `What’s new${r?.version ? ` · ${esc(r.version)}` : ''}`,
    body: `<div class="whats-new">
        <div class="wn-badge">${ic('sparkle', 22)}</div>
        <h3 class="t20 b7 mt-12">${esc(r?.title || '')}</h3>
        <p class="t13 muted mt-4">${r?.sentAt ? new Date(r.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
        <div class="t15 mt-12 wn-notes">${esc(r?.notes || '').replace(/\n/g, '<br>')}</div>
      </div>
      <button class="btn btn-primary btn-block btn-lg mt-20" data-a="seenRelease">Got it</button>`,
  }
}
A.seenRelease = () => { if (U.release) S.seenRelease = U.release.id; _save(); closeSheet() }

/**
 * List chargers at a venue — the website's sign-up, in the same three calls:
 * create the listing, upload each charger photo, attach them. The listing id
 * and each uploaded photo's URL are kept on the form's state, so a retry after
 * a dropped connection carries on where it stopped instead of starting a
 * second listing or uploading the same photo twice.
 */
async function listBusinessRemote(v, progress) {
  const offline = 'You seem to be offline. Connect and try again — nothing you entered is lost.'
  const chargers = v.chargers.map((c) => ({ connectorType: c.connectorType, maxPowerKw: Number(c.maxPowerKw) || 0, ports: Number(c.ports) || 1 }))
  progress('Creating your listing…')
  const r = await api('sync', {
    method: 'POST',
    body: {
      type: 'business.register', businessId: v.businessId, businessName: v.businessName, businessType: v.businessType,
      city: v.city, address: v.address, phone: v.phone, website: v.website, lat: v.pin?.[0] ?? null, lng: v.pin?.[1] ?? null, chargers,
    },
  })
  if (r.offline) return offline
  if (!r.ok) return r.message || 'That did not go through. Please try again.'
  v.businessId = r.businessId
  for (const [k, c] of v.chargers.entries()) {
    if (c.url) continue
    progress(`Uploading photo ${k + 1} of ${v.chargers.length}…`)
    const u = await api('sync', { method: 'POST', body: { type: 'business.photo', businessId: v.businessId, dataUrl: c.photo } })
    if (u.offline) return offline
    if (!u.ok || !u.url) return `Charger ${k + 1}: ${u.message || 'that photo could not be uploaded.'}`
    c.url = u.url
  }
  progress('Attaching your photos…')
  const s = await api('sync', {
    method: 'POST',
    body: { type: 'business.chargers', businessId: v.businessId, businessName: v.businessName, chargers: v.chargers.map((c, k) => ({ ...chargers[k], photo: c.url })) },
  })
  if (s.offline) return offline
  return s.ok ? null : s.message || 'Could not attach the charger photos. Please try again.'
}

/** Apply to list an EV service — dealer, workshop, installer and the rest. */
async function applyServiceRemote(v) {
  const r = await api('sync', {
    method: 'POST',
    body: {
      type: 'service.apply', name: v.name, category: v.category, city: v.city, area: v.area, street: v.street,
      description: v.description, phone: v.phone, email: v.email, website: v.website, lat: v.pin?.[0] ?? null, lng: v.pin?.[1] ?? null,
    },
  })
  if (r.offline) return 'You seem to be offline. Connect and try again — nothing you entered is lost.'
  return r.ok ? null : r.message || 'That did not go through. Please try again.'
}

/** A position to { address, city } — a suggestion for the listing forms. */
async function reverseGeocodeRemote(lat, lng) {
  const r = await api('sync', { method: 'POST', body: { type: 'geo.reverse', lat, lng } })
  return r.ok ? r : null
}
