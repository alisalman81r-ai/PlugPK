// plug.pk app prototype — route planner, car catalogue, car detail, compare, car picker.
'use strict'

const routeCar = () => (U.route.slug ? carBySlug(U.route.slug) : myCar())

// ─── Routes tab ────────────────────────────────────────────────────
function socHint(car, pct) {
  const r = car && carRange(car)
  if (!r || !isPlugIn(car)) return 'Add a plug-in car to see how far that takes you.'
  const km = Math.max(0, Math.floor((r * DERATE * (pct - RESERVE)) / 100))
  return `≈ <b class="mono">${km} km</b> of motorway driving before your ${RESERVE}% reserve`
}
function carRowBtn(car, action, v) {
  if (!car) return `<button class="car-row" data-a="${action}" data-v="${v}"><span class="qa" style="min-height:0;width:64px;height:44px;padding:0;display:grid;place-items:center;border-radius:10px;box-shadow:none">${ic('plus', 20)}</span><span class="grow"><b class="t15">Choose your car</b><br><span class="t13 muted">Range and charging use its figures</span></span>${ic('chevR', 18)}</button>`
  const r = carRange(car)
  return `<button class="car-row" data-a="${action}" data-v="${v}">${carStage(car)}<span class="grow" style="min-width:0"><b class="t15 trunc" style="display:block">${esc(car.name)}</b><span class="t13 muted mono">${r ? `${r} km${car.rangeStd ? ` ${car.rangeStd}` : ''}` : 'Range —'} · ${car.battery ?? '—'} kWh</span></span><span class="link" style="min-height:0">Change</span></button>`
}

SCREENS.routes = () => {
  const R = U.route
  const car = routeCar()
  const opts = (sel) => ROUTE_CITIES.map((c) => `<option ${c === sel ? 'selected' : ''}>${c}</option>`).join('')
  const km = roadKm(R.from, R.to)
  return {
    sb: 'light', tabs: true,
    html: `<div class="scroll">
      <header class="band lift">
        <div class="eyebrow" style="position:relative">${ic('route', 13)} Route planner</div>
        <h1 class="band-title mt-8" style="position:relative">Plan a drive around your car’s <span class="hl">real range</span></h1>
        <p class="t14 mt-8" style="color:rgba(255,255,255,.65);position:relative">Pick two cities and your car. We check if you’ll make it and where to charge.</p>
      </header>
      <div class="pad lifted">
        <div class="sheet-card planner stack gap-16">
          <div class="od">
            <span class="dotl" style="background:#22C55E;top:24px"></span>
            <span class="dotl" style="background:#EF4444;top:auto;bottom:19px"></span>
            <div class="field"><label class="sr" for="rt-from">From</label><select class="select" id="rt-from" data-ch="routeFrom">${opts(R.from)}</select></div>
            <div class="field"><label class="sr" for="rt-to">To</label><select class="select" id="rt-to" data-ch="routeTo">${opts(R.to)}</select></div>
            <button class="swap" data-a="swapRoute" aria-label="Swap start and destination">${ic('swap', 18)}</button>
          </div>
          <div data-part="km" class="row between t13" style="margin-top:-6px">${km ? `<span class="muted">Road distance</span><span class="mono b7">${km} km · ~${fmtDur(driveMin(km))}</span>` : `<span class="muted">${R.from === R.to ? 'Pick two different cities.' : 'No road distance on file for this pair yet.'}</span>`}</div>
          <div><span class="label">Your car</span>${carRowBtn(car, 'sheet', 'carPicker" data-target="route')}</div>
          <div>
            <div class="row between"><label class="label" for="rt-soc" style="margin:0">Battery when you leave</label><b class="mono t17" data-part="socv">${R.start}%</b></div>
            <input type="range" id="rt-soc" min="10" max="100" step="5" value="${R.start}" data-in="routeStart" style="--p:${((R.start - 10) / 90) * 100}%">
            <p class="t13 muted" data-part="soch">${socHint(car, R.start)}</p>
          </div>
          <button class="btn btn-primary btn-lg btn-block" data-a="planRoute" ${km ? '' : 'disabled'}>${ic('route', 20)}Plan route</button>
        </div>
      </div>

      ${S.routes.length ? `<section class="section"><div class="sec-head"><h2>Saved routes</h2><button class="link" data-a="go" data-v="savedRoutes">All ${ic('arrowR', 14)}</button></div>
        <div class="pad stack gap-8">${S.routes.slice(0, 3).map(savedRouteRow).join('')}</div></section>` : ''}

      <section class="section">
        <div class="sec-head"><div><h2>Popular routes</h2><p class="sub">${POPULAR.length} corridors drivers plan most</p></div></div>
        <div class="pad stack gap-8">${POPULAR.map(([f, t, note]) => {
          const k = roadKm(f, t)
          return `<button class="card press row" style="padding:14px 16px;gap:14px;text-align:left" data-a="planPopular" data-v="${f}|${t}">
            <span class="route-line" style="flex:none"><span class="dot" style="background:#22C55E"></span><b class="t14">${f}</b><span class="bar" style="height:10px"></span><span></span><span class="dot" style="background:#EF4444"></span><b class="t14">${t}</b></span>
            <span class="grow" style="text-align:right"><b class="mono t14">${k} km</b><br><span class="t12 muted">${note} · <span class="mono">~${fmtDur(driveMin(k))}</span></span></span>${ic('chevR', 18)}</button>`
        }).join('')}</div>
      </section>

      <section class="section pad">
        <div class="notice neutral">${ic('info', 18)}<span><b>How we plan.</b> We take ${Math.round(DERATE * 100)}% of the rated range for motorway speed with the AC on, keep a ${RESERVE}% reserve, and only plan stops at chargers plug.pk lists. Distances are estimates, not a live routing service.</span></div>
      </section>
    </div>`,
  }
}
function savedRouteRow(r) {
  const car = carBySlug(r.slug)
  return `<div class="card row" style="padding:12px 12px 12px 16px;gap:12px">
    <button class="grow row" style="text-align:left;gap:12px" data-a="openSavedRoute" data-v="${r.id}"><span class="ico" style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:var(--tint);color:var(--accent-text)">${ic('route', 18)}</span>
    <span class="grow" style="min-width:0"><b class="t15">${r.from} → ${r.to}</b><br><span class="t12 muted trunc" style="display:block">${car ? esc(car.name) : 'No car'} · leave at ${r.start}% · <span class="mono">${roadKm(r.from, r.to)} km</span></span></span></button>
    <button class="icon-btn" data-a="delRoute" data-v="${r.id}" aria-label="Delete route">${ic('trash', 18)}</button></div>`
}
Object.assign(A, {
  swapRoute: () => { const R = U.route; [R.from, R.to] = [R.to, R.from]; render() },
  planRoute: () => go('routeResult'),
  openSavedRoute: (id) => {
    const r = S.routes.find((x) => x.id === id)
    Object.assign(U.route, { from: r.from, to: r.to, start: r.start, slug: r.slug })
    go('routeResult')
  },
  delRoute: (id) => { S.routes = S.routes.filter((x) => x.id !== id); save(); render(); toast('Route deleted', 'trash') },
  saveRoute: () => {
    const R = U.route, slug = routeCar()?.slug || null
    const dup = S.routes.find((x) => x.from === R.from && x.to === R.to && x.slug === slug && x.start === R.start)
    if (dup) { S.routes = S.routes.filter((x) => x !== dup); save(); render(); return toast('Removed from saved routes', 'bookmark') }
    S.routes.unshift({ id: 'r' + Date.now(), from: R.from, to: R.to, start: R.start, slug, savedAt: new Date().toISOString() })
    save(); render(); toast('Route saved', 'bookmark')
  },
  shareRoute: () => {
    const R = U.route
    copyText(`${R.from} → ${R.to}, ${roadKm(R.from, R.to)} km. Planned on plug.pk`, 'Route copied')
  },
})
IN.routeFrom = (v) => { U.route.from = v; render() }
IN.routeTo = (v) => { U.route.to = v; render() }
IN.routeStart = (v, el) => {
  U.route.start = +v
  el.style.setProperty('--p', `${((v - 10) / 90) * 100}%`)
  renderPart('socv', 'soch')
}

