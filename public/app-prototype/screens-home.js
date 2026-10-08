// plug.pk app prototype — onboarding, sign-in, home, search, notifications.
'use strict'

const POPULAR_SLUGS = ['byd-atto-3-advanced', 'mg-zs-ev', 'byd-seal', 'byd-atto-2', 'mg-4-urban', 'honri-ve-2', 'dfsk-seres-3', 'deepal-s07', 'deepal-l07', 'kia-ev5', 'gwm-ora-03', 'byd-sealion-7-advanced'].filter(carBySlug)

// ─── Onboarding ────────────────────────────────────────────────────
// ─── Onboarding ────────────────────────────────────────────────────
// Three slides, each showing real app content rather than illustration:
// the network today, a route the planner actually computes, a catalogue car.
const SLIDES = [
  {
    eyebrow: ['pin', 'Charger map'],
    title: 'Find a charger <span class="hl">anywhere in Pakistan</span>',
    body: 'Every listed charger on one map, with its plug, its speed and what’s nearby while you wait.',
    media: () => {
      const cities = new Set(D.stations.map((s) => s.city)).size
      return `<img class="ob-photo" src="${img('hero/hero-scene-v4.png')}" alt="An electric SUV beside a charger, with charging stops marked across a map of Pakistan">
        <div class="ob-card ob-stats">
          <div><b class="mono">${D.stations.length}</b><span>Chargers listed</span></div>
          <div><b class="mono">${cities}</b><span>Cities</span></div>
          <div><b class="mono">${D.cars.length}</b><span>Cars in the catalogue</span></div>
        </div>`
    },
  },
  {
    eyebrow: ['route', 'Route planner'],
    title: 'Plan drives around <span class="hl">your car’s real range</span>',
    body: 'Tell us what you drive. We work out whether you’ll make it, where to charge and for how long.',
    media: () => {
      const car = carBySlug('byd-seal')
      const p = planRoute('Islamabad', 'Lahore', car, 90)
      const path = 'M 70 120 C 120 150, 150 170, 180 205 S 250 250, 318 268'
      return `<svg class="ob-map" viewBox="0 0 390 440" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
          <g stroke="rgba(142,238,218,.07)" stroke-width="1">${Array.from({ length: 15 }, (_, i) => `<path d="M ${i * 30} 0 V 440 M 0 ${i * 30} H 390"/>`).join('')}</g>
          <path d="M -10 170 C 90 200, 150 140, 400 190" stroke="rgba(142,238,218,.12)" stroke-width="6" fill="none"/>
          <path d="M 40 440 C 100 330, 260 230, 390 90" stroke="rgba(142,238,218,.1)" stroke-width="4" fill="none"/>
          <path d="${path}" stroke="rgba(38,205,178,.18)" stroke-width="14" fill="none" stroke-linecap="round"/>
          <path class="ob-route" d="${path}" pathLength="1" stroke="#26CDB2" stroke-width="4" fill="none" stroke-linecap="round"/>
          <circle r="6" fill="#fff" class="ob-runner"><animateMotion dur="2.4s" begin="0.3s" fill="freeze" path="${path}" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".4 0 .2 1"/></circle>
          <g font-family="Figtree, sans-serif" font-weight="700" font-size="13" fill="#fff">
            <circle cx="70" cy="120" r="7" fill="#22C55E" stroke="#05241E" stroke-width="3"/><text x="84" y="112">Islamabad</text>
            <circle cx="318" cy="268" r="7" fill="#EF4444" stroke="#05241E" stroke-width="3"/><text x="304" y="292" text-anchor="end">Lahore</text>
          </g>
        </svg>
        <div class="ob-card ob-route-card">
          <div class="row between"><b class="t15">Islamabad → Lahore</b><span class="mono t13" style="color:#8EEEDA">${p.km} km</span></div>
          <div class="t13" style="color:rgba(255,255,255,.6)">M-2 motorway · <span class="mono">~${fmtDur(p.drive)}</span> · ${esc(car.name)}</div>
          <div class="ob-batt"><i style="--from:90%;--to:${p.arrive}%"></i></div>
          <div class="row between t12 mono" style="color:rgba(255,255,255,.55)"><span>Leave 90%</span><span style="color:#8EEEDA">Arrive ${p.arrive}% · no stop</span></div>
        </div>`
    },
  },
  {
    eyebrow: ['car', 'Car catalogue'],
    title: 'Compare every EV <span class="hl">sold in Pakistan</span>',
    body: `${D.cars.length} cars with PKR prices, real specs and charging times. Then ask the owners.`,
    media: () => {
      const c = carBySlug('byd-seal')
      return `<div class="ob-stage">
          <span class="ob-price">${esc(c.price)}</span>
          <img src="${img(c.image)}" alt="${esc(c.name)}">
        </div>
        <div class="ob-card ob-specs">
          <div class="t12" style="color:rgba(255,255,255,.55);letter-spacing:.12em;text-transform:uppercase;font-weight:700">${esc(c.brand)}</div>
          <b class="t17">${esc(c.model)}</b>
          <div class="ob-spec-row">
            <div><b class="mono">${carRange(c)}<small>km</small></b><span>Range · ${c.rangeStd}</span></div>
            <div><b class="mono">${c.battery}<small>kWh</small></b><span>Battery</span></div>
            <div><b class="mono">${c.dc}<small>kW</small></b><span>DC peak</span></div>
          </div>
        </div>`
    },
  },
]

