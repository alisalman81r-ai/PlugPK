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

// The plain street grid for a city without a hand-drawn map: no named roads,
// parks or districts, since inventing those would be drawing a city that is
// not there. The city name sits where a district label would.
const GENERIC_ART = (city) => ({
  rot: 0,
  roads: [],
  parks: [],
  areas: [[700, 640, city.toUpperCase()]],
})

function mapSvg(city) {
  const art = CITY_ART[city] || GENERIC_ART(city)
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
// The speed pill laid over a station photo: tier colour, bolt, figure.
const tierPill = (kw) => `<span class="tier-pill tier-${tier(kw)}">${ic('bolt', 12, { fill: true })}<b class="mono">${fmtKw(kw)}</b><small>kW · ${TIER[tier(kw)].label}</small></span>`

/**
 * The card in the map's bottom carousel. Compact on purpose — a thumbnail
 * beside four short lines — so the map stays the main thing on screen; the
 * full photo, plugs and amenities are one tap away on the station page.
 */
function mapCard(s) {
  const r = stRating(s)
  const sel = U.map.sel === s.id
  const kw = stMax(s)
  const plugs = stTypes(s).map((t) => CONN[t]?.label || t).join(', ')
  return `<div class="map-card v3 ${sel ? 'sel' : ''}" data-id="${s.id}">
    <button class="mc3-thumb" data-a="go" data-v="station" data-id="${s.id}" aria-label="Open ${esc(s.name)}">
      <img src="${img(s.photos[0])}" alt="" loading="lazy">
      <span class="mc3-tag">Example</span>
      <span class="mc3-kw tier-${tier(kw)}">${ic('bolt', 11, { fill: true })}<b class="mono">${fmtKw(kw)}</b>kW</span>
    </button>
    <div class="mc3-body">
      <div class="mc-head"><b class="trunc">${esc(s.name)}</b>${r ? `<span class="rating">${ic('star', 12, { fill: true })}${r.toFixed(1)}</span>` : ''}</div>
      <div class="mc-meta trunc"><span class="mono">${fmtDist(stDist(s))}</span> · ${esc(s.area)} · ${esc(plugs)}</div>
      ${reachChip(s)}
      <div class="mc3-acts">
        <button class="btn btn-sm btn-secondary grow" data-a="go" data-v="station" data-id="${s.id}">Details</button>
        <a class="btn btn-sm btn-primary grow" href="${navUrl(s)}" target="_blank" rel="noopener">${ic('nav', 14)}Navigate</a>
      </div>
    </div>
  </div>`
}
const navUrl = (s) => `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`

/** A station in the list view: a full-width photo card. */
function stationRow(s) {
  const r = stRating(s)
  return `<div class="st-card press" data-a="go" data-v="station" data-id="${s.id}">
    <div class="st-card-media">
      <img src="${img(s.photos[0])}" alt="" loading="lazy">
      ${tierPill(stMax(s))}
      <span class="mc-dist mono">${ic('nav', 12)}${fmtDist(stDist(s))}</span>
    </div>
    <div class="st-card-body">
      <div class="mc-head"><b class="trunc">${esc(s.name)}</b>${r ? `<span class="rating">${ic('star', 13, { fill: true })}${r.toFixed(1)}</span>` : ''}</div>
      <div class="mc-meta trunc">${esc(s.area)}, ${esc(s.city)} · <span class="mono">${stPorts(s)}</span> ports installed</div>
      ${reachChip(s)}
      <div class="mc-plugs">${exampleBadge()}${connBadges(stTypes(s))}</div>
    </div>
  </div>`
}

SCREENS.map = () => {
  const m = U.map
  const all = cityStations()
  const list = all.filter(stationMatches)
  if (m.sel && !list.some((s) => s.id === m.sel)) m.sel = null
  const fc = filterCount()
  // One-tap filters for the questions drivers ask most; everything else is in the Filters sheet.
  const quick = [['conn', 'CCS2', 'CCS2'], ['conn', 'Type2', 'Type 2'], ['speed', 50, '50 kW+'], ['speed', 150, '150 kW+']]
  const qOn = ([k, v]) => (k === 'conn' ? m.conn.includes(v) : m.speed === v)
  const chips = `<div class="chips map-chips">
      <button class="chip ${fc ? 'solid on' : ''}" data-a="sheet" data-v="filters">${ic('sliders', 16)}Filters${fc ? ` <span class="cnt">${fc}</span>` : ''}</button>
      ${quick.map((q) => `<button class="chip ${qOn(q) ? 'on' : ''}" data-a="quickFilter" data-v="${q[0]}:${q[1]}" aria-pressed="${qOn(q)}">${qOn(q) ? ic('check', 14, { sw: 2.4 }) : ''}${q[2]}</button>`).join('')}
    </div>`
  const cityBtn = `<button class="map-city" data-a="sheet" data-v="city" aria-label="Change city, now ${S.city}">${ic('pin', 15)}${S.city}${ic('chevD', 14)}</button>`
  if (m.view === 'list') {
    // The three facts a driver scans for before the list itself.
    const fastest = all.length ? Math.max(...all.map(stMax)) : 0
    const nearest = all.length ? fmtDist(stDist(all[0])) : '—'
    return {
      sb: 'dark', tabs: true,
      html: `<div class="topbar" style="flex-direction:column;align-items:stretch;gap:10px;padding-left:16px;padding-right:16px">
          <div class="row between"><div><h1 style="text-align:left;margin:0;font-size:24px">Stations</h1>${cityBtn.replace('map-city', 'map-city flat')}</div><button class="btn btn-sm btn-secondary" data-a="mapView" data-v="map">${ic('map', 16)}Map</button></div>
          ${chips}
        </div>
        <div class="scroll pad stack gap-12" style="padding-top:4px">
          ${all.length ? `<div class="st-sum">
            <div><b class="mono">${all.length}</b><span>station${all.length === 1 ? '' : 's'}</span></div>
            <div><b class="mono">${fmtKw(fastest)} kW</b><span>fastest</span></div>
            <div><b class="mono">${nearest}</b><span>nearest</span></div>
          </div>` : ''}
          <p class="t13 muted">${list.length} of ${all.length} station${all.length === 1 ? '' : 's'} · nearest to ${CITY[S.city].spot} first</p>
          ${list.map(stationRow).join('') || (all.length
            ? `<div class="empty">No station in ${S.city} matches these filters. <button class="btn btn-sm btn-secondary" data-a="clearFilters">Clear filters</button></div>`
            : `<div class="empty">No chargers listed in ${esc(S.city)} yet. <button class="btn btn-sm btn-secondary" data-a="sheet" data-v="city">Choose another city</button></div>`)}
        </div>`,
    }
  }
  const me = project(S.city, ...myPos())
  // The real map (MapLibre) is attached in mapAfter; the drawn map below is
  // only rendered when the map library could not load, e.g. offline.
  // The real map unless its library failed to load; then the drawn map.
  const world = !LIBRE.failed
    ? (hasLibre() ? '' : `<div class="map-loading" role="status">${ic('map', 22)}<span>Loading map…</span></div>`)
    : `<div class="map-world" id="map-world">
          ${mapSvg(S.city)}
          <div data-part="pins">${all.map((s) => {
            const [x, y] = project(s.city, s.lat, s.lng)
            const kw = stMax(s)
            const on = list.includes(s)
            return `<button class="pin tier-${tier(kw)} ${m.sel === s.id ? 'sel' : ''} ${on ? '' : 'dim'}" style="left:${x}px;top:${y}px" data-a="pinSel" data-v="${s.id}" aria-label="${esc(s.name)}, ${kw} kW">
              <span class="bubble"><span class="bolt">${ic('bolt', 13, { fill: true, sw: 1 })}</span>${fmtKw(kw)} kW</span><span class="tip"></span></button>`
          }).join('')}</div>
          <span class="me" style="left:${me[0]}px;top:${me[1]}px" title="You (approximate)"></span>
        </div>`
  return {
    sb: 'dark', tabs: true,
    html: `<div class="map-wrap ${!LIBRE.failed ? 'libre-on' : ''}" id="map-wrap">${world}</div>
      <div class="map-top">
        <div class="map-search"><button class="grow row" style="gap:10px;min-height:48px;text-align:left" data-a="go" data-v="search">${ic('search', 20)}<span class="grow faint">Search stations or areas</span></button>${cityBtn}</div>
        ${chips}
      </div>
      <div class="map-ctrl" style="top:calc(var(--top) + 132px)">
        <button class="glass-btn" data-a="mapView" data-v="list" aria-label="Show as list">${ic('rows', 20)}</button>
        <div class="ctrl-group"><button data-a="zoom" data-v="1.4" aria-label="Zoom in">${ic('plus', 20)}</button><button data-a="zoom" data-v="0.7" aria-label="Zoom out">${ic('minus', 20)}</button></div>
        <button class="glass-btn" data-a="locate" aria-label="Centre on me">${ic('locate', 20)}</button>
      </div>
      <div class="map-carousel"><div class="hscroll" id="map-cards" data-part="cards">${list.map(mapCard).join('') || `<div class="map-card" style="width:calc(100% - 0px)"><div class="grow t14 muted">${all.length ? `No station here matches your filters. <button class="link" data-a="clearFilters">Clear filters</button>` : `No chargers listed in ${esc(S.city)} yet. <button class="link" data-a="sheet" data-v="city">Choose another city</button>`}</div></div>`}</div></div>`,
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
  const visTop = 140, visBottom = h - 250
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

// ─── Real map: MapLibre on OpenFreeMap tiles ──────────────────────────
// The same engine and tile host as the website (src/components/map). Quiet
// basemaps — positron by day, dark by night — so the station pins carry the
// colour. The map is created once and kept: re-renders move its element back
// into the screen instead of reloading tiles every time a filter changes.
const MAP_STYLES = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}
const LM = { map: null, el: null, style: null, markers: new Map(), me: null }
const hasLibre = () => typeof window.maplibregl !== 'undefined'

// The library is fetched on demand rather than in <head>: 800 KB that held up
// every launch for a screen many launches never open.
const LIBRE_JS = 'https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.js'
const LIBRE = { promise: null, failed: false }
function loadLibre() {
  if (hasLibre()) return Promise.resolve()
  if (!LIBRE.promise) {
    LIBRE.promise = new Promise((resolve, reject) => {
      const tag = document.createElement('script')
      tag.src = LIBRE_JS
      tag.async = true
      tag.onload = () => resolve()
      tag.onerror = () => { LIBRE.failed = true; LIBRE.promise = null; reject(new Error('map library unavailable')) }
      document.head.appendChild(tag)
    })
  }
  return LIBRE.promise
}
// Called once the app is idle (index.html): library plus the style for the
// current theme, so opening Stations finds both already downloaded.
function warmMap() {
  loadLibre().catch(() => {})
  fetch(MAP_STYLES[isDark() ? 'dark' : 'light']).catch(() => {})
}
// Room the map keeps clear for the search bar above and the cards below,
// measured from the screen so a taller card or the tab bar never hides a pin.
// Centres a point in the clear area between the chips and the cards. An
// offset rather than a camera `padding`: MapLibre keeps a padding on the map
// after the move, and every later fit then counts it twice — a city no longer
// "fits", the fit comes back empty and the map stays where it was.
function clearOffset() {
  const pad = mapPadding()
  return [(pad.left - pad.right) / 2, (pad.top - pad.bottom) / 2]
}
function mapPadding() {
  const wrap = $('#map-wrap')?.getBoundingClientRect()
  const top = $('.map-top')?.getBoundingClientRect()
  const cards = $('.map-carousel')?.getBoundingClientRect()
  if (!wrap || !wrap.height) return { top: 150, bottom: 380, left: 36, right: 72 }
  return {
    // + the pin height: a pin hangs above its point, so its point alone being
    // clear would still leave the bubble under the chips.
    top: Math.max(24, (top ? top.bottom - wrap.top : 140) + 28 + 56),
    bottom: Math.max(40, (cards ? wrap.bottom - cards.top : 360) + 24),
    left: 36,
    right: 72,
  }
}

// English (then latin) place names, as on the website's map: the basemap's
// default label is the local-script name, which printed Urdu beside English.
function englishLabels(map) {
  for (const layer of map.getStyle()?.layers || []) {
    if (layer.type !== 'symbol') continue
    const field = map.getLayoutProperty(layer.id, 'text-field')
    if (!field || !JSON.stringify(field).includes('name')) continue
    map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']])
  }
}

function pinEl(s) {
  const kw = stMax(s)
  const b = document.createElement('button')
  b.className = `mk tier-${tier(kw)}`
  b.dataset.a = 'pinSel'
  b.dataset.v = s.id
  b.setAttribute('aria-label', `${s.name}, ${fmtKw(kw)} kW`)
  b.innerHTML = `<span class="mk-in">
      <span class="mk-name">${esc(s.name)}</span>
      <span class="mk-body"><span class="mk-bolt">${ic('bolt', 12, { fill: true })}</span><b>${fmtKw(kw)}</b><small>kW</small></span>
      <span class="mk-tip"></span>
    </span>`
  return b
}

function ensureLibreMap(wrap) {
  const key = isDark() ? 'dark' : 'light'
  if (!LM.map) {
    LM.el = document.createElement('div')
    LM.el.className = 'libre'
    wrap.appendChild(LM.el)
    LM.map = new maplibregl.Map({
      container: LM.el,
      style: MAP_STYLES[key],
      // Born on the country view, where the opening fly-in starts.
      bounds: PAKISTAN,
      // Smoothness: a 3x phone screen drawn at 2x is 2.25x fewer pixels per
      // frame and looks the same on a map; no repeated worlds either side; a
      // short label fade.
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      renderWorldCopies: false,
      fadeDuration: 150,
      maxPitch: 60,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    })
    LM.map.touchZoomRotate.disableRotation()
    LM.map.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-left')
    // Re-applied after every style load, including a light/dark switch.
    LM.map.on('style.load', () => { englishLabels(LM.map); brandMap(LM.map) })
    LM.map.on('moveend', updateClusters)
    // A tap on the map itself — not on a pin or a group — deselects. MapLibre
    // only reports a click when the pointer did not drag, so panning keeps the
    // selection.
    LM.map.on('click', (e) => {
      if (e.originalEvent?.target?.closest?.('.mk, .cluster, .me-dot')) return
      deselectStation()
    })
    LM.map.on('zoom', () => LM.spot?.getElement().classList.toggle('on', LM.map.getZoom() < 9))
    LM.map.once('load', () => {
      // Collapsed to its (i) button: the credit stays one tap away without
      // covering the map. MapLibre opens it on first load otherwise.
      LM.el.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
      LM.loaded = true
      // First time the map exists: always open with the country fly-in.
      U.map.intro = true
      arrive()
    })
    LM.style = key
  } else {
    wrap.appendChild(LM.el)
    if (LM.style !== key) {
      LM.map.setStyle(MAP_STYLES[key])
      LM.style = key
    }
    requestAnimationFrame(() => LM.map.resize())
  }
}

function syncMarkers() {
  const all = cityStations()
  const list = all.filter(stationMatches)
  const keep = new Set(all.map((s) => s.id))
  for (const [id, mk] of LM.markers) {
    if (!keep.has(id)) { mk.remove(); LM.markers.delete(id) }
  }
  for (const s of all) {
    let mk = LM.markers.get(s.id)
    if (!mk) {
      mk = new maplibregl.Marker({ element: pinEl(s), anchor: 'bottom' }).setLngLat([s.lng, s.lat]).addTo(LM.map)
      LM.markers.set(s.id, mk)
    }
    const el = mk.getElement()
    const sel = U.map.sel === s.id
    el.classList.toggle('sel', sel)
    el.classList.toggle('dim', !list.includes(s))
    el.style.zIndex = sel ? '3' : '1'
  }
  const [lat, lng] = myPos()
  if (!LM.me) {
    const dot = document.createElement('span')
    dot.className = 'me-dot'
    dot.title = 'You (approximate)'
    LM.me = new maplibregl.Marker({ element: dot }).setLngLat([lng, lat]).addTo(LM.map)
  } else {
    LM.me.setLngLat([lng, lat])
  }
}

// The city's camera: its stations and you, framed inside the clear area.
function cityCamera() {
  const [lat, lng] = myPos()
  const pts = [[lng, lat], ...cityStations().map((s) => [s.lng, s.lat])]
  if (pts.length === 1) return { center: pts[0], zoom: 11.5, pitch: 0, bearing: 0 }
  const bounds = pts.reduce((b, p) => b.extend(p), new maplibregl.LngLatBounds(pts[0], pts[0]))
  // Worked out flat: the tilted street view after a station can frame less.
  const cam = LM.map.cameraForBounds(bounds, { padding: mapPadding(), maxZoom: 14.5, pitch: 0, bearing: 0 }) ||
    { center: bounds.getCenter(), zoom: 11.5 }
  return { ...cam, pitch: 0, bearing: 0 }
}

function fitLibre(animate = false) {
  // The map's own size must be current before it can fit anything into it.
  LM.map.resize()
  LM.map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 })
  const cam = cityCamera()
  if (animate) LM.map.flyTo({ ...cam, duration: 1250, curve: 1.25, essential: true })
  else LM.map.jumpTo(cam)
  U.map.fitted = S.city
}