// ─── Route result ──────────────────────────────────────────────────
SCREENS.routeResult = () => {
  const R = U.route
  const car = routeCar()
  const p = planRoute(R.from, R.to, car, R.start)
  if (p.error) return { sb: 'dark', html: `${topbar('Route')}<div class="scroll pad"><div class="empty">${esc(p.error)}<button class="btn btn-sm btn-secondary" data-a="back">Back</button></div></div>` }
  const saved = S.routes.some((x) => x.from === R.from && x.to === R.to && x.slug === (car?.slug || null) && x.start === R.start)
  const chargeMin = p.est?.ok ? p.est.minutes : 0
  const arrive = p.arrive
  const tl = []
  tl.push(['go', 'pin', `Leave ${p.from}`, `With <b class="mono">${R.start}%</b>${car ? ` in your ${esc(car.name)}` : ''}`])
  if (p.kind === 'topup') {
    const s = p.station
    tl.push(['charge', 'bolt', `Charge at ${esc(s.name)}`, `${esc(s.area)}, ${esc(s.city)} · ${connBadge(p.conn.type)} <span class="mono">${fmtKw(p.conn.kw)} kW</span><br>
      <b class="mono">${R.start}% → ${p.target}%</b> in about <b class="mono">${fmtDur(p.est.minutes)}</b>${p.est.cost ? ` · ~${fmtRs(p.est.cost)} at Rs 50/kWh` : ''}
      <div class="mt-8">${exampleBadge()}</div>
      <button class="btn btn-sm btn-secondary mt-8" data-a="go" data-v="station" data-id="${s.id}">View station ${ic('arrowR', 14)}</button>`])
  }
  if (p.kind === 'tophome') {
    tl.push(['charge', 'plug', `Charge to ${p.target}% before you go`, `plug.pk doesn’t list a charger in ${p.from} yet. On a 7.4 kW wall box that’s about <b class="mono">${fmtDur(p.est.minutes)}</b>.`])
  }
  if (p.kind === 'gap') {
    tl.push(['warn', 'info', `Range runs short around km ${p.reach}`, `Even from 100%, your ${esc(car.name)} reaches about <b class="mono">${p.reach} km</b> of this <b class="mono">${p.km} km</b> drive before the ${RESERVE}% reserve. plug.pk doesn’t list a charger along this corridor yet, so we can’t plan the stops honestly.`])
  }
  if (p.kind === 'phev') {
    tl.push(['charge', 'battery', `Electric for the first ${p.elecKm} km`, `After that the engine takes over. No charging stop needed.`])
  }
  tl.push(['', 'car', `Drive ${p.km} km`, `About <b class="mono">${fmtDur(p.drive)}</b> at an 80 km/h average, stops not included`])
  tl.push(['end', 'flag', `Arrive in ${p.to}`, arrive != null ? `With about <b class="mono">${arrive}%</b> left` : p.kind === 'hybrid' ? 'A hybrid charges itself while you drive — no plug needed.' : p.kind === 'gap' ? 'Plan a charge on the way before you set off.' : ''])

  const summary = [
    ['Distance', `${p.km}`, 'km'],
    ['Drive', fmtDur(p.drive), ''],
    ['Charging', chargeMin ? fmtDur(chargeMin) : p.kind === 'gap' ? '—' : 'None', ''],
    ['Arrive', arrive != null ? `${arrive}` : '—', arrive != null ? '%' : ''],
  ]
  // Map illustration: start bottom-left, end top-right.
  const pathD = 'M 40 180 C 120 170, 140 90, 210 100 S 300 60, 350 34'
  const gapAt = p.kind === 'gap' ? clamp(p.reach / p.km, 0.08, 0.92) : null
  return {
    sb: 'dark',
    html: `${topbar(`${p.from} → ${p.to}`, `<button class="icon-btn" data-a="saveRoute" aria-label="${saved ? 'Remove saved route' : 'Save route'}">${ic('bookmark', 20, { fill: saved })}</button>`)}
      <div class="scroll pad" style="padding-bottom:110px">
        <div class="route-map">
          <svg viewBox="0 0 390 220" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect width="390" height="220" style="fill:var(--map-block)"/>
            <g style="stroke:var(--map-street)" stroke-width="3" opacity=".9">${Array.from({ length: 14 }, (_, i) => `<path d="M ${i * 34 - 40} 0 L ${i * 34 + 40} 220"/><path d="M 0 ${i * 26} L 390 ${i * 26 - 30}"/>`).join('')}</g>
            <path d="${pathD}" style="stroke:var(--map-road-edge)" stroke-width="12" fill="none" stroke-linecap="round"/>
            <path id="rpath" d="${pathD}" stroke="${p.kind === 'gap' ? '#F59E0B' : '#26CDB2'}" stroke-width="5" fill="none" stroke-linecap="round" ${p.kind === 'gap' ? 'stroke-dasharray="8 7"' : ''}/>
            ${gapAt != null ? `<path d="${pathD}" stroke="#26CDB2" stroke-width="5" fill="none" stroke-linecap="round" pathLength="100" stroke-dasharray="${gapAt * 100} 100"/>` : ''}
            <circle cx="40" cy="180" r="9" fill="#22C55E" stroke="#fff" stroke-width="3"/>
            <circle cx="350" cy="34" r="9" fill="#EF4444" stroke="#fff" stroke-width="3"/>
            ${p.kind === 'topup' || p.kind === 'tophome' ? `<g transform="translate(62 162)"><circle r="13" fill="#05241E" stroke="#26CDB2" stroke-width="2"/><path d="M1.5-7-5 1.5h5l-1 6 6.5-8.5h-5z" fill="#26CDB2"/></g>` : ''}
            <g font-family="Figtree, sans-serif" font-weight="700" font-size="13" style="fill:var(--fg)"><text x="56" y="205">${p.from}</text><text x="340" y="62" text-anchor="end">${p.to}</text></g>
          </svg>
        </div>
        <div class="tiles mt-12" style="grid-template-columns:repeat(4,1fr)">${summary.map(([k, v, u]) => `<div class="tile" style="padding:10px"><div class="k" style="font-size:11px">${k}</div><div class="v" style="font-size:16px">${v}<small>${u}</small></div></div>`).join('')}</div>
        ${p.kind === 'nocar' ? `<div class="notice mint mt-16">${ic('car', 18)}<span>Add your car to see if you’ll make it on one charge. ${carRowBtn(null, 'sheet', 'carPicker" data-target="route')}</span></div>` : ''}
        <h2 class="t20 mt-24">Your plan</h2>
        <div class="timeline mt-12">${tl.map(([cls, icon, t, b]) => `<div class="tl-item"><span class="tl-ico ${cls}">${ic(icon, 18)}</span><div style="padding-top:8px"><b class="t15">${t}</b><div class="t14 muted mt-4">${b}</div></div></div>`).join('')}</div>
        ${p.kind === 'gap' ? `<button class="btn btn-secondary btn-block" data-a="tripReports">${ic('chat', 18)}Read trip reports from drivers</button>` : ''}
        ${p.dest?.length ? `<h2 class="t20 mt-24">Chargers in ${p.to}</h2><div class="stack gap-12 mt-12">${p.dest.map(stationRow).join('')}</div>` : ''}
        <div class="notice neutral mt-24">${ic('info', 18)}<span>Range taken at ${Math.round(DERATE * 100)}% of the ${car?.rangeStd || 'rated'} figure for motorway driving with the AC on. Charge times use plug.pk’s charging model and are estimates.</span></div>
      </div>
      <div class="bottom-bar">
        <button class="btn btn-secondary btn-icon" data-a="shareRoute" aria-label="Copy route">${ic('share', 18)}</button>
        <button class="btn btn-secondary" data-a="saveRoute">${ic('bookmark', 18, { fill: saved })}${saved ? 'Saved' : 'Save'}</button>
        <a class="btn btn-nav grow" href="https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(p.from + ', Pakistan')}&destination=${encodeURIComponent(p.to + ', Pakistan')}" target="_blank" rel="noopener">Start ${ic('nav', 18)}</a>
      </div>`,
  }
}
A.tripReports = () => { U.comm.cat = 'trip-report'; tab('community') }