SCREENS.onboarding = () => {
  const st = U.onbStep
  if (st === SLIDES.length) return authScreen()
  if (st === SLIDES.length + 1) return pickCarScreen()
  const s = SLIDES[st]
  const last = st === SLIDES.length - 1
  return {
    sb: 'light',
    html: `<div class="ob" id="ob">
      <div class="ob-media ob-media-${st}" key="${st}">${s.media()}</div>
      <header class="ob-top">
        <div class="ob-progress" aria-label="Step ${st + 1} of ${SLIDES.length}">${SLIDES.map((_, i) => `<i class="${i < st ? 'done' : i === st ? 'on' : ''}"></i>`).join('')}</div>
        <div class="row between">${logo(19)}<button class="btn btn-sm ob-skip" data-a="onbSkip">Skip</button></div>
      </header>
      <div class="ob-body">
        <div class="eyebrow" style="color:#8EEEDA">${ic(s.eyebrow[0], 13)} ${s.eyebrow[1]}</div>
        <h1>${s.title}</h1>
        <p>${s.body}</p>
        <button class="btn btn-glow btn-lg btn-block" data-a="onbNext">${last ? 'Get started' : 'Continue'} ${ic('arrowR', 18)}</button>
        <button class="btn btn-ghost btn-block ob-signin" data-a="onbSignIn">I already have an account</button>
      </div>
    </div>`,
    after: onbSwipe,
  }
}
/** Swipe left or right between slides, like any native onboarding. */
function onbSwipe() {
  const el = $('#ob')
  if (!el) return
  let x0 = null
  el.addEventListener('pointerdown', (e) => { if (!e.target.closest('button')) x0 = e.clientX })
  el.addEventListener('pointerup', (e) => {
    if (x0 == null) return
    const dx = e.clientX - x0
    x0 = null
    if (dx < -50) A.onbNext()
    else if (dx > 50 && U.onbStep > 0) { U.onbStep--; U.dir = 'back'; render() }
  })
}
A.onbSignIn = () => { U.onbStep = SLIDES.length; U.authMode = 'signin'; U.authErr = null; render() }

