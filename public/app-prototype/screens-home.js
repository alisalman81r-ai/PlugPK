// plug.pk app prototype — onboarding, sign-in, home, search, notifications.
'use strict'

const POPULAR_SLUGS = ['byd-atto-3-advanced', 'mg-zs-ev', 'byd-seal', 'byd-atto-2', 'mg-4-urban', 'honri-ve-2', 'dfsk-seres-3', 'deepal-s07', 'deepal-l07', 'kia-ev5', 'gwm-ora-03', 'byd-sealion-7-advanced'].filter(carBySlug)

// ─── Onboarding ────────────────────────────────────────────────────
const SLIDES = [
  {
    art: () => `<img src="${img('home/freedom-car-hd.png')}" alt="">`,
    title: 'Find a charger <span class="hl">anywhere in Pakistan</span>',
    body: 'Every listed charger on one map, with the plug, the speed and what’s nearby while you wait.',
  },
  {
    bg: 'hero/hero-scene-v4.png',
    title: 'Plan drives around <span class="hl">your car’s real range</span>',
    body: 'Tell us what you drive. We work out whether you’ll make it, where to charge and for how long.',
  },
  {
    art: () => `<div style="position:relative;width:100%;height:260px">
      ${['byd-seal', 'byd-atto-3-advanced', 'mg-4-urban'].map((s, i) => `<div class="stage-img" style="position:absolute;width:62%;aspect-ratio:4/3;border-radius:22px;left:${[2, 19, 36][i]}%;top:${[30, 0, 52][i]}px;transform:rotate(${[-6, 0, 5][i]}deg);box-shadow:0 24px 50px rgba(0,0,0,.45);z-index:${[1, 3, 2][i]}"><img src="${img(carBySlug(s).image)}" alt=""></div>`).join('')}
    </div>`,
    title: 'Compare every EV <span class="hl">sold in Pakistan</span>',
    body: `${D.cars.length} cars with PKR prices, real specs and charging times. Then ask the owners.`,
  },
]