// ─── Car picker (route, calculator, garage, compare) ───────────────
SHEETS.carPicker = (sh) => {
  const plugOnly = sh.target === 'route' || sh.target === 'calc'
  const list = D.cars.filter((c) => !plugOnly || isPlugIn(c)).sort((a, b) => a.name.localeCompare(b.name))
  const current = sh.target === 'route' ? routeCar()?.slug : sh.target === 'calc' ? U.calc.slug || S.primary : null
  const mine = S.garage.map(carBySlug).filter(Boolean).filter((c) => !plugOnly || isPlugIn(c))
  const row = (c) => `<button class="list-row" data-a="pickFor" data-v="${c.slug}" data-search="${esc(`${c.name} ${c.brand}`.toLowerCase())}">${carStage(c, '', 'width:60px;height:42px;border-radius:10px;flex:none')}<span class="grow" style="min-width:0"><b class="t14 trunc" style="display:block">${esc(c.name)}</b><span class="t12 muted mono">${carRange(c) ? `${carRange(c)} km` : '—'} · ${c.battery ?? '—'} kWh · ${KIND[c.category]}</span></span>${current === c.slug ? `<span class="accent-text">${ic('check', 20, { sw: 2.4 })}</span>` : ''}</button>`
  return {
    title: sh.target === 'compare' ? 'Add a car to compare' : sh.target === 'garage' ? 'Add a car to your garage' : 'Choose a car',
    full: true,
    body: `<div class="field" style="position:sticky;top:0;z-index:2;background:var(--surface);padding-bottom:8px"><span class="lead" style="top:24px">${ic('search', 18)}</span><input class="input" id="cp-q" data-in="pickerQ" placeholder="Search ${list.length} cars" autocomplete="off"></div>
      ${mine.length && sh.target !== 'garage' ? `<p class="group-label" data-group>Your garage</p><div class="list" data-group>${mine.map(row).join('')}</div>` : ''}
      <p class="group-label">${plugOnly ? 'Plug-in cars' : 'All cars'}</p>
      <div class="list" id="cp-list">${list.map(row).join('')}</div>
      <p class="t14 muted mt-16" id="cp-none" hidden>No car matches that. Try the brand, like “BYD”.</p>`,
  }
}
IN.pickerQ = (v) => {
  const q = v.trim().toLowerCase()
  document.querySelectorAll('#cp-list .list-row').forEach((r) => (r.hidden = q && !r.dataset.search.includes(q)))
  document.querySelectorAll('[data-group]').forEach((g) => (g.hidden = !!q))
  $('#cp-none').hidden = !q || [...document.querySelectorAll('#cp-list .list-row')].some((r) => !r.hidden)
}
A.pickFor = (slug) => {
  const t = U.sheet.t === 'carPicker' && U.sheet.target
  const car = carBySlug(slug)
  closeSheet()
  if (t === 'route') { U.route.slug = slug; render() }
  else if (t === 'calc') { U.calc.slug = slug; if (!car.dc && U.calc.mode === 'dc') { U.calc.mode = 'ac'; U.calc.kw = 7.4 } render() }
  else if (t === 'garage') {
    if (!S.garage.includes(slug)) S.garage.push(slug)
    if (!S.primary) S.primary = slug
    save(); render(); toast(`${car.name} added to your garage`, 'car')
  } else if (t === 'compare') {
    if (!S.compare.includes(slug)) {
      if (S.compare.length >= 3) return toast('Compare up to 3 cars — remove one first', 'info')
      S.compare.push(slug)
    }
    save(); render()
  }
}