function authScreen() {
  const up = U.authMode === 'signup'
  const e = U.authErr || {}
  const v = U.authVals || {}
  const err = (k) => (e[k] ? `<p class="err-msg">${ic('info', 15)}${e[k]}</p>` : '')
  return {
    sb: 'light',
    html: `<div class="pk"><div class="scroll" style="padding-bottom:32px">
      <header class="pk-head">
        <div class="row between">
          <button class="icon-btn" data-a="authBack" aria-label="Back">${ic('arrowL', 22)}</button>
          <span class="mono t12" style="color:rgba(255,255,255,.6);letter-spacing:.08em">STEP 1 OF 2</span>
          <button class="btn btn-sm ob-skip" data-a="guest">Skip</button>
        </div>
        <div class="ob-progress mt-12" style="grid-template-columns:1fr 1fr"><i class="on"></i><i></i></div>
        <div class="eyebrow mt-20" style="color:#8EEEDA">${ic('user', 13)} Your account</div>
        <h1 class="band-title mt-8">${up ? 'Create your <span class="hl">account</span>' : 'Welcome <span class="hl">back</span>'}</h1>
        <p class="t15 mt-8" style="color:rgba(255,255,255,.65)">${up ? 'Keep your stations, routes and reviews in one place.' : 'Sign in to pick up your saved stations and routes.'}</p>
      </header>
      <div class="pad mt-20">
        <div class="seg" role="tablist">
          <button class="${up ? 'on' : ''}" role="tab" aria-selected="${up}" data-a="authTo" data-v="signup">Create account</button>
          <button class="${up ? '' : 'on'}" role="tab" aria-selected="${!up}" data-a="authTo" data-v="signin">Sign in</button>
        </div>
      </div>
      <form class="pad stack gap-16 mt-20" data-submit="authSubmit" novalidate>
        ${up ? `<div><label class="label" for="au-name">Full name</label><div class="field"><span class="lead">${ic('user', 18)}</span><input class="input ${e.name ? 'bad' : ''}" id="au-name" name="name" autocomplete="name" placeholder="Ahmed Raza" value="${esc(v.name)}"></div>${err('name')}</div>` : ''}
        <div><label class="label" for="au-email">Email</label><div class="field"><span class="lead">${ic('mail', 18)}</span><input class="input ${e.email ? 'bad' : ''}" id="au-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" value="${esc(v.email)}"></div>${err('email')}</div>
        <div>
          <div class="row between"><label class="label" for="au-pass">Password</label>${!up ? '<button type="button" class="link" style="min-height:0;margin-bottom:6px" data-a="forgot">Forgot password?</button>' : ''}</div>
          <div class="field"><span class="lead">${ic('lock', 18)}</span><input class="input ${e.password ? 'bad' : ''}" id="au-pass" name="password" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="${up ? 'At least 8 characters' : 'Your password'}" style="padding-right:52px">
            <span class="trail"><button type="button" class="icon-btn" data-a="togglePass" aria-label="Show password">${ic('eye', 18)}</button></span></div>
          ${err('password') || (up ? '<p class="hint">Use 8 or more characters.</p>' : '')}
        </div>
        <button class="btn btn-primary btn-lg btn-block mt-4" type="submit">${up ? 'Create account' : 'Sign in'} ${ic('arrowR', 18)}</button>
        <div class="row" style="gap:12px;color:var(--faint);font-size:13px"><span class="grow" style="height:1px;background:var(--line)"></span>or<span class="grow" style="height:1px;background:var(--line)"></span></div>
        <button class="btn btn-secondary btn-lg btn-block" type="button" data-a="guest">Continue as guest</button>
        <p class="t12 faint" style="text-align:center;line-height:1.6">By continuing you agree to plug.pk’s <a class="accent-text" href="https://plug.pk/terms" target="_blank" rel="noopener">Terms</a> and <a class="accent-text" href="https://plug.pk/privacy" target="_blank" rel="noopener">Privacy policy</a>.<br>Prototype: accounts stay on this device.</p>
      </form>
    </div></div>`,
  }
}