// ─── Opening the map: all of Pakistan, then down into the city ─────────
const PAKISTAN = [[60.8, 23.6], [77.9, 37.1]]
function introFly() {
  LM.map.resize()
  const country = LM.map.cameraForBounds(PAKISTAN, { padding: mapPadding() })
  LM.map.jumpTo({ ...country, pitch: 0, bearing: 0 })
  updateSpotlight()
  updateClusters()
  // Fly down once the country has drawn (or after 0.8 s on a slow network),
  // so the first thing seen is Pakistan, not an empty map.
  clearTimeout(LM.introTimer)
  let flown = false
  const go = () => { if (flown) return; flown = true; clearTimeout(LM.introTimer); fitLibre(true) }
  LM.map.once('idle', () => setTimeout(go, 150))
  LM.introTimer = setTimeout(go, 800)
  U.map.fitted = S.city
}
// What the map does on arriving: the fly-in when Stations was just opened, a
// flight to the new city after a city change, otherwise stay where it is.
function arrive() {
  if (U.map.intro) { U.map.intro = false; return introFly() }
  if (U.map.fitted !== S.city) fitLibre(true)
}

// ─── Brand palette and 3D buildings ───────────────────────────────────
const PALETTE = {
  light: { bg: '#F2F6F4', water: '#BFE4E0', park: '#D6F0E2', wood: '#CDEBDA', residential: '#EAF0ED', building: '#E2E9E6', b3d: '#D9E3DF' },
  dark: { bg: '#07110F', water: '#0B2C2E', park: '#0F2A20', wood: '#0E261D', residential: '#0B1815', building: '#12221F', b3d: '#1B3631' },
}
function brandMap(map) {
  const c = PALETTE[LM.style === 'dark' ? 'dark' : 'light']
  const paint = (id, prop, value) => { if (map.getLayer(id)) map.setPaintProperty(id, prop, value) }
  paint('background', 'background-color', c.bg)
  paint('water', 'fill-color', c.water)
  for (const id of ['park', 'landuse_park']) paint(id, 'fill-color', c.park)
  paint('landcover_wood', 'fill-color', c.wood)
  paint('landuse_residential', 'fill-color', c.residential)
  paint('building', 'fill-color', c.building)
  // Buildings rise from street level: drawn from zoom 15, full height by 16.
  if (!map.getLayer('plug-3d') && map.getSource('openmaptiles')) {
    const firstLabel = (map.getStyle().layers || []).find((l) => l.type === 'symbol')?.id
    map.addLayer({
      id: 'plug-3d',
      type: 'fill-extrusion',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': c.b3d,
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 16, ['coalesce', ['get', 'render_height'], 8]],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.82,
      },
    }, firstLabel)
  }
}