SCREENS.onboarding = () => {
  const st = U.onbStep
  if (st === SLIDES.length) return authScreen()
  if (st === SLIDES.length + 1) return pickCarScreen()
  const s = SLIDES[st]
  return {
    sb: 'light',
    html: `<div class="onb">
      ${s.bg ? `<img src="${img(s.bg)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:70% 20%;opacity:.95"><div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,36,30,.1) 30%,#05241E 78%)"></div>` : ''}
      <div class="row between" style="position:absolute;z-index:3;left:0;right:0;top:0;padding:calc(var(--top) + 8px) 20px 0">
        ${logo(20)}
        <button class="btn btn-sm" style="color:rgba(255,255,255,.75)" data-a="onbSkip">Skip</button>
      </div>
      <div class="art">${s.art ? s.art() : ''}</div>
      <div class="copy" style="animation:up .5s cubic-bezier(.2,.8,.2,1)">
        <h1>${s.title}</h1>
        <p>${s.body}</p>
      </div>
      <div class="foot">
        <div class="pg">${SLIDES.map((_, i) => `<i class="${i === st ? 'on' : ''}"></i>`).join('')}</div>
        <button class="next-fab" data-a="onbNext" aria-label="Next">${ic('arrowR', 26)}</button>
      </div>
    </div>`,
  }
}

function authScreen() {
  const up = U.authMode === 'signup'
  const e = U.authErr || {}
  return {
    sb: 'light',
    html: `<div class="auth"><div class="scroll">
      <div class="auth-head">
        <div style="position:relative">${logo(22)}</div>
        <h1 class="band-title" style="margin-top:28px;position:relative">${up ? 'Create your <span class="hl">plug.pk</span> account' : 'Welcome <span class="hl">back</span>'}</h1>
        <p class="muted" style="margin-top:8px;position:relative;color:rgba(255,255,255,.65)">${up ? 'Save stations and routes, review chargers and join the community.' : 'Sign in to pick up your saved stations and routes.'}</p>
      </div>
      <form class="pad stack gap-16" style="padding-top:24px;padding-bottom:24px" data-submit="authSubmit" novalidate>
        ${up ? `<div><label class="label" for="au-name">Your name</label><input class="input" id="au-name" name="name" autocomplete="name" placeholder="Ahmed Raza" value="${esc(U.authVals?.name)}">${e.name ? `<p class="err-msg">${ic('info', 15)}${e.name}</p>` : ''}</div>` : ''}
        <div><label class="label" for="au-email">Email</label><div class="field"><span class="lead">${ic('mail', 18)}</span><input class="input" id="au-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" value="${esc(U.authVals?.email)}"></div>${e.email ? `<p class="err-msg">${ic('info', 15)}${e.email}</p>` : ''}</div>
        <div><label class="label" for="au-pass">Password</label><div class="field"><span class="lead">${ic('lock', 18)}</span><input class="input" id="au-pass" name="password" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="${up ? 'At least 8 characters' : 'Your password'}"></div>${e.password ? `<p class="err-msg">${ic('info', 15)}${e.password}</p>` : ''}</div>
        ${!up ? '<button type="button" class="link" style="align-self:flex-end;margin-top:-8px" data-a="forgot">Forgot password?</button>' : ''}
        <button class="btn btn-primary btn-lg btn-block" type="submit">${up ? 'Create account' : 'Sign in'}</button>
        <div class="row" style="gap:12px;color:var(--faint);font-size:13px"><span class="grow" style="height:1px;background:var(--line)"></span>or<span class="grow" style="height:1px;background:var(--line)"></span></div>
        <button class="btn btn-secondary btn-lg btn-block" type="button" data-a="guest">Continue as guest</button>
        <p class="t14 muted" style="text-align:center">${up ? 'Already have an account?' : 'New to plug.pk?'} <button type="button" class="link" data-a="authMode">${up ? 'Sign in' : 'Create one'}</button></p>
        <p class="t12 faint" style="text-align:center">Prototype: accounts are kept on this device only.</p>
      </form>
    </div></div>`,
  }
}

function pickCarScreen() {
  const q = U.pickQ.trim().toLowerCase()
  const list = q ? D.cars.filter((c) => isPlugIn(c) && `${c.name} ${c.brand}`.toLowerCase().includes(q)) : POPULAR_SLUGS.map(carBySlug)
  const sel = U.pick ?? S.primary
  return {
    sb: 'dark',
    html: `<div class="auth">
      <div class="topbar"><h1 style="margin:0;text-align:left;font-size:24px;padding:8px 4px 0">What do you drive?</h1></div>
      <div class="scroll" style="padding-bottom:120px">
        <p class="pad muted t15">We use its battery, range and plug to plan routes and charge times. You can change it any time.</p>
        <div class="pad mt-16"><div class="field"><span class="lead">${ic('search', 18)}</span><input class="input" id="pick-q" data-in="pickQ" placeholder="Search ${D.cars.filter(isPlugIn).length} plug-in cars" value="${esc(U.pickQ)}"></div></div>
        <div class="pad mt-16"><p class="group-label" style="margin-top:0">${q ? `${list.length} match${list.length === 1 ? '' : 'es'}` : 'Popular in Pakistan'}</p>
          <div class="pick-grid">${list.slice(0, 24).map((c) => `<button class="pick ${sel === c.slug ? 'on' : ''}" data-a="pickCar" data-v="${c.slug}">
            ${carStage(c)}<div class="bd"><div class="t12 faint b7" style="letter-spacing:.1em;text-transform:uppercase">${esc(c.brand)}</div><div class="t14 b7 trunc">${esc(c.model)}</div><div class="t12 mono muted">${carRange(c) ? `${carRange(c)} km` : '—'} · ${c.battery} kWh</div></div>
            ${sel === c.slug ? `<span class="tick">${ic('check', 14, { sw: 2.6 })}</span>` : ''}</button>`).join('')}</div>
          ${!list.length ? '<div class="empty">No plug-in car matches that. Try the brand name, like “BYD” or “MG”.</div>' : ''}
        </div>
      </div>
      <div class="bottom-bar" style="position:absolute;left:0;right:0;bottom:0">
        <button class="btn btn-ghost" data-a="finishOnb" data-v="none">No EV yet</button>
        <button class="btn btn-primary grow" data-a="finishOnb" ${sel ? '' : 'disabled'}>Continue</button>
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
  pickCar: (slug) => { U.pick = slug; render() },
  finishOnb: (v) => {
    if (v !== 'none' && U.pick) { S.primary = U.pick; if (!S.garage.includes(U.pick)) S.garage = [U.pick, ...S.garage] }
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
          <button class="qa" data-a="go" data-v="services"><span class="ico">${ic('wrench', 22)}</span>EV services</button>
          <button class="qa" data-a="go" data-v="compare"><span class="ico">${ic('compare', 22)}</span>Compare cars</button>
          <button class="qa" data-a="go" data-v="clubs"><span class="ico">${ic('users', 22)}</span>EV clubs</button>
          <button class="qa" data-a="go" data-v="partners"><span class="ico">${ic('handshake', 22)}</span>Partner Up</button>
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