function pickCarScreen() {
  const q = U.pickQ.trim().toLowerCase()
  const brand = U.pickBrand || null
  const plugIns = D.cars.filter(isPlugIn)
  const rank = (c) => { const i = POPULAR_SLUGS.indexOf(c.slug); return i < 0 ? 999 : i }
  const filtered = q || brand || U.pickAll
  const list = filtered
    ? plugIns.filter((c) => (!brand || c.brand === brand) && (!q || `${c.name} ${c.brand}`.toLowerCase().includes(q))).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
    : POPULAR_SLUGS.map(carBySlug)
  // Brands with popular cars first, in that order, then the rest by how many plug-ins they sell.
  const popBrands = [...new Set(POPULAR_SLUGS.map((x) => carBySlug(x).brand))]
  const brandRank = (b) => (popBrands.includes(b) ? popBrands.indexOf(b) - 100 : -plugIns.filter((c) => c.brand === b).length)
  const brands = [...new Set(plugIns.map((c) => c.brand))].sort((a, b) => brandRank(a) - brandRank(b))
  const sel = carBySlug(U.pick ?? S.primary)
  const label = q ? `${list.length} match${list.length === 1 ? '' : 'es'} for “${esc(U.pickQ.trim())}”` : brand ? `${list.length} ${esc(brand)} plug-in${list.length === 1 ? '' : 's'}` : U.pickAll ? `All ${list.length} plug-in cars` : 'Popular in Pakistan'
  return {
    sb: 'light',
    html: `<div class="pk">
      <div class="scroll" style="padding-bottom:${sel ? 150 : 110}px">
        <header class="pk-head">
          <div class="row between">
            <button class="icon-btn" data-a="pickBack" aria-label="Back">${ic('arrowL', 22)}</button>
            <span class="mono t12" style="color:rgba(255,255,255,.6);letter-spacing:.08em">STEP 2 OF 2</span>
            <button class="btn btn-sm ob-skip" data-a="finishOnb" data-v="none">Skip</button>
          </div>
          <div class="ob-progress mt-12" style="grid-template-columns:1fr 1fr"><i class="done"></i><i class="on"></i></div>
          <div class="eyebrow mt-20" style="color:#8EEEDA">${ic('car', 13)} Your car</div>
          <h1 class="band-title mt-8">What do you <span class="hl">drive?</span></h1>
          <p class="t15 mt-8" style="color:rgba(255,255,255,.65)">Routes, charge times and plug checks all use its real figures. Change it any time.</p>
          <div class="field mt-16"><span class="lead" style="color:rgba(255,255,255,.5)">${ic('search', 18)}</span><input class="input pk-search" id="pick-q" data-in="pickQ" placeholder="Search ${plugIns.length} plug-in cars" value="${esc(U.pickQ)}" autocomplete="off"></div>
        </header>
        <div class="chips mt-16">
          <button class="chip solid ${!brand ? 'on' : ''}" data-a="pickBrand" data-v="">All brands</button>
          ${brands.map((b) => `<button class="chip ${brand === b ? 'on' : ''}" data-a="pickBrand" data-v="${esc(b)}">${brand === b ? ic('check', 14, { sw: 2.4 }) : ''}${esc(b)}</button>`).join('')}
        </div>
        <div class="pad mt-16">
          <p class="group-label" style="margin-top:0">${label}</p>
          <div class="pick-grid">${list.map((c) => {
            const on = sel?.slug === c.slug
            return `<button class="pick ${on ? 'on' : ''}" data-a="pickCar" data-v="${c.slug}" aria-pressed="${on}">
              ${carStage(c)}
              <div class="bd">
                <div class="t12 faint b7" style="letter-spacing:.1em;text-transform:uppercase">${esc(c.brand)}</div>
                <div class="t15 b7 trunc">${esc(c.model)}</div>
                <div class="pk-specs mono"><span>${carRange(c) ?? '—'}<small>km</small></span><span>${c.battery}<small>kWh</small></span><span>${c.dc ?? c.ac ?? '—'}<small>kW</small></span></div>
              </div>
              ${on ? `<span class="tick">${ic('check', 14, { sw: 2.8 })}</span>` : ''}
            </button>`
          }).join('')}</div>
          ${!list.length ? `<div class="empty">No plug-in car matches that. Try the brand name, like “BYD” or “MG”.<button class="btn btn-sm btn-secondary" data-a="pickClear">Clear search</button></div>` : ''}
          ${!filtered ? `<button class="btn btn-secondary btn-block mt-16" data-a="pickAll">Show all ${plugIns.length} plug-in cars ${ic('chevD', 18)}</button>` : ''}
          <button class="link mt-8" style="width:100%;justify-content:center" data-a="finishOnb" data-v="none">I don’t have an EV yet</button>
        </div>
      </div>
      <div class="pk-bar">
        ${sel ? `<div class="row" style="gap:12px">${carStage(sel, '', 'width:64px;height:44px;border-radius:10px;flex:none')}
          <div class="grow" style="min-width:0"><div class="t12 faint">Selected</div><b class="t15 trunc" style="display:block">${esc(sel.name)}</b>
          <div class="t12 mono muted trunc">${carRange(sel) ?? '—'} km${sel.rangeStd ? ` ${sel.rangeStd}` : ''} · ${sel.battery} kWh${carConns(sel).length ? ` · ${carConns(sel).map((t) => CONN[t].label).join(', ')}` : ''}</div></div></div>` : '<p class="t14 muted">Pick a car to continue, or skip if you don’t drive one yet.</p>'}
        <button class="btn btn-primary btn-lg btn-block" data-a="finishOnb" ${sel ? '' : 'disabled'}>Continue ${ic('arrowR', 18)}</button>
      </div>
    </div>`,
  }
}