// ─── City spotlight on the country view ───────────────────────────────
function updateSpotlight() {
  if (!LM.map) return
  const row = ALL_CITIES.find(([n]) => n === S.city)
  const [lat, lng] = row ? [row[1], row[2]] : CITY[S.city].me
  if (!LM.spot) {
    const el = document.createElement('div')
    el.className = 'city-spot'
    LM.spot = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(LM.map)
  }
  const el = LM.spot.getElement()
  // Faded on an inner element: MapLibre sets an inline opacity on the marker
  // root itself, which would override a class-based fade there.
  el.innerHTML = `<span class="spot-in"><span class="ring"></span><span class="ring r2"></span><span class="dot"></span><span class="lbl">${esc(S.city)}</span></span>`
  LM.spot.setLngLat([lng, lat])
  // Only on the wide views; in the city the pins and the blue dot take over.
  el.classList.toggle('on', LM.map.getZoom() < 9)
}

// ─── Pin grouping ─────────────────────────────────────────────────────
// Pins closer than this on screen merge into one bubble with a count.
const CLUSTER_PX = 54
function updateClusters() {
  if (!LM.map) return
  for (const c of LM.clusters || []) c.remove()
  LM.clusters = []
  const items = [...LM.markers.entries()].map(([id, mk]) => ({ id, mk, p: LM.map.project(mk.getLngLat()) }))
  const used = new Set()
  for (const a of items) {
    if (used.has(a.id)) continue
    const group = items.filter((b) => !used.has(b.id) && Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y) < CLUSTER_PX)
    group.forEach((g) => used.add(g.id))
    if (group.length === 1) { a.mk.getElement().style.display = ''; continue }
    group.forEach((g) => (g.mk.getElement().style.display = 'none'))
    const lngLats = group.map((g) => g.mk.getLngLat())
    const center = [lngLats.reduce((s, l) => s + l.lng, 0) / lngLats.length, lngLats.reduce((s, l) => s + l.lat, 0) / lngLats.length]
    const el = document.createElement('button')
    el.className = 'cluster'
    el.setAttribute('aria-label', `${group.length} stations here, zoom in`)
    el.innerHTML = `<span class="cl-in">${ic('bolt', 13, { fill: true })}<b>${group.length}</b><small>stations</small></span>`
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      const b = lngLats.reduce((bb, l) => bb.extend(l), new maplibregl.LngLatBounds(lngLats[0], lngLats[0]))
      LM.map.fitBounds(b, { padding: mapPadding(), maxZoom: 16, duration: 900 })
    })
    LM.clusters.push(new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(center).addTo(LM.map))
  }
}