// ─── Cars tab ──────────────────────────────────────────────────────
const SORTS = { 'price-asc': 'Price: low to high', 'price-desc': 'Price: high to low', range: 'Longest range', power: 'Most powerful', az: 'A to Z' }
function carList() {
  const f = U.cars, q = f.q.trim().toLowerCase()
  let list = D.cars.filter((c) => (f.cat === 'all' || c.category === f.cat) && (!f.brand || c.brand === f.brand) && (!q || `${c.name} ${c.brand} ${c.body || ''}`.toLowerCase().includes(q)))
  const sorters = {
    'price-asc': by('priceMin'), 'price-desc': (a, b) => (b.priceMin ?? 0) - (a.priceMin ?? 0),
    range: (a, b) => (carRange(b) ?? 0) - (carRange(a) ?? 0), power: (a, b) => (b.power ?? 0) - (a.power ?? 0), az: (a, b) => a.name.localeCompare(b.name),
  }
  return list.sort(sorters[f.sort])
}
function carCard(c) {
  const fav = S.fav.includes(c.slug), cmp = S.compare.includes(c.slug)
  const r = carRange(c)
  return `<div class="card car-card">
    <button data-a="go" data-v="car" data-slug="${c.slug}" style="text-align:left;display:flex;flex-direction:column;flex:1">
      ${carStage(c)}
      <div class="bd">
        <span class="brand trunc">${esc(c.brand)}</span>
        <b class="t15 trunc" style="line-height:1.25">${esc(c.model)}</b>
        <span class="t12 muted">${KIND[c.category]}${c.seats ? ` · ${c.seats} seats` : ''}</span>
        <b class="t14 mt-4" style="padding-right:40px">${esc(c.price)}</b>
        <div class="specs"><span><small>Batt</small>${c.battery ?? '—'}</span><span><small>${c.category === 'EV' ? 'Range' : 'E-range'}</small>${r ?? '—'}</span><span><small>kW</small>${c.power ?? '—'}</span></div>
      </div>
    </button>
    <span class="chiprow">${c.category !== 'EV' ? `<span class="photo-chip">${c.category}</span>` : ''}</span>
    <button class="glass-btn fav ${fav ? 'on' : ''}" data-a="fav" data-v="${c.slug}" aria-label="${fav ? 'Remove favourite' : 'Add favourite'}">${ic('heart', 18, { fill: fav })}</button>
    <button class="cmp-btn ${cmp ? 'on' : ''}" data-a="compare" data-v="${c.slug}" aria-label="${cmp ? 'Remove from compare' : 'Add to compare'}" aria-pressed="${cmp}">${ic('compare', 16)}</button>
  </div>`
}