Object.assign(A, {
  onbNext: () => { U.onbStep++; render() },
  onbSkip: () => { U.onbStep = SLIDES.length; render() },
  authMode: () => { U.authMode = U.authMode === 'signup' ? 'signin' : 'signup'; U.authErr = null; render() },
  forgot: () => toast('We’d email you a reset link — not wired up in the prototype', 'mail'),
  guest: () => { S.user = null; U.onbStep = SLIDES.length + 1; render() },
  authSubmit: (_, f) => {
    const v = Object.fromEntries(new FormData(f))
    const up = U.authMode === 'signup'
    const err = {}
    if (up && !v.name?.trim()) err.name = 'Enter your name so other drivers know who’s posting.'
    if (!/^\S+@\S+\.\S+$/.test(v.email || '')) err.email = 'Enter an email address like name@example.com.'
    if ((v.password || '').length < 8) err.password = up ? 'Use at least 8 characters.' : 'That password is too short to be yours.'
    U.authVals = v
    if (Object.keys(err).length) { U.authErr = err; return render() }
    U.authErr = null
    S.user = { name: up ? v.name.trim() : (v.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())), email: v.email, joined: new Date().toISOString() }
    save()
    if (S.onboarded) { closeSheet(); render(); return toast(`Signed in as ${S.user.name}`, 'user') }
    U.onbStep = SLIDES.length + 1
    render()
  },
  authTo: (v) => { U.authMode = v; U.authErr = null; render() },
  authBack: () => { U.onbStep = SLIDES.length - 1; render() },
  togglePass: (_, el) => {
    const i = el.closest('.field').querySelector('input')
    const show = i.type === 'password'
    i.type = show ? 'text' : 'password'
    el.innerHTML = ic(show ? 'eyeOff' : 'eye', 18)
    el.setAttribute('aria-label', show ? 'Hide password' : 'Show password')
  },
  pickCar: (slug) => { U.pick = slug; render() },
  pickBrand: (v) => { U.pickBrand = v || null; render() },
  pickAll: () => { U.pickAll = true; render() },
  pickClear: () => { U.pickQ = ''; U.pickBrand = null; render() },
  pickBack: () => { U.onbStep = SLIDES.length; render() },
  finishOnb: (v) => {
    const pick = U.pick ?? S.primary
    if (v !== 'none' && pick) { S.primary = pick; if (!S.garage.includes(pick)) S.garage = [pick, ...S.garage] }
    if (v === 'none') { S.primary = null; S.garage = [] }
    S.onboarded = true
    save()
    U.stack = [{ s: 'home' }]
    U.dir = 'fade'
    render()
    toast(S.user ? `Welcome, ${firstName()}` : 'Welcome to plug.pk', 'bolt')
  },
})
IN.pickQ = (v) => { U.pickQ = v; render() }

// ─── Home ──────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours()
  return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function stationMini(s) {
  const r = stRating(s)
  return `<button class="card st-card press" data-a="go" data-v="station" data-id="${s.id}" style="text-align:left">
    <div class="ph"><img src="${img(s.photos[0])}" alt="" loading="lazy">${exampleBadge()}<span class="badge b-glass dist mono">${fmtDist(stDist(s))}</span></div>
    <div class="bd">
      <div class="row between"><b class="t15 trunc">${esc(s.name)}</b>${r ? `<span class="rating">${ic('star', 13, { fill: true, sw: 1 })}${r.toFixed(1)}</span>` : ''}</div>
      <div class="t13 muted trunc">${esc(s.area)}, ${esc(s.city)}</div>
      <div class="row mt-8 wrap" style="gap:6px">${connBadges(stTypes(s), 2)}${speedBadge(stMax(s))}</div>
    </div>
  </button>`
}
function routeCard([from, to, note]) {
  const km = roadKm(from, to)
  return `<button class="card route-card press" data-a="planPopular" data-v="${from}|${to}" style="text-align:left">
    <div class="row between" style="align-items:flex-start">
      <div class="route-line"><span class="dot" style="background:#22C55E"></span><b class="t15">${from}</b><span class="bar"></span><span></span><span class="dot" style="background:#EF4444"></span><b class="t15">${to}</b></div>
      <span class="mono b7 t13">${km} KM</span>
    </div>
    <div class="row between mt-12" style="padding-top:10px;border-top:1px solid var(--line)">
      <span class="t13"><span class="mono">~${fmtDur(driveMin(km))}</span> <span class="muted">· ${note}</span></span>
      <span class="icon-btn" style="width:32px;height:32px;border-radius:50%;background:var(--sunken)">${ic('arrowR', 16)}</span>
    </div>
  </button>`
}
const CAT = {
  general: ['General EV Talk', 'b-teal'], 'charging-experience': ['Charging', 'b-green'], 'trip-report': ['Trip Reports', 'b-purple'],
  'vehicle-review': ['Vehicle Reviews', 'b-amber'], 'buying-advice': ['Buying Advice', 'b-mint'], 'ev-news': ['EV News', 'b-red'],
}