function libreAfter() {
  $('#map-wrap .map-loading')?.remove()
  ensureLibreMap($('#map-wrap'))
  syncMarkers()
  updateSpotlight()
  // After layout, so the measured padding is right. Before the style has
  // loaded, the 'load' handler in ensureLibreMap arrives instead.
  if (LM.loaded) requestAnimationFrame(() => requestAnimationFrame(() => { arrive(); updateClusters() }))
}

function mapAfter() {
  if (!LIBRE.failed) {
    if (hasLibre()) libreAfter()
    // Still downloading (opened very soon after launch): show the placeholder,
    // then attach the map if Stations is still the screen. If it cannot load
    // at all, re-render with the drawn map.
    else loadLibre().then(() => { if ($('#map-wrap')) libreAfter() }).catch(() => render())
    return wireCards()
  }
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
      // A tap (no drag) on empty map deselects, as on the real map.
      if (start && !start.moved && !e.target.closest?.(".pin")) deselectStation()
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

  wireCards()
}

// Swiping the cards selects the station in view.
function wireCards() {
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
  document.querySelectorAll('#map-cards .map-card').forEach((c) => c.classList.toggle('sel', c.dataset.id === id))
  if (hasLibre() && LM.map) {
    syncMarkers()
    // Street level with a tilt, so the 3D buildings around the station show.
    LM.map.easeTo({ center: [s.lng, s.lat], zoom: Math.max(LM.map.getZoom(), 15.6), pitch: 48, offset: clearOffset(), duration: 900 })
  } else {
    renderPart('pins')
    centreOn(project(s.city, s.lat, s.lng), Math.max(U.map.z, 0.8))
  }
  if (scroll) scrollToCard(id)
}

