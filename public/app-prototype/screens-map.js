// plug.pk app prototype — the charger map, station detail, reviews and reports.
'use strict'

// ─── Map geometry ──────────────────────────────────────────────────
// A stylised city map drawn in SVG. World is 1400×1400 px, 70 px per km,
// centred on the city's "you are here" point.
const WORLD = 1400, PXKM = 70
function project(city, lat, lng) {
  const [la, lo] = CITY[city].me
  const dx = (lng - lo) * 111.32 * Math.cos((la * Math.PI) / 180)
  const dy = (lat - la) * 110.57
  return [WORLD / 2 + dx * PXKM, WORLD / 2 - dy * PXKM]
}
function rng(seed) {
  let s = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

const CITY_ART = {
  Lahore: {
    rot: 8,
    water: ['M0 300 C 120 250, 220 150, 300 110 S 460 30, 520 0 L 0 0 Z'],
    canal: 'M 330 1400 C 420 1120, 520 900, 700 760 S 980 420, 1180 0',
    parks: [[560, 520, 120, 80, 'Racecourse Park'], [580, 390, 90, 70, 'Bagh-e-Jinnah'], [880, 1010, 140, 90, 'Model Town Park'], [1010, 690, 80, 60, '']],
    roads: [
      ['M 300 300 C 450 360, 600 400, 960 520', 'The Mall'],
      ['M 600 1400 C 610 1100, 640 900, 650 700 S 660 520, 640 300', 'Ferozepur Road'],
      ['M 380 940 C 560 820, 760 700, 1060 560', 'Main Boulevard Gulberg'],
      ['M 500 640 C 620 600, 760 590, 920 620', 'Jail Road'],
      ['M 0 760 C 300 740, 600 760, 1400 820', 'Raiwind Road'],
    ],
    areas: [[700, 740, 'GULBERG'], [470, 300, 'ANARKALI'], [900, 1080, 'MODEL TOWN'], [1100, 420, 'CANTT'], [260, 600, 'SAMANABAD'], [1150, 760, 'DHA']],
    tag: [[160, 120, 'Ravi River']],
  },
  Islamabad: {
    rot: -28,
    hills: 'M0 0 H1400 V180 C 1200 230, 1040 300, 860 280 S 520 340, 360 380 S 120 420, 0 440 Z',
    water: ['M 1180 520 C 1260 470, 1360 500, 1400 540 L 1400 760 C 1330 740, 1240 700, 1190 640 Z'],
    parks: [[470, 820, 170, 110, 'Fatima Jinnah Park'], [880, 520, 90, 70, 'Shakarparian'], [640, 600, 60, 50, '']],
    roads: [
      ['M 120 1180 C 420 1000, 760 800, 1300 470', 'Jinnah Avenue'],
      ['M 200 1400 C 520 1220, 880 1020, 1400 760', 'Kashmir Highway'],
      ['M 0 470 C 300 420, 700 330, 1400 200', 'Margalla Road'],
      ['M 420 380 C 520 640, 620 900, 760 1400', 'Faisal Avenue'],
      ['M 760 330 C 840 560, 920 760, 1020 1060', '9th Avenue'],
    ],
    areas: [[700, 720, 'F-7'], [420, 900, 'F-10'], [760, 820, 'BLUE AREA'], [560, 560, 'E-7'], [960, 1000, 'G-7'], [300, 1060, 'F-11'], [1040, 640, 'MELODY']],
    tag: [[620, 170, 'Margalla Hills National Park'], [1260, 620, 'Rawal Lake']],
  },
  Karachi: {
    rot: 22,
    water: ['M 0 1020 C 220 1060, 420 1180, 600 1190 S 960 1250, 1400 1240 L 1400 1400 L 0 1400 Z', 'M 0 760 C 80 800, 120 900, 0 960 Z'],
    parks: [[470, 1040, 110, 70, 'Bagh Ibn-e-Qasim'], [880, 600, 90, 60, 'Hill Park'], [300, 640, 70, 50, '']],
    roads: [
      ['M 200 760 C 520 700, 820 560, 1400 300', 'Shahrah-e-Faisal'],
      ['M 520 1400 C 560 1180, 600 1000, 660 700 S 720 400, 700 0', 'Clifton Road'],
      ['M 380 1150 C 620 1170, 900 1200, 1400 1200', 'Sea View'],
      ['M 600 960 C 760 960, 900 980, 1300 1080', 'Khayaban-e-Ittehad'],
      ['M 0 600 C 300 640, 500 690, 660 700', 'M.A. Jinnah Road'],
    ],
    areas: [[640, 900, 'CLIFTON'], [820, 1020, 'DHA'], [760, 640, 'PECHS'], [420, 640, 'SADDAR'], [1060, 420, 'GULSHAN'], [960, 820, 'KORANGI ROAD']],
    tag: [[700, 1320, 'Arabian Sea']],
  },
}

function mapSvg(city) {
  const art = CITY_ART[city]
  const r = rng(city)
  let streets = ''
  for (let i = -6; i < 34; i++) {
    const p = i * 52 + r() * 14
    streets += `M ${p} -300 L ${p + (r() - 0.5) * 30} 1700 M -300 ${p} L 1700 ${p + (r() - 0.5) * 30} `
  }
  const lanes = []
  for (let i = 0; i < 70; i++) {
    const x = r() * WORLD, y = r() * WORLD, len = 30 + r() * 60
    lanes.push(`M ${x} ${y} l ${len} ${(r() - 0.5) * 12}`)
  }
  const roadPaths = art.roads.map(([d], i) => `<path id="rd-${city}-${i}" d="${d}"/>`).join('')
  return `<svg width="${WORLD}" height="${WORLD}" viewBox="0 0 ${WORLD} ${WORLD}" aria-hidden="true">
    <defs>${roadPaths}</defs>
    <rect width="${WORLD}" height="${WORLD}" style="fill:var(--map-block)"/>
    <g transform="rotate(${art.rot} 700 700)">
      <path d="${streets}" style="stroke:var(--map-street)" stroke-width="7" fill="none"/>
      <path d="${lanes.join(' ')}" style="stroke:var(--map-street)" stroke-width="4" fill="none" stroke-linecap="round"/>
    </g>
    ${art.hills ? `<path d="${art.hills}" style="fill:var(--map-park)"/><path d="${art.hills}" fill="none" style="stroke:var(--map-land)" stroke-width="2" stroke-dasharray="2 10" transform="translate(0 -40)"/>` : ''}
    ${(art.water || []).map((d) => `<path d="${d}" style="fill:var(--map-water)"/>`).join('')}
    ${art.canal ? `<path d="${art.canal}" style="stroke:var(--map-water)" stroke-width="16" fill="none"/>` : ''}
    ${art.parks.map(([x, y, w, h]) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="18" style="fill:var(--map-park)" transform="rotate(${art.rot} ${x} ${y})"/>`).join('')}
    ${art.roads.map(([d]) => `<path d="${d}" style="stroke:var(--map-road-edge)" stroke-width="20" fill="none" stroke-linecap="round"/>`).join('')}
    ${art.roads.map(([d]) => `<path d="${d}" style="stroke:var(--map-road)" stroke-width="15" fill="none" stroke-linecap="round"/>`).join('')}
    <g font-family="Figtree, system-ui, sans-serif" style="fill:var(--map-label)">
      ${art.roads.map(([, name], i) => `<text font-size="13" font-weight="600" dy="4.5"><textPath href="#rd-${city}-${i}" startOffset="${30 + (i % 3) * 12}%">${name}</textPath></text>`).join('')}
      ${art.areas.map(([x, y, t]) => `<text x="${x}" y="${y}" font-size="15" font-weight="700" letter-spacing="3" text-anchor="middle" opacity=".75">${t}</text>`).join('')}
      ${art.parks.filter((p) => p[4]).map(([x, y, , , t]) => `<text x="${x}" y="${y + 4}" font-size="12" font-weight="600" text-anchor="middle" style="fill:var(--ok-fg)" opacity=".8">${t}</text>`).join('')}
      ${(art.tag || []).map(([x, y, t]) => `<text x="${x}" y="${y}" font-size="16" font-style="italic" font-weight="600" text-anchor="middle" opacity=".8">${t}</text>`).join('')}
    </g>
  </svg>`
}

// ─── Filtering ─────────────────────────────────────────────────────
const SPEEDS = [[0, 'Any speed', ''], [7, 'Fast and up', '7 kW +'], [50, 'Rapid and up', '50 kW +'], [150, 'Ultra rapid', '150 kW +']]
function filterCount() {
  const m = U.map
  return m.conn.length + (m.speed ? 1 : 0) + m.amen.length
}
function stationMatches(s) {
  const m = U.map
  if (m.conn.length && !s.connectors.some((c) => m.conn.includes(c.type))) return false
  if (m.speed && stMax(s) < m.speed) return false
  if (m.amen.length && !m.amen.every((a) => s.amenities.some((x) => x.type === a && x.available))) return false
  return true
}
const cityStations = () => D.stations.filter((s) => s.city === S.city).sort((a, b) => stDist(a) - stDist(b))

// ─── Map screen ────────────────────────────────────────────────────
function mapCard(s) {
  const r = stRating(s)
  const sel = U.map.sel === s.id
  return `<div class="map-card ${sel ? 'sel' : ''}" data-id="${s.id}">
    <img src="${img(s.photos[0])}" alt="">
    <div class="grow stack" style="gap:2px">
      <div class="row between"><b class="t15 trunc">${esc(s.name)}</b>${r ? `<span class="rating">${ic('star', 13, { fill: true, sw: 1 })}${r.toFixed(1)}</span>` : ''}</div>
      <div class="t13 muted trunc">${ic('pin', 13).replace('class="i"', 'class="i" style="display:inline;vertical-align:-2px"')} ${esc(s.area)} · <span class="mono">${fmtDist(stDist(s))}</span></div>
      <div class="row wrap mt-4" style="gap:4px">${connBadges(stTypes(s), 2)}${speedBadge(stMax(s))}</div>
      <div class="row mt-8" style="gap:6px">
        <button class="btn btn-sm btn-secondary grow" data-a="go" data-v="station" data-id="${s.id}">Details</button>
        <a class="btn btn-sm btn-nav grow" href="${navUrl(s)}" target="_blank" rel="noopener">Navigate ${ic('nav', 15)}</a>
      </div>
    </div>
  </div>`
}
const navUrl = (s) => `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`

function stationRow(s) {
  const r = stRating(s)
  return `<div class="card press" data-a="go" data-v="station" data-id="${s.id}">
    <div class="st-row">
      <img class="thumb" src="${img(s.photos[0])}" alt="">
      <div class="grow stack" style="gap:2px">
        <div class="row between"><b class="t15 trunc">${esc(s.name)}</b>${r ? `<span class="rating">${ic('star', 13, { fill: true, sw: 1 })}${r.toFixed(1)}</span>` : ''}</div>
        <div class="row between t13"><span class="muted trunc">${esc(s.area)}, ${esc(s.city)}</span><span class="mono faint t12">${fmtDist(stDist(s))}</span></div>
        <div class="row wrap mt-4" style="gap:4px">${exampleBadge()}<span class="mono t12 muted">${stPorts(s)} ports installed</span></div>
        <div class="row wrap mt-4" style="gap:4px">${connBadges(stTypes(s))}${speedBadge(stMax(s))}</div>
      </div>
    </div>
  </div>`
}

SCREENS.map = () => {
  const m = U.map
  const all = cityStations()
  const list = all.filter(stationMatches)
  if (m.sel && !list.some((s) => s.id === m.sel)) m.sel = null
  const fc = filterCount()
  const chips = `<div class="chips" style="padding:0 0 2px;margin:0 -16px;padding-left:16px;padding-right:16px">
      <button class="chip ${fc ? 'on' : ''}" data-a="sheet" data-v="filters">${ic('sliders', 16)}Filters${fc ? ` <span class="cnt">${fc}</span>` : ''}</button>
      ${CITIES_WITH_STATIONS.map((c) => `<button class="chip ${S.city === c ? 'solid on' : ''}" data-a="city" data-v="${c}">${c}</button>`).join('')}
    </div>`
  if (m.view === 'list') {
    return {
      sb: 'dark', tabs: true,
      html: `<div class="topbar" style="flex-direction:column;align-items:stretch;gap:10px;padding-left:16px;padding-right:16px">
          <div class="row between"><h1 style="text-align:left;margin:0;font-size:24px">Chargers in ${S.city}</h1><button class="btn btn-sm btn-secondary" data-a="mapView" data-v="map">${ic('map', 16)}Map</button></div>
          ${chips}
        </div>
        <div class="scroll pad stack gap-12" style="padding-top:4px">
          <p class="t13 muted">${list.length} of ${all.length} station${all.length === 1 ? '' : 's'} · nearest to ${CITY[S.city].spot} first</p>
          ${list.map(stationRow).join('') || `<div class="empty">No station in ${S.city} matches these filters. <button class="btn btn-sm btn-secondary" data-a="clearFilters">Clear filters</button></div>`}
        </div>`,
    }
  }
  const me = project(S.city, ...CITY[S.city].me)
  return {
    sb: 'dark', tabs: true,
    html: `<div class="map-wrap" id="map-wrap">
        <div class="map-world" id="map-world">
          ${mapSvg(S.city)}
          <div data-part="pins">${all.map((s) => {
            const [x, y] = project(s.city, s.lat, s.lng)
            const kw = stMax(s)
            const on = list.includes(s)
            return `<button class="pin tier-${tier(kw)} ${m.sel === s.id ? 'sel' : ''} ${on ? '' : 'dim'}" style="left:${x}px;top:${y}px" data-a="pinSel" data-v="${s.id}" aria-label="${esc(s.name)}, ${kw} kW">
              <span class="bubble"><span class="bolt">${ic('bolt', 13, { fill: true, sw: 1 })}</span>${fmtKw(kw)} kW</span><span class="tip"></span></button>`
          }).join('')}</div>
          <span class="me" style="left:${me[0]}px;top:${me[1]}px" title="You (approximate)"></span>
        </div>
      </div>
      <div class="map-top">
        <button class="searchbar" data-a="go" data-v="search" style="height:50px">${ic('search', 20)}<span class="grow">Search a station or area</span></button>
        ${chips}
        <div class="legend">${['ultra', 'rapid', 'fast'].map((t) => `<span><i class="speed-dot" style="background:${TIER[t].dot}"></i>${TIER[t].label}</span>`).join('')}</div>
      </div>
      <div class="map-ctrl" style="top:calc(var(--top) + 196px)">
        <button class="glass-btn" data-a="mapView" data-v="list" aria-label="Show as list">${ic('rows', 20)}</button>
        <button class="glass-btn" data-a="zoom" data-v="1.4" aria-label="Zoom in">${ic('plus', 20)}</button>
        <button class="glass-btn" data-a="zoom" data-v="0.7" aria-label="Zoom out">${ic('minus', 20)}</button>
        <button class="glass-btn" data-a="locate" aria-label="Centre on me">${ic('locate', 20)}</button>
        <button class="glass-btn" data-a="flipTheme" aria-label="Switch to ${isDark() ? 'light' : 'dark'} mode">${ic(isDark() ? 'sun' : 'moon', 20)}</button>
      </div>
      <div class="map-carousel"><div class="hscroll" id="map-cards" data-part="cards">${list.map(mapCard).join('') || `<div class="map-card" style="width:calc(100% - 0px)"><div class="grow t14 muted">No station here matches your filters. <button class="link" data-a="clearFilters">Clear filters</button></div></div>`}</div></div>`,
    after: mapAfter,
    afterPart: () => applyMapTransform(),
  }
}

function applyMapTransform(animate) {
  const w = $('#map-world')
  if (!w) return
  const m = U.map
  w.style.transition = animate ? 'transform .45s cubic-bezier(.2,.8,.2,1)' : ''
  w.style.transform = `translate(${m.x}px, ${m.y}px) scale(${m.z})`
  w.style.setProperty('--inv', (1 / m.z).toFixed(3))
}
function mapViewport() {
  const el = $('#map-wrap')
  return el ? [el.clientWidth, el.clientHeight] : [393, 800]
}
/** Centre a world point in the visible part of the map (between the top controls and the cards). */
function centreOn([x, y], z = U.map.z, animate = true) {
  const [w, h] = mapViewport()
  const visTop = 200, visBottom = h - 260
  U.map.z = clamp(z, 0.35, 2.6)
  U.map.x = w / 2 - x * U.map.z
  U.map.y = (visTop + visBottom) / 2 - y * U.map.z
  applyMapTransform(animate)
}
function fitCity() {
  const pts = [project(S.city, ...CITY[S.city].me), ...cityStations().map((s) => project(s.city, s.lat, s.lng))]
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const [w, h] = mapViewport()
  const bw = Math.max(...xs) - Math.min(...xs) + 200, bh = Math.max(...ys) - Math.min(...ys) + 200
  const z = Math.min(w / bw, (h - 460) / bh, 1.3)
  centreOn([(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2], z, false)
  U.map.fitted = S.city
}

function mapAfter() {
  if (U.map.fitted !== S.city) fitCity()
  else applyMapTransform()
  const wrap = $('#map-wrap')
  const ptrs = new Map()
  let start = null, pinch = null
  wrap.addEventListener('pointerdown', (e) => {
    ptrs.set(e.pointerId, [e.clientX, e.clientY])
    if (ptrs.size === 1) start = { x: e.clientX, y: e.clientY, mx: U.map.x, my: U.map.y, moved: false }
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()]
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: U.map.z, mx: U.map.x, my: U.map.y, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 }
    }
  })
  wrap.addEventListener('pointermove', (e) => {
    if (!ptrs.has(e.pointerId)) return
    ptrs.set(e.pointerId, [e.clientX, e.clientY])
    const r = wrap.getBoundingClientRect()
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()]
      const z = clamp((pinch.z * Math.hypot(a[0] - b[0], a[1] - b[1])) / pinch.d, 0.35, 2.6)
      const cx = pinch.cx - r.left, cy = pinch.cy - r.top
      U.map.x = cx - ((cx - pinch.mx) * z) / pinch.z
      U.map.y = cy - ((cy - pinch.my) * z) / pinch.z
      U.map.z = z
      start && (start.moved = true)
      return applyMapTransform()
    }
    if (!start) return
    const dx = e.clientX - start.x, dy = e.clientY - start.y
    if (!start.moved && Math.hypot(dx, dy) < 6) return
    if (!start.moved) { start.moved = true; wrap.classList.add('dragging'); try { wrap.setPointerCapture(e.pointerId) } catch { /* fine */ } }
    U.map.x = start.mx + dx
    U.map.y = start.my + dy
    applyMapTransform()
  })
  const end = (e) => {
    ptrs.delete(e.pointerId)
    if (ptrs.size < 2) pinch = null
    if (!ptrs.size) {
      wrap.classList.remove('dragging')
      U.map.dragged = start?.moved
      setTimeout(() => (U.map.dragged = false), 50)
      start = null
    }
  }
  wrap.addEventListener('pointerup', end)
  wrap.addEventListener('pointercancel', end)
  wrap.addEventListener('wheel', (e) => {
    e.preventDefault()
    const r = wrap.getBoundingClientRect()
    const z = clamp(U.map.z * (e.deltaY < 0 ? 1.12 : 0.89), 0.35, 2.6)
    const cx = e.clientX - r.left, cy = e.clientY - r.top
    U.map.x = cx - ((cx - U.map.x) * z) / U.map.z
    U.map.y = cy - ((cy - U.map.y) * z) / U.map.z
    U.map.z = z
    applyMapTransform()
  }, { passive: false })

  // Swiping the cards selects the station in view.
  const cards = $('#map-cards')
  if (cards) {
    let t
    cards.addEventListener('scroll', () => {
      clearTimeout(t)
      t = setTimeout(() => {
        if (U.map.scrollingTo) return
        const mid = cards.scrollLeft + 16
        const el = [...cards.children].reduce((best, c) => (Math.abs(c.offsetLeft - mid) < Math.abs((best?.offsetLeft ?? 1e9) - mid) ? c : best), null)
        const id = el?.dataset.id
        if (id && id !== U.map.sel) selectStation(id, false)
      }, 120)
    })
    if (U.map.sel) scrollToCard(U.map.sel, false)
  }
}
function scrollToCard(id, smooth = true) {
  const cards = $('#map-cards')
  const el = cards && [...cards.children].find((c) => c.dataset.id === id)
  if (!el) return
  U.map.scrollingTo = true
  cards.scrollTo({ left: el.offsetLeft - 16, behavior: smooth ? 'smooth' : 'auto' })
  setTimeout(() => (U.map.scrollingTo = false), 500)
}
function selectStation(id, scroll = true) {
  U.map.sel = id
  const s = stById(id)
  renderPart('pins')
  document.querySelectorAll('#map-cards .map-card').forEach((c) => c.classList.toggle('sel', c.dataset.id === id))
  centreOn(project(s.city, s.lat, s.lng), Math.max(U.map.z, 0.8))
  if (scroll) scrollToCard(id)
}

Object.assign(A, {
  pinSel: (id) => { if (!U.map.dragged) selectStation(id) },
  zoom: (v) => {
    const [w, h] = mapViewport()
    const c = [(w / 2 - U.map.x) / U.map.z, (h / 2 - U.map.y) / U.map.z]
    const z = clamp(U.map.z * +v, 0.35, 2.6)
    U.map.x = w / 2 - c[0] * z
    U.map.y = h / 2 - c[1] * z
    U.map.z = z
    applyMapTransform(true)
  },
  locate: () => { centreOn(project(S.city, ...CITY[S.city].me), 1); toast(`Showing ${CITY[S.city].spot} — the prototype has no GPS`, 'locate') },
  mapView: (v) => { U.map.view = v; if (v === 'map') U.map.fitted = null; render() },
  clearFilters: () => { Object.assign(U.map, { conn: [], speed: 0, amen: [] }); closeSheet(); render() },
  fConn: (v) => { U.map.conn = U.map.conn.includes(v) ? U.map.conn.filter((x) => x !== v) : [...U.map.conn, v]; renderSheet() },
  fSpeed: (v) => { U.map.speed = +v; renderSheet() },
  fAmen: (v) => { U.map.amen = U.map.amen.includes(v) ? U.map.amen.filter((x) => x !== v) : [...U.map.amen, v]; renderSheet() },
  applyFilters: () => { closeSheet(); render() },
})

SHEETS.filters = () => {
  const m = U.map
  const n = cityStations().filter(stationMatches).length
  return {
    title: 'Filter chargers',
    body: `<p class="label" style="margin-top:4px">Plug type</p>
      <div class="row wrap">${Object.keys(CONN).map((t) => `<button class="chip ${m.conn.includes(t) ? 'on' : ''}" data-a="fConn" data-v="${t}">${m.conn.includes(t) ? ic('check', 14, { sw: 2.4 }) : ''}${CONN[t].label}<span class="t12 faint">${CONN[t].dc ? 'DC' : 'AC'}</span></button>`).join('')}</div>
      ${myCar() && carConns(myCar()).length ? `<button class="link" data-a="fMine">${ic('car', 16)}Only plugs my ${esc(myCar().model)} takes</button>` : ''}
      <p class="label mt-20">Charging speed</p>
      <div class="list">${SPEEDS.map(([kw, l, r]) => `<button class="list-row" style="min-height:48px" data-a="fSpeed" data-v="${kw}"><span style="width:20px;height:20px;border-radius:50%;border:2px solid ${m.speed === kw ? 'var(--fg)' : 'var(--line-strong)'};display:grid;place-items:center">${m.speed === kw ? '<i style="width:8px;height:8px;border-radius:50%;background:var(--fg)"></i>' : ''}</span><span class="grow t14">${l}</span><span class="t12 faint mono">${r}</span></button>`).join('')}</div>
      <p class="label mt-20">While you wait</p>
      <div class="amen">${Object.entries(AMEN).map(([k, [i, l]]) => `<button style="display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;border:1.5px solid ${m.amen.includes(k) ? '#6FDCC6' : 'var(--line)'};background:${m.amen.includes(k) ? 'var(--tint)' : 'var(--surface)'};font-size:14px;text-align:left" data-a="fAmen" data-v="${k}"><span class="accent-text">${ic(i, 18)}</span>${l}</button>`).join('')}</div>`,
    foot: `<button class="btn btn-ghost" data-a="clearFilters">Reset</button><button class="btn btn-primary grow" data-a="applyFilters">Show ${n} station${n === 1 ? '' : 's'}</button>`,
  }
}
A.fMine = () => { U.map.conn = carConns(myCar()).filter((t) => fits(myCar(), t)); renderSheet() }

// ─── Station detail ────────────────────────────────────────────────
SCREENS.station = ({ id }) => {
  const s = stById(id)
  const car = myCar()
  const reviews = stReviews(s)
  const r = stRating(s)
  const h = hoursNow(s.hours)
  const saved = S.saved.includes(s.id)
  const types = stTypes(s)
  const counts = [5, 4, 3, 2, 1].map((n) => reviews.filter((x) => x.rating === n).length)
  const related = D.stations.filter((x) => x.id !== s.id).sort((a, b) => (a.city === s.city ? -1 : 1) - (b.city === s.city ? -1 : 1)).slice(0, 4)
  return {
    sb: 'light',
    html: `<div class="scroll">
      <div class="gallery">
        <div class="track" id="gal">${s.photos.map((p) => `<img src="${img(p)}" alt="Example photo of ${esc(s.name)}">`).join('')}</div>
        <div class="shade"></div>
        <span class="photo-chip ex">Example photo</span>
        <div class="dots" id="gal-dots">${s.photos.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
      </div>
      <div class="detail-body">
        <div class="row wrap" style="gap:6px">${exampleBadge(true)}<span class="badge md ${h.open ? 'b-green' : 'b-slate'}">${ic('clock', 13)}${h.text}</span></div>
        <h1 class="detail-title mt-12">${esc(s.name)}</h1>
        <p class="t14 muted mt-4">${esc(s.street)}, ${esc(s.area)}, ${esc(s.city)}</p>
        <div class="row mt-8" style="gap:8px">${r ? `${stars(r, 16)}<b class="t14">${r.toFixed(1)}</b><span class="t13 faint">(${reviews.length} review${reviews.length === 1 ? '' : 's'})</span>` : '<span class="t13 muted">No reviews yet</span>'}<span class="grow"></span><span class="mono t13 muted">${fmtDist(stDist(s))}</span></div>

        <div class="tiles mt-20">
          <div class="tile"><div class="k">Max power</div><div class="v">${fmtKw(stMax(s))}<small>kW</small></div></div>
          <div class="tile"><div class="k">Ports</div><div class="v">${stPorts(s)}<small>installed</small></div></div>
          <div class="tile"><div class="k">Plugs</div><div class="v" style="font-size:15px;line-height:1.35;font-family:var(--font)">${types.map((t) => CONN[t].label).join(' · ')}</div></div>
        </div>

        <div class="row mt-16" style="gap:8px">
          <button class="btn btn-secondary grow" data-a="save" data-v="${s.id}">${ic('bookmark', 18, { fill: saved })}${saved ? 'Saved' : 'Save'}</button>
          <button class="btn btn-secondary grow" data-a="shareStation" data-v="${s.id}">${ic('share', 18)}Share</button>
          <button class="btn btn-secondary btn-icon" data-a="sheet" data-v="report" data-id="${s.id}" aria-label="Report a problem">${ic('flag', 18)}</button>
        </div>

        <div class="notice amber mt-16">${ic('info', 18)}<span><b>Example listing.</b> This station is sample data that shows how plug.pk lists a charger. Its photos, reviews and contact details aren’t real.</span></div>

        <section class="section">
          <h2 class="t20">Chargers</h2>
          ${car ? `<p class="t13 muted mt-4">Times are for your ${esc(car.name)}, 20→80%.</p>` : ''}
          <div class="stack gap-12 mt-12">${s.connectors.map((c, i) => chargerBlock(c, i, car)).join('')}</div>
          <p class="t12 faint mt-12">plug.pk doesn’t have live availability yet, so we show what’s installed, not what’s free.</p>
        </section>

        <section class="section">
          <h2 class="t20">While you wait</h2>
          <div class="amen mt-12">${s.amenities.map((a) => `<div class="${a.available ? '' : 'no'}" title="${esc(a.note || '')}">${ic(AMEN[a.type]?.[0] || 'info', 18)}${AMEN[a.type]?.[1] || a.type}</div>`).join('')}</div>
        </section>

        <section class="section">
          <h2 class="t20">About</h2>
          <p class="t15 muted mt-8">${esc(s.description)}</p>
          <div class="kv mt-12">
            <div>Network</div><div style="font-family:var(--font);font-size:14px">${esc(s.network)}</div>
            <div>Hours</div><div style="font-family:var(--font);font-size:14px">${s.hours?.is24Hours ? 'Every day, 24 hours' : esc(h.text)}</div>
            <div>Phone</div><div><button class="link" style="min-height:0" data-a="copy" data-v="${esc(s.phone)}">${esc(s.phone)} ${ic('copy', 14)}</button></div>
          </div>
        </section>

        <section class="section">
          <div class="row between"><h2 class="t20">Reviews</h2><button class="btn btn-sm btn-secondary" data-a="writeReview" data-v="${s.id}">${ic('pencil', 16)}Write a review</button></div>
          ${r ? `<div class="card p16 mt-12 row" style="gap:20px;align-items:center">
            <div style="text-align:center"><div style="font:700 44px/1 var(--font);letter-spacing:-0.03em">${r.toFixed(1)}</div><div class="mt-4">${stars(r, 13)}</div><div class="t12 faint mt-4">${reviews.length} reviews</div></div>
            <div class="bars grow">${counts.map((c, i) => `<div class="r"><span>★${5 - i}</span><span class="t"><i style="width:${reviews.length ? (c / reviews.length) * 100 : 0}%"></i></span><span class="mono" style="text-align:right">${c}</span></div>`).join('')}</div>
          </div>` : ''}
          <div class="mt-12">${reviews.map(reviewItem).join('') || '<div class="empty">No reviews yet. Charged here? Be the first to say how it went.</div>'}</div>
        </section>

        <section class="section" style="margin-left:-16px;margin-right:-16px">
          <div class="sec-head"><h2>More chargers</h2></div>
          <div class="hscroll">${related.map(stationMini).join('')}</div>
        </section>
        <div style="height:24px"></div>
      </div>
    </div>
    <div class="float-bar">
      <button class="glass-btn" data-a="back" aria-label="Back">${ic('arrowL', 22)}</button>
      <button class="glass-btn ${saved ? 'on' : ''}" data-a="save" data-v="${s.id}" aria-label="${saved ? 'Remove from saved' : 'Save station'}">${ic('bookmark', 20, { fill: saved })}</button>
    </div>
    <div class="bottom-bar">
      <a class="btn btn-secondary" href="https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}" target="_blank" rel="noopener">${ic('map', 18)}Open map</a>
      <a class="btn btn-nav grow" href="${navUrl(s)}" target="_blank" rel="noopener">Navigate ${ic('nav', 18)}</a>
    </div>`,
    after: galleryDots,
  }
}
function galleryDots() {
  const g = $('#gal')
  if (!g) return
  g.addEventListener('scroll', () => {
    const i = Math.round(g.scrollLeft / g.clientWidth)
    document.querySelectorAll('#gal-dots i').forEach((d, j) => d.classList.toggle('on', i === j))
  }, { passive: true })
}
function chargerBlock(c, i, car) {
  const dc = CONN[c.type].dc
  const ok = fits(car, c.type)
  let est = ''
  if (car && ok) {
    const mode = dc && car.dc ? 'dc' : 'ac'
    const e = estimateCharge({ kwh: car.battery, from: 20, to: 80, mode, chargerKw: c.kw, carKw: mode === 'dc' ? car.dc : car.ac, rate: 50 })
    if (e.ok) est = `<div class="row mt-8 t13" style="gap:10px;padding:8px 10px;border-radius:10px;background:var(--tint);color:var(--fg-2)">${ic('timer', 16)}<span><b class="mono">${fmtDur(e.minutes)}</b> at up to <span class="mono">${fmtKw(e.kw)} kW</span> · about <b>${fmtRs(e.cost)}</b> at Rs 50/kWh</span></div>`
  }
  const fit = ok === true ? `<span class="badge b-green">${ic('check', 12, { sw: 2.6 })}Fits your car</span>` : ok === false ? `<span class="badge b-slate">Not for your car</span>` : ''
  return `<div class="card charger">
    <span class="kind ${dc ? '' : 'ac'}">${dc ? 'DC' : 'AC'}</span>
    <div class="grow">
      <div class="row wrap" style="gap:6px">${connBadge(c.type)}<span class="t12 faint">#${i + 1}</span><span class="grow"></span>${fit}</div>
      <div class="row mt-8" style="gap:18px">
        <div><div class="t12 faint b6" style="letter-spacing:.08em">POWER</div><div class="mono b7 t17">${fmtKw(c.kw)}<span class="t12 muted" style="font-weight:400"> kW</span></div></div>
        <div><div class="t12 faint b6" style="letter-spacing:.08em">PORTS</div><div class="mono b7 t17">${c.ports}<span class="t12 muted" style="font-weight:400"> installed</span></div></div>
        <div class="grow"><div class="t12 faint b6" style="letter-spacing:.08em">SPEED</div><div class="t14 b6">${TIER[tier(c.kw)].label}</div></div>
      </div>
      ${est}
    </div>
  </div>`
}
function reviewItem(r) {
  return `<div class="review">
    <div class="row" style="gap:10px"><span class="avatar" style="width:36px;height:36px;font-size:14px">${initial(r.name)}</span>
      <div class="grow"><b class="t14">${esc(r.name)}</b>${r.mine ? ' <span class="badge b-teal">You</span>' : ''}<div class="t12 faint">${r.car ? `${esc(r.car)} · ` : ''}${ago(r.date)}</div></div>${stars(r.rating, 13)}</div>
    <p class="t14 mt-8" style="color:var(--fg-2)">${esc(r.text)}</p>
    ${r.helpful ? `<p class="t12 faint mt-8">${ic('heart', 12).replace('class="i"', 'class="i" style="display:inline;vertical-align:-1px"')} ${r.helpful} found this helpful</p>` : ''}
  </div>`
}

Object.assign(A, {
  shareStation: (id) => { const s = stById(id); copyText(`${s.name}, ${s.area}, ${s.city} — https://plug.pk/station/${s.slug}`, 'Link copied') },
  writeReview: (id) => {
    if (!S.user) return needSignIn('Sign in to review a station. Your name shows on the review.')
    U.review = { rating: 0, text: '' }
    openSheet('review', { id })
  },
  rate: (v) => { U.review.rating = +v; U.review.err = null; renderSheet() },
  submitReview: () => {
    const { id } = U.sheet
    const t = ($('#rv-text')?.value || '').trim()
    U.review.text = t
    if (!U.review.rating) { U.review.err = 'Tap the stars to rate your visit.'; return renderSheet() }
    if (t.length < 10) { U.review.err = 'Say a little more — at least 10 characters.'; return renderSheet() }
    S.myReviews.unshift({ id: 'my-' + Date.now(), stationId: id, name: S.user.name, car: myCar()?.name, rating: U.review.rating, text: t, date: new Date().toISOString(), mine: true })
    save(); closeSheet(); render(); toast('Review posted', 'star')
  },
  sendReport: () => {
    if (!U.sheet.reason) { U.sheet.err = true; return renderSheet() }
    closeSheet(); toast('Thanks — we’ll check this listing', 'flag')
  },
  reason: (v) => { U.sheet.reason = v; U.sheet.err = false; renderSheet() },
})
IN.rvText = (v) => { U.review.text = v }