SCREENS.home = () => {
  const car = myCar()
  const city = S.city
  const near = D.stations.filter((s) => s.city === city).sort((a, b) => stDist(a) - stDist(b))
  const others = D.stations.filter((s) => s.city !== city)
  const posts = allPosts().slice(0, 2)
  const svcs = D.services.filter((s) => s.city === city).slice(0, 4)
  const range = car && carRange(car)
  return {
    sb: 'light', tabs: true,
    html: `<div class="scroll">
      <header class="band lift">
        <div class="home-top">
          <button class="city-btn" data-a="sheet" data-v="city" aria-label="Change city">${ic('pin', 16)}${city}${ic('chevD', 14)}</button>
          <span class="grow"></span>
          <button class="icon-btn" data-a="flipTheme" aria-label="Switch to ${isDark() ? 'light' : 'dark'} mode">${ic(isDark() ? 'sun' : 'moon', 20)}</button>
          <button class="icon-btn" data-a="go" data-v="notifications" aria-label="Notifications">${ic('bell', 20)}${S.seenNotif ? '' : '<span class="dot-badge"></span>'}</button>
          <button class="avatar" data-a="go" data-v="profile" aria-label="Your profile">${S.user ? initial(S.user.name) : ic('user', 20)}</button>
        </div>
        <div class="greet">
          <p class="t14" style="color:rgba(255,255,255,.6)">${greeting()}${S.user ? `, ${esc(firstName())}` : ''}</p>
          <h1>Where are we <span class="hl">charging</span> today?</h1>
        </div>
        ${car ? `<div class="garage">
          <div class="row between">
            <div style="min-width:0"><div class="eyebrow">${ic('car', 13)} My garage</div><div class="t20 b7 trunc mt-4">${esc(car.name)}</div></div>
            <button class="btn btn-sm btn-outline-white" data-a="go" data-v="vehicles">Change</button>
          </div>
          <button data-a="go" data-v="car" data-slug="${car.slug}" style="display:block;width:100%">${carStage(car)}</button>
          <div class="garage-specs">
            <div class="gspec"><div class="v">${range ?? '—'}<small>km</small></div><div class="k">${car.category === 'EV' ? 'Range' : 'Electric'}${car.rangeStd ? ` · ${car.rangeStd}` : ''}</div></div>
            <div class="gspec"><div class="v">${car.battery ?? '—'}<small>kWh</small></div><div class="k">Battery</div></div>
            <div class="gspec"><div class="v">${car.dc ?? car.ac ?? '—'}<small>kW</small></div><div class="k">${car.dc ? 'DC peak' : 'AC max'}</div></div>
          </div>
        </div>` : `<button class="garage" data-a="go" data-v="vehicles" style="display:flex;width:100%;align-items:center;gap:14px;text-align:left">
          <span class="qa" style="min-height:0;width:52px;height:52px;padding:0;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12);display:grid;place-items:center;color:#26CDB2">${ic('plus', 24)}</span>
          <span class="grow"><b class="t17">Add your EV</b><br><span class="t13" style="color:rgba(255,255,255,.6)">Routes and charge times use its real figures.</span></span>${ic('chevR', 20)}</button>`}
      </header>

      <div class="pad lifted">
        <button class="searchbar" data-a="go" data-v="search">${ic('search', 20)}<span class="grow">Search stations, cars, services</span><span class="kbd">${ic('sliders', 18)}</span></button>
      </div>

      <div class="pad mt-20">
        <div class="quick">
          <button class="qa dark" data-a="tab" data-v="map"><span class="ico">${ic('pin', 22)}</span>Find chargers</button>
          <button class="qa" data-a="tab" data-v="routes"><span class="ico">${ic('route', 22)}</span>Plan a trip</button>
          <button class="qa" data-a="go" data-v="calculator"><span class="ico">${ic('timer', 22)}</span>Charge time</button>
          <button class="qa" data-a="go" data-v="range"><span class="ico">${ic('gauge', 22)}</span>Real range</button>
        </div>
      </div>

      <section class="section">
        <div class="sec-head"><div><h2>Chargers in ${city}</h2><p class="sub">${near.length ? `${near.length} listed · nearest first` : 'None listed yet'}</p></div><button class="link" data-a="tab" data-v="map">Map ${ic('arrowR', 14)}</button></div>
        <div class="hscroll">${(near.length ? near : others).map(stationMini).join('')}</div>
      </section>

      <section class="section">
        <div class="sec-head"><div><h2>Popular routes</h2><p class="sub">Distances by motorway or national highway</p></div><button class="link" data-a="tab" data-v="routes">Plan ${ic('arrowR', 14)}</button></div>
        <div class="hscroll">${POPULAR.map(routeCard).join('')}</div>
      </section>

      <section class="section">
        <div class="sec-head"><div><h2>From the community</h2><p class="sub">Drivers sharing what works</p></div><button class="link" data-a="tab" data-v="community">All posts ${ic('arrowR', 14)}</button></div>
        <div class="pad stack gap-12">${posts.map((p) => postRow(p)).join('')}</div>
      </section>

      ${svcs.length ? `<section class="section">
        <div class="sec-head"><div><h2>EV services in ${city}</h2><p class="sub">Dealers, workshops, installers</p></div><button class="link" data-a="go" data-v="services">All ${ic('arrowR', 14)}</button></div>
        <div class="hscroll">${svcs.map((s) => serviceCard(s, 260)).join('')}</div>
      </section>` : ''}

      <section class="section pad">
        <h2 class="t20" style="margin-bottom:12px">More from plug.pk</h2>
        <div class="list">
          ${listRow('wrench', 'EV services', 'Dealers, workshops, installers, insurance', 'services')}
          ${listRow('compare', 'Compare cars', 'Prices, range and charging side by side', 'compare')}
          ${listRow('users', 'EV clubs', `Meet drivers in ${new Set(D.clubs.map((c) => c.city)).size} cities`, 'clubs')}
          ${listRow('bookmark', 'Saved', `${S.saved.length} station${S.saved.length === 1 ? '' : 's'} · ${S.routes.length} route${S.routes.length === 1 ? '' : 's'}`, 'profile')}
        </div>
      </section>

      <section class="section pad">
        <div class="result-hero" style="padding:22px">
          <div class="eyebrow" style="color:#8EEEDA;position:relative">${ic('handshake', 13)} For businesses</div>
          <h2 class="t24 mt-8" style="position:relative">Own a charger? Put it <span class="hl">on the map.</span></h2>
          <p class="t14 mt-8" style="color:rgba(255,255,255,.68);position:relative">Drivers find you, leave reviews and get directions. One plan, PKR 4,999 a month.</p>
          <button class="btn btn-inverse mt-16" style="position:relative" data-a="go" data-v="partners">See how it works ${ic('arrowUR', 18)}</button>
        </div>
      </section>

      <p class="pad t12 faint mt-24" style="text-align:center">Stations marked “Example listing” are sample data. Data as of ${D.builtAt}.</p>
    </div>`,
  }
}