/**
 * Clears the selection: the pin drops its name and highlight, the card its
 * outline, and the map eases back from the tilted 3D view to flat. Zoom and
 * position stay where they are — the tap was a "never mind", not a reset.
 */
function deselectStation() {
  if (!U.map.sel) return
  U.map.sel = null
  document.querySelectorAll('#map-cards .map-card.sel').forEach((c) => c.classList.remove('sel'))
  if (hasLibre() && LM.map) {
    syncMarkers()
    if (LM.map.getPitch() > 0) LM.map.easeTo({ pitch: 0, duration: 500 })
  } else {
    renderPart('pins')
  }
}

Object.assign(A, {
  pinSel: (id) => { if (!U.map.dragged) selectStation(id) },
  zoom: (v) => {
    if (hasLibre() && LM.map) return +v > 1 ? LM.map.zoomIn() : LM.map.zoomOut()
    const [w, h] = mapViewport()
    const c = [(w / 2 - U.map.x) / U.map.z, (h / 2 - U.map.y) / U.map.z]
    const z = clamp(U.map.z * +v, 0.35, 2.6)
    U.map.x = w / 2 - c[0] * z
    U.map.y = h / 2 - c[1] * z
    U.map.z = z
    applyMapTransform(true)
  },
  // Centre on me: asks for the phone's location the first time, then flies to it.
  locate: () => {
    const fly = () => {
      const [lat, lng] = myPos()
      if (hasLibre() && LM.map) LM.map.flyTo({ center: [lng, lat], zoom: 15.6, pitch: 48, offset: clearOffset(), duration: 1100 })
      else centreOn(project(S.city, lat, lng), 1)
    }
    if (U.gps) fly()
    else requestGps(() => requestAnimationFrame(() => requestAnimationFrame(fly)))
  },
  mapView: (v) => { U.map.view = v; if (v === 'map') U.map.fitted = null; render() },
  clearFilters: () => { Object.assign(U.map, { conn: [], speed: 0, amen: [] }); closeSheet(); render() },
  fConn: (v) => { U.map.conn = U.map.conn.includes(v) ? U.map.conn.filter((x) => x !== v) : [...U.map.conn, v]; renderSheet() },
  fSpeed: (v) => { U.map.speed = +v; renderSheet() },
  quickFilter: (v) => {
    const [k, val] = v.split(':')
    if (k === 'conn') U.map.conn = U.map.conn.includes(val) ? U.map.conn.filter((x) => x !== val) : [...U.map.conn, val]
    else U.map.speed = U.map.speed === +val ? 0 : +val
    render()
  },
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
        ${reachChip(s) ? `<div class="mt-12">${reachChip(s, { full: true })}</div>` : ''}

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
          ${car ? `<p class="t13 muted mt-4">Estimates for your ${esc(car.name)}, charging 20→80% at Rs 50 per kWh.</p>` : ''}
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
    if (e.ok) est = `<div class="est" title="For your car, 20→80%, at Rs 50 per kWh">
      <div><span>20→80%</span><b>${fmtDur(e.minutes)}</b></div>
      <div><span>About</span><b>${fmtRs(e.cost)}</b></div>
      <div><span>Up to</span><b>${fmtKw(e.kw)} kW</b></div></div>`
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