SHEETS.review = ({ id }) => {
  const rv = U.review
  return {
    title: 'Rate your visit',
    body: `<p class="t14 muted">${esc(stById(id).name)}</p>
      <div class="row mt-16" style="gap:6px;justify-content:center">${[1, 2, 3, 4, 5].map((n) => `<button class="icon-btn" style="width:52px;height:52px;color:${rv.rating >= n ? 'var(--star)' : 'var(--line-strong)'}" data-a="rate" data-v="${n}" aria-label="${n} star${n > 1 ? 's' : ''}">${ic('star', 36, { fill: true, sw: 1 })}</button>`).join('')}</div>
      <p class="t13 muted" style="text-align:center;min-height:20px">${['', 'Poor', 'Not great', 'OK', 'Good', 'Excellent'][rv.rating]}</p>
      <label class="label mt-16" for="rv-text">Your review</label>
      <textarea class="textarea" id="rv-text" data-in="rvText" maxlength="600" placeholder="What speed did you get? Was the bay free? Anything to know before going?">${esc(rv.text)}</textarea>
      ${rv.err ? `<p class="err-msg">${ic('info', 15)}${rv.err}</p>` : '<p class="hint">Posted as ' + esc(S.user?.name) + '</p>'}`,
    foot: `<button class="btn btn-primary btn-block btn-lg" data-a="submitReview">Post review</button>`,
  }
}
SHEETS.report = (sh) => ({
  title: 'Report a problem',
  body: `<p class="t14 muted" style="margin-bottom:12px">What’s wrong with this listing?</p>
    <div class="list">${['Charger is broken or offline', 'Wrong location on the map', 'Wrong plug type or power', 'Station has closed', 'Something else'].map((r) => `<button class="list-row" data-a="reason" data-v="${r}"><span style="width:20px;height:20px;border-radius:50%;border:2px solid ${sh.reason === r ? 'var(--fg)' : 'var(--line-strong)'};display:grid;place-items:center">${sh.reason === r ? '<i style="width:8px;height:8px;border-radius:50%;background:var(--fg)"></i>' : ''}</span><span class="grow t14">${r}</span></button>`).join('')}</div>
    ${sh.err ? `<p class="err-msg">${ic('info', 15)}Pick what’s wrong first.</p>` : ''}`,
  foot: `<button class="btn btn-primary btn-block" data-a="sendReport">Send report</button>`,
})
SHEETS.signin = (sh) => ({
  title: 'Sign in to continue',
  body: `<p class="t14 muted">${esc(sh.why || 'Sign in to save this to your account.')}</p>
    <form class="stack gap-16 mt-16" data-submit="authSubmit" id="signin-form" novalidate>
      ${U.authMode === 'signup' ? `<div><label class="label" for="si-name">Your name</label><input class="input" id="si-name" name="name" autocomplete="name" placeholder="Ahmed Raza" value="${esc(U.authVals?.name)}"></div>` : ''}
      <div><label class="label" for="si-email">Email</label><input class="input" id="si-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" value="${esc(U.authVals?.email)}"></div>
      <div><label class="label" for="si-pass">Password</label><input class="input" id="si-pass" name="password" type="password" placeholder="At least 8 characters"></div>
      ${U.authErr ? `<p class="err-msg">${ic('info', 15)}${Object.values(U.authErr)[0]}</p>` : ''}
      <button class="btn btn-primary btn-lg btn-block" type="submit">${U.authMode === 'signup' ? 'Create account' : 'Sign in'}</button>
      <p class="t14 muted" style="text-align:center">${U.authMode === 'signup' ? 'Have an account?' : 'New here?'} <button type="button" class="link" data-a="sheetAuthMode">${U.authMode === 'signup' ? 'Sign in' : 'Create one'}</button></p>
    </form>`,
})
A.sheetAuthMode = () => { U.authMode = U.authMode === 'signup' ? 'signin' : 'signup'; U.authErr = null; renderSheet() }