Object.assign(A, {
  planPopular: (v) => {
    const [from, to] = v.split('|')
    Object.assign(U.route, { from, to })
    U.stack = [{ s: 'routes' }, { s: 'routeResult' }]
    U.dir = 'fwd'
    render()
  },
})

SHEETS.city = () => ({
  title: 'Choose your city',
  body: `<p class="t14 muted" style="margin-bottom:12px">We list chargers in these cities so far. More arrive as operators join.</p>
    <div class="list">${CITIES_WITH_STATIONS.map((c) => {
      const n = D.stations.filter((s) => s.city === c).length
      return `<button class="list-row" data-a="city" data-v="${c}"><span class="ico">${ic('pin', 18)}</span><span class="grow"><b>${c}</b><br><span class="t13 muted">${n} charger${n === 1 ? '' : 's'} listed</span></span>${S.city === c ? `<span class="accent-text">${ic('check', 20, { sw: 2.4 })}</span>` : ''}</button>`
    }).join('')}</div>`,
})

// ─── Search ────────────────────────────────────────────────────────
SCREENS.search = () => {
  const q = U.search.trim().toLowerCase()
  const has = (t) => String(t || '').toLowerCase().includes(q)
  const st = q ? D.stations.filter((s) => has(s.name) || has(s.area) || has(s.city) || stTypes(s).some((t) => has(CONN[t].label))) : []
  const cars = q ? D.cars.filter((c) => has(c.name) || has(c.brand)).slice(0, 6) : []
  const svc = q ? D.services.filter((s) => has(s.name) || has(s.city) || has(s.category)).slice(0, 4) : []
  const posts = q ? allPosts().filter((p) => has(p.title) || has(p.body)).slice(0, 4) : []
  const none = q && !st.length && !cars.length && !svc.length && !posts.length
  const sugg = ['CCS2', 'Lahore', 'BYD', 'Karachi', 'Insurance', 'Trip report']
  return {
    sb: 'dark',
    html: `<div class="topbar" style="gap:6px">
        <button class="icon-btn" data-a="back" aria-label="Back">${ic('arrowL', 22)}</button>
        <div class="field grow"><span class="lead">${ic('search', 18)}</span><input class="input" id="g-search" data-in="search" placeholder="Stations, cars, services, posts" value="${esc(U.search)}" autofocus></div>
      </div>
      <div class="scroll pad" style="padding-bottom:40px">
        ${!q ? `<p class="group-label">Try</p><div class="row wrap">${sugg.map((s) => `<button class="chip" data-a="searchFill" data-v="${s}">${ic('search', 14)}${s}</button>`).join('')}</div>` : ''}
        ${none ? `<div class="empty mt-24">Nothing matches “${esc(U.search)}”. Try a city, a brand or a plug type like CCS2.</div>` : ''}
        ${st.length ? `<p class="group-label">Stations</p><div class="list">${st.map((s) => `<button class="list-row" data-a="go" data-v="station" data-id="${s.id}"><img src="${img(s.photos[0])}" alt="" style="width:44px;height:44px;border-radius:10px;object-fit:cover"><span class="grow"><b class="t15">${esc(s.name)}</b><br><span class="t13 muted">${esc(s.area)}, ${esc(s.city)} · <span class="mono">${stMax(s)} kW</span></span></span>${ic('chevR', 18)}</button>`).join('')}</div>` : ''}
        ${cars.length ? `<p class="group-label">Cars</p><div class="list">${cars.map((c) => `<button class="list-row" data-a="go" data-v="car" data-slug="${c.slug}">${carStage(c, '', 'width:56px;height:42px;border-radius:10px;flex:none')}<span class="grow"><b class="t15">${esc(c.name)}</b><br><span class="t13 muted">${esc(c.price)}</span></span>${ic('chevR', 18)}</button>`).join('')}</div>` : ''}
        ${svc.length ? `<p class="group-label">Services</p><div class="list">${svc.map((s) => `<button class="list-row" data-a="go" data-v="service" data-id="${s.id}"><span class="ico">${ic(SVC_CAT[s.category]?.[1] || 'wrench', 18)}</span><span class="grow"><b class="t15">${esc(s.name)}</b><br><span class="t13 muted">${SVC_CAT[s.category]?.[0]} · ${esc(s.city)}</span></span>${ic('chevR', 18)}</button>`).join('')}</div>` : ''}
        ${posts.length ? `<p class="group-label">Community</p><div class="list">${posts.map((p) => `<button class="list-row" data-a="go" data-v="post" data-id="${p.id}"><span class="ico">${ic('chat', 18)}</span><span class="grow"><b class="t14 clamp2">${esc(p.title)}</b></span>${ic('chevR', 18)}</button>`).join('')}</div>` : ''}
      </div>`,
  }
}
IN.search = (v) => { U.search = v; render() }
A.searchFill = (v) => { U.search = v; render() }