SCREENS.cars = () => {
  const f = U.cars
  const list = carList()
  const cats = ['all', 'EV', 'PHEV', 'Hybrid', 'REEV']
  const count = (k) => (k === 'all' ? D.cars.length : D.cars.filter((c) => c.category === k).length)
  const brands = [...new Set(D.cars.map((c) => c.brand))].sort((a, b) => D.cars.filter((c) => c.brand === b).length - D.cars.filter((c) => c.brand === a).length)
  return {
    sb: 'light', tabs: true,
    html: `<div class="scroll">
      <header class="band" style="padding-bottom:22px">
        <div class="row between" style="position:relative">
          <div class="eyebrow">${ic('car', 13)} Cars</div>
          <button class="btn btn-sm btn-outline-white" data-a="go" data-v="compare">${ic('compare', 16)}Compare${S.compare.length ? ` <span class="mono">${S.compare.length}</span>` : ''}</button>
        </div>
        <h1 class="band-title mt-8" style="position:relative">Every EV <span class="hl">sold in Pakistan</span></h1>
        <p class="t14 mt-4" style="color:rgba(255,255,255,.65);position:relative"><span class="mono">${D.cars.length}</span> cars · prices in PKR</p>
        <div class="field mt-16" style="position:relative"><span class="lead" style="color:rgba(255,255,255,.5)">${ic('search', 18)}</span><input class="input" id="car-q" data-in="carQ" placeholder="Search brand or model" value="${esc(f.q)}" style="background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#fff"></div>
      </header>
      <div class="chips mt-16">${cats.map((k) => `<button class="chip solid ${f.cat === k ? 'on' : ''}" data-a="carCat" data-v="${k}">${k === 'all' ? 'All' : k}<span class="cnt">${count(k)}</span></button>`).join('')}</div>
      <div class="chips mt-8">${brands.map((b) => `<button class="chip ${f.brand === b ? 'on' : ''}" data-a="carBrand" data-v="${esc(b)}">${f.brand === b ? ic('check', 14, { sw: 2.4 }) : ''}${esc(b)}</button>`).join('')}</div>
      <div class="pad row between mt-12" style="margin-bottom:12px">
        <span class="t13 muted"><b class="mono" style="color:var(--fg)">${list.length}</b> car${list.length === 1 ? '' : 's'}</span>
        <div class="field" style="width:200px"><label class="sr" for="car-sort">Sort</label><select class="select" id="car-sort" data-ch="carSort" style="height:40px;border-radius:999px;font-size:14px">${Object.entries(SORTS).map(([k, l]) => `<option value="${k}" ${f.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select><span class="caret">${ic('chevD', 16)}</span></div>
      </div>
      ${list.length ? `<div class="car-grid">${list.map(carCard).join('')}</div>` : `<div class="pad"><div class="empty">No car matches. <button class="btn btn-sm btn-secondary" data-a="carReset">Clear search and filters</button></div></div>`}
    </div>
    ${S.compare.length ? compareTray() : ''}`,
  }
}
function compareTray() {
  return `<div class="tray"><div class="thumbs">${S.compare.map((s) => carStage(carBySlug(s))).join('')}</div>
    <span class="grow t14"><b class="mono">${S.compare.length}</b>/3 to compare</span>
    <button class="btn btn-sm btn-ghost" data-a="clearCompare">Clear</button>
    <button class="btn btn-sm btn-primary" data-a="go" data-v="compare" ${S.compare.length < 2 ? 'disabled' : ''}>Compare</button></div>`
}
Object.assign(A, {
  carCat: (v) => { U.cars.cat = v; render() },
  carBrand: (v) => { U.cars.brand = U.cars.brand === v ? null : v; render() },
  carReset: () => { Object.assign(U.cars, { q: '', cat: 'all', brand: null }); render() },
  clearCompare: () => { S.compare = []; save(); render() },
})
IN.carQ = (v) => { U.cars.q = v; render() }
IN.carSort = (v) => { U.cars.sort = v; render() }

// ─── Car detail ────────────────────────────────────────────────────
SCREENS.car = ({ slug }) => {
  const c = carBySlug(slug)
  const fav = S.fav.includes(slug), cmp = S.compare.includes(slug)
  const inGarage = S.garage.includes(slug), primary = S.primary === slug
  const r = carRange(c)
  const tiles = [
    [c.category === 'EV' ? 'Range' : 'Electric range', r, 'km', c.rangeStd || (r ? 'Standard not stated' : '')],
    ['Battery', c.battery, 'kWh', ''],
    ['Power', c.power, 'kW', c.power ? `${Math.round(c.power * 1.341)} hp` : ''],
    ['0–100', c.accel, 's', ''],
    ['Top speed', c.topSpeed, 'km/h', ''],
    ['Seats', c.seats, '', ''],
  ]
  const conns = carConns(c)
  const dcEst = c.dc && c.battery ? estimateCharge({ kwh: c.battery, from: 10, to: 80, mode: 'dc', chargerKw: c.dc, carKw: c.dc }) : null
  const acEst = c.ac && c.battery ? estimateCharge({ kwh: c.battery, from: 10, to: 100, mode: 'ac', chargerKw: 7.4, carKw: c.ac }) : null
  const road = r && c.rangeStd && STD[c.rangeStd] ? roadEstimates(r, c.rangeStd) : null
  const similar = D.cars.filter((x) => x.slug !== slug && x.category === c.category).sort((a, b) => Math.abs((a.priceMin ?? 0) - (c.priceMin ?? 0)) - Math.abs((b.priceMin ?? 0) - (c.priceMin ?? 0))).slice(0, 6)
  const kv = [
    ['Body', c.body], ['Drive', c.drive], ['Torque', c.torque && `${c.torque} Nm`], ['Length', c.length && `${n0(c.length)} mm`],
    ['Width', c.width && `${n0(c.width)} mm`], ['Height', c.height && `${n0(c.height)} mm`], ['Wheelbase', c.wheelbase && `${n0(c.wheelbase)} mm`],
    ['Ground clearance', c.clearance && `${c.clearance} mm`], ['Boot', c.boot && `${c.boot} L`], ['Kerb weight', c.weight && `${n0(c.weight)} kg`], ['Model year', c.year],
  ].filter(([, v]) => v)
  return {
    sb: 'dark',
    html: `<div class="scroll">
      <div class="car-hero" style="padding-top:calc(var(--top) + 56px);background:radial-gradient(120% 80% at 50% 30%, var(--stage-1), var(--stage-2))">
        <div class="stage-img" style="background:none">${`<img src="${img(c.image)}" alt="${esc(c.name)}">`}</div>
      </div>
      <div class="detail-body">
        <div class="row between"><span class="eyebrow" style="color:var(--faint)">${esc(c.brand)}</span><span class="badge md b-teal">${KIND[c.category]}</span></div>
        <h1 class="detail-title mt-4">${esc(c.model)}</h1>
        ${c.variant ? `<p class="t13 mono muted">${esc(c.variant)}${c.year ? ` · ${c.year}` : ''}</p>` : ''}
        <div class="mt-12"><div class="t24 b7">${esc(c.price)}</div><div class="t12 mono faint" style="letter-spacing:.08em">INDICATIVE PRICE · CONFIRM WITH THE DEALER</div></div>
        <div class="tiles mt-20">${tiles.map(([k, v, u, s]) => `<div class="tile"><div class="k">${k}</div><div class="v">${v ?? '—'}${v != null && u ? `<small>${u}</small>` : ''}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`).join('')}</div>

        ${isPlugIn(c) ? `<section class="section"><h2 class="t20">Charging</h2>
          <div class="card p16 mt-12 stack gap-12">
            <div class="row wrap" style="gap:6px">${conns.length ? conns.map(connBadge).join('') : '<span class="t13 muted">Plug type not published</span>'}</div>
            <div class="row" style="gap:12px">
              <div class="grow"><div class="t12 faint b6" style="letter-spacing:.08em">DC PEAK</div><div class="mono b7 t20">${c.dc ?? '—'}<span class="t12 muted" style="font-weight:400">${c.dc ? ' kW' : ''}</span></div></div>
              <div class="grow"><div class="t12 faint b6" style="letter-spacing:.08em">AC MAX</div><div class="mono b7 t20">${c.ac ?? '—'}<span class="t12 muted" style="font-weight:400">${c.ac ? ' kW' : ''}</span></div></div>
            </div>
            ${dcEst?.ok ? `<div class="row t14" style="gap:10px">${ic('bolt', 18)}<span class="grow">10→80% at a ${c.dc} kW charger</span><b class="mono">~${fmtDur(dcEst.minutes)}</b></div>` : ''}
            ${acEst?.ok ? `<div class="row t14" style="gap:10px">${ic('plug', 18)}<span class="grow">10→100% on a 7.4 kW wall box</span><b class="mono">~${fmtDur(acEst.minutes)}</b></div>` : ''}
            <button class="btn btn-secondary btn-block" data-a="calcFor" data-v="${slug}">${ic('timer', 18)}Work out a charge</button>
          </div></section>` : ''}

        ${road ? `<section class="section"><h2 class="t20">On Pakistani roads</h2><p class="t13 muted mt-4">From the ${r} km ${c.rangeStd} figure</p>
          <div class="list mt-12">${road.map((x) => `<div class="list-row"><span class="ico">${ic(x.sc.icon, 18)}</span><span class="grow"><b class="t14">${x.sc.title}</b><br><span class="t12 muted mono">${x.lo}–${x.hi} km</span></span><b class="mono t17">~${x.t}<span class="t12 muted" style="font-weight:400"> km</span></b></div>`).join('')}</div>
          <button class="link mt-4" data-a="rangeFor" data-v="${slug}">Convert between test standards ${ic('arrowR', 14)}</button></section>` : ''}

        <section class="section"><h2 class="t20">Specifications</h2><div class="kv mt-8">${kv.map(([k, v]) => `<div>${k}</div><div>${esc(v)}</div>`).join('')}</div></section>
        <section class="section"><h2 class="t20">Buying in Pakistan</h2>
          <div class="stack gap-12 mt-12">
            ${c.availability ? `<div class="row t14" style="gap:12px;align-items:flex-start"><span class="accent-text">${ic('building', 18)}</span><span>${esc(c.availability)}</span></div>` : ''}
            ${c.distributor ? `<div class="row t14" style="gap:12px;align-items:flex-start"><span class="accent-text">${ic('handshake', 18)}</span><span>${esc(c.distributor)}</span></div>` : ''}
            ${c.warranty ? `<div class="row t14" style="gap:12px;align-items:flex-start"><span class="accent-text">${ic('shield', 18)}</span><span>${esc(c.warranty)}</span></div>` : ''}
          </div>
        </section>
        <section class="section" style="margin:32px -16px 0"><div class="sec-head"><h2>Similar cars</h2></div>
          <div class="hscroll">${similar.map((x) => `<button class="card press" style="width:180px;overflow:hidden;text-align:left" data-a="go" data-v="car" data-slug="${x.slug}">${carStage(x, '', 'aspect-ratio:4/3')}<div style="padding:10px 12px"><div class="t12 faint b7" style="letter-spacing:.1em;text-transform:uppercase">${esc(x.brand)}</div><b class="t14 trunc" style="display:block">${esc(x.model)}</b><div class="t13 b6 mt-4">${esc(x.price)}</div></div></button>`).join('')}</div>
        </section>
        <div style="height:16px"></div>
      </div>
    </div>
    <div class="float-bar">
      <button class="glass-btn" data-a="back" aria-label="Back">${ic('arrowL', 22)}</button>
      <div class="row" style="gap:8px">
        <button class="glass-btn" data-a="shareCar" data-v="${slug}" aria-label="Share">${ic('share', 20)}</button>
        <button class="glass-btn ${fav ? 'on' : ''}" data-a="fav" data-v="${slug}" aria-label="${fav ? 'Remove favourite' : 'Add favourite'}">${ic('heart', 20, { fill: fav })}</button>
      </div>
    </div>
    <div class="bottom-bar">
      <button class="btn ${cmp ? 'btn-primary' : 'btn-secondary'}" data-a="compare" data-v="${slug}">${ic('compare', 18)}${cmp ? 'In compare' : 'Compare'}</button>
      ${primary ? `<button class="btn btn-secondary grow" disabled>${ic('check', 18)}Your car</button>` : `<button class="btn btn-primary grow" data-a="setMyCar" data-v="${slug}">${ic('car', 18)}${inGarage ? 'Make it my main car' : 'This is my car'}</button>`}
    </div>`,
  }
}
Object.assign(A, {
  setMyCar: (slug) => {
    if (!S.garage.includes(slug)) S.garage.push(slug)
    S.primary = slug
    U.route.slug = null; U.calc.slug = null
    save(); render(); toast(`${carBySlug(slug).name} is now your car`, 'car')
  },
  calcFor: (slug) => { U.calc.slug = slug; const c = carBySlug(slug); U.calc.mode = c.dc ? 'dc' : 'ac'; U.calc.kw = c.dc ? 60 : 7.4; go('calculator') },
  rangeFor: (slug) => { const c = carBySlug(slug); U.rng = { km: String(carRange(c)), std: c.rangeStd }; go('range') },
  shareCar: (slug) => { const c = carBySlug(slug); copyText(`${c.name} — ${c.price}. https://plug.pk/cars/${c.slug}`, 'Link copied') },
})

// ─── Compare ───────────────────────────────────────────────────────
/** "PKR 6.79 Cr (promo, outgoing eDrive50)" → ["PKR 6.79 Cr", "promo, outgoing eDrive50"], so the figure reads first. */
const splitPrice = (p) => {
  const m = /^(.*?)\s*\((.*)\)\s*$/.exec(p || '')
  return m ? [m[1], m[2]] : [p || '—', '']
}
const kwHp = (kw) => Math.round(kw * 1.341)

/**
 * Spec rows, grouped the way a buyer thinks: what it costs, how far it goes,
 * how it charges, how it drives, what fits. `get` gives the number that is
 * compared, `better` which way wins, `fmt` the value and unit as shown.
 */
const CMP_GROUPS = [
  ['Price & type', 'wallet', [
    { label: 'Price', small: true, get: (c) => c.priceMin, better: 'min', fmt: (c) => { const [p, n] = splitPrice(c.price); return [p, '', n] } },
    { label: 'Powertrain', fmt: (c) => [KIND[c.category] || '—'] },
    { label: 'Body', fmt: (c) => [c.body ? c.body.replace(/\s*\(.*\)$/, '') : '—'] },
    { label: 'Drive', fmt: (c) => [c.drive || '—'] },
  ]],
  ['Range & battery', 'batteryBolt', [
    { label: 'Range', hint: 'Higher is better', get: (c) => carRange(c), better: 'max', bar: true, fmt: (c) => [carRange(c), 'km', c.rangeStd ? `${c.rangeStd} rated` : ''] },
    { label: 'Battery', hint: 'Usable capacity', get: (c) => c.battery, better: 'max', bar: true, fmt: (c) => [c.battery, 'kWh'] },
  ]],
  ['Charging', 'bolt', [
    { label: 'Fast charging (DC)', hint: 'Peak power', get: (c) => c.dc, better: 'max', bar: true, fmt: (c) => [c.dc, 'kW'] },
    { label: '10–80% on a fast charger', hint: 'Lower is better', get: (c) => c.dcMin, better: 'min', fmt: (c) => [c.dcMin, 'min'] },
    { label: 'Home charging (AC)', get: (c) => c.ac, better: 'max', fmt: (c) => [c.ac, 'kW'] },
    { label: 'Full charge at home', hint: 'Lower is better', get: (c) => c.acHours, better: 'min', fmt: (c) => [c.acHours, 'h'] },
    { label: 'Plugs', fmt: (c) => [carConns(c).map((t) => CONN[t].label).join(' · ') || '—'] },
  ]],
  ['Performance', 'speedo', [
    { label: 'Power', get: (c) => c.power, better: 'max', bar: true, fmt: (c) => [c.power, 'kW', c.power ? `${kwHp(c.power)} hp` : ''] },
    { label: 'Torque', get: (c) => c.torque, better: 'max', fmt: (c) => [c.torque, 'Nm'] },
    { label: '0–100 km/h', hint: 'Lower is better', get: (c) => c.accel, better: 'min', fmt: (c) => [c.accel, 's'] },
    { label: 'Top speed', get: (c) => c.topSpeed, better: 'max', fmt: (c) => [c.topSpeed, 'km/h'] },
  ]],
  ['Size & practicality', 'sedan', [
    { label: 'Seats', get: (c) => c.seats, fmt: (c) => [c.seats] },
    { label: 'Boot', get: (c) => c.boot, better: 'max', fmt: (c) => [c.boot, 'L'] },
    { label: 'Length', fmt: (c) => [c.length ? n0(c.length) : null, 'mm'] },
    { label: 'Weight', fmt: (c) => [c.weight ? n0(c.weight) : null, 'kg'] },
  ]],
]

/** The figure that wins a row, or null when fewer than two cars have one to compare. */
function cmpBest(cars, row) {
  if (!row.get || !row.better) return null
  const vals = cars.map(row.get).filter((v) => v != null)
  if (vals.length < 2 || new Set(vals).size < 2) return null
  return row.better === 'max' ? Math.max(...vals) : Math.min(...vals)
}

function cmpCell(c, row, best, max) {
  const [v, unit = '', note = ''] = row.fmt(c)
  if (v == null || v === '' || v === '—') return `<div class="cp-val none"><b>—</b><small>Not published</small></div>`
  const val = row.get ? row.get(c) : null
  const win = best != null && val === best
  const pct = row.bar && val != null && max ? Math.max(6, Math.round((val / max) * 100)) : null
  return `<div class="cp-val${win ? ' win' : ''}${row.get ? '' : ' text'}${row.small ? ' sm' : ''}">
      <b>${esc(String(v))}${unit ? `<small>${unit}</small>` : ''}</b>
      ${note ? `<span class="cp-note">${esc(note)}</span>` : ''}
      ${pct != null ? `<i class="cp-bar"><i style="width:${pct}%"></i></i>` : ''}
      ${win ? `<span class="cp-best">${ic('check', 11, { sw: 3 })}Best</span>` : ''}
    </div>`
}

function cmpSticky() {
  const sc = $('#screen .scroll'), bar = $('#cp-sticky'), cars = $('#cp-cars')
  if (!sc || !bar || !cars) return
  const f = () => bar.classList.toggle('show', cars.getBoundingClientRect().bottom < sc.getBoundingClientRect().top + 8)
  sc.addEventListener('scroll', f, { passive: true })
  f()
}

SCREENS.compare = () => {
  const cars = S.compare.map(carBySlug).filter(Boolean)
  const cols = `grid-template-columns:repeat(${Math.max(cars.length, 2)},minmax(0,1fr))`
  const head = (c) => {
    const [p] = splitPrice(c.price)
    return `<div class="cp-car">
        <div class="cp-photo">${carStage(c, '', 'position:absolute;inset:0')}
          <button class="cp-x" data-a="compare" data-v="${c.slug}" aria-label="Remove ${esc(c.name)}">${ic('x', 14, { sw: 2.4 })}</button></div>
        <div class="cp-brand">${esc(c.brand)}</div>
        <button class="cp-model" data-a="go" data-v="car" data-slug="${c.slug}">${esc(c.model)}</button>
        <div class="cp-price">${esc(p)}</div>
      </div>`
  }
  const addSlot = `<button class="cp-add" data-a="sheet" data-v="carPicker" data-target="compare">
      <span class="cp-add-ico">${ic('plus', 22)}</span><b>Add a car</b><small>Up to 3</small></button>`

  // Who wins the rows people ask about first.
  const glance = [
    ['Lowest price', 'wallet', (c) => c.priceMin, 'min', (c) => splitPrice(c.price)[0]],
    ['Longest range', 'route', (c) => carRange(c), 'max', (c) => `${carRange(c)} km`],
    ['Fastest charging', 'bolt', (c) => c.dc, 'max', (c) => `${c.dc} kW DC`],
    ['Quickest 0–100', 'speedo', (c) => c.accel, 'min', (c) => `${c.accel} s`],
  ].map(([t, icon, get, better, show]) => {
    const b = cmpBest(cars, { get, better })
    const w = b == null ? null : cars.find((c) => get(c) === b)
    return w ? `<div class="cp-win"><span class="cp-win-ico">${ic(icon, 16)}</span><span class="grow" style="min-width:0"><span class="cp-win-t">${t}</span><b class="trunc">${esc(w.name)}</b></span><span class="cp-win-v mono">${esc(show(w))}</span></div>` : ''
  }).join('')

  return {
    sb: 'dark',
    html: `${topbar('Compare cars', S.compare.length ? `<button class="btn btn-sm btn-ghost" data-a="clearCompare">Clear</button>` : '')}
      <div class="scroll cp${cars.length === 3 ? ' cp-3' : ''}" style="padding-bottom:40px">
        <div class="pad">
          <div class="cp-cars" id="cp-cars" style="${cars.length >= 2 ? cols : 'grid-template-columns:repeat(2,minmax(0,1fr))'}">${cars.map(head).join('')}${cars.length < 2 ? addSlot : ''}${!cars.length ? addSlot : ''}</div>
          ${cars.length === 2 ? `<button class="cp-add-row" data-a="sheet" data-v="carPicker" data-target="compare">${ic('plus', 18)} Add a third car</button>` : ''}
        </div>
        ${cars.length < 2 ? `<div class="pad"><div class="empty mt-16">${cars.length ? `<b>${esc(cars[0].name)}</b> is ready. Add one more car to compare them side by side.` : 'Pick two or three cars to see their price, range, charging and performance side by side.'}
            <button class="btn btn-sm btn-secondary" data-a="tab" data-v="cars">Browse all cars</button></div></div>` : `
        <div class="cp-sticky" id="cp-sticky" style="${cols}" aria-hidden="true">${cars.map((c) => `<div class="cp-sticky-car">${carStage(c, '', 'width:34px;height:26px;border-radius:7px;flex:none')}<b class="trunc">${esc(c.model)}</b></div>`).join('')}</div>
        ${glance ? `<section class="pad mt-20"><h2 class="cp-h">${ic('trophy', 18)} At a glance</h2><div class="cp-wins">${glance}</div></section>` : ''}
        ${CMP_GROUPS.map(([title, icon, rows]) => `<section class="pad mt-24">
            <h2 class="cp-h">${ic(icon, 18)} ${title}</h2>
            <div class="card cp-group">${rows.map((row) => {
              const best = cmpBest(cars, row)
              const max = row.bar ? Math.max(...cars.map(row.get).filter((v) => v != null), 0) : 0
              return `<div class="cp-row">
                  <div class="cp-label">${row.label}${row.hint ? `<span>${row.hint}</span>` : ''}</div>
                  <div class="cp-vals" style="${cols}">${cars.map((c) => cmpCell(c, row, best, max)).join('')}</div>
                </div>`
            }).join('')}</div>
          </section>`).join('')}
        <p class="pad t12 faint mt-16" style="line-height:1.5">${ic('check', 12, { sw: 3 })} marks the best figure where cars differ. Prices are indicative; confirm with the dealer or importer.</p>`}
      </div>`,
    after: cmpSticky,
  }
}