// ─── Notifications ─────────────────────────────────────────────────
SCREENS.notifications = () => {
  if (!S.seenNotif) { S.seenNotif = true; save() }
  const items = [
    { i: 'bolt', t: 'Welcome to plug.pk', b: 'Find chargers on the map, plan a drive or work out a charge time. Everything you save stays on this device.', d: 'Today' },
    { i: 'flag', t: 'Six example stations', b: 'The stations you see are sample listings while operators join. They’re marked “Example listing”.', d: 'Today' },
    { i: 'users', t: 'Clubs in 8 cities', b: 'Meet other drivers near you. Join a club from the Community tab.', d: 'This week' },
  ]
  return {
    sb: 'dark',
    html: `${topbar('Notifications')}
      <div class="scroll pad stack gap-12" style="padding-bottom:40px">
        ${items.map((n) => `<div class="card p16 row" style="align-items:flex-start;gap:14px"><span class="list-row" style="padding:0;min-height:0;border:0;width:auto"><span class="ico">${ic(n.i, 18)}</span></span><div class="grow"><div class="row between"><b class="t15">${n.t}</b><span class="t12 faint">${n.d}</span></div><p class="t14 muted mt-4">${n.b}</p></div></div>`).join('')}
        <button class="btn btn-secondary mt-8" data-a="go" data-v="settings">${ic('gear', 18)}Notification settings</button>
      </div>`,
  }
}

function topbar(title, action = '') {
  return `<div class="topbar ${action ? 'has-action' : ''}"><button class="icon-btn" data-a="back" aria-label="Back">${ic('arrowL', 22)}</button><h1>${title}</h1>${action}</div>`
}
