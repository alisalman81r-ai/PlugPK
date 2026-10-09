// plug.pk app prototype — core: data, icons, maths, state and the render loop.
// Plain JavaScript, no build step. Screens live in screens-*.js.
'use strict'

const D = window.PLUG_DATA
// Served by the website at /app-prototype, images sit at /images. Anywhere else
// (a published preview), they are published next to the page.
const IMG = location.pathname.startsWith('/app-prototype') ? '/images/' : 'images/'
// Paths from the data get the image root; ones already absolute, prefixed or inline pass through.
const img = (p) => (!p ? '' : p.startsWith(IMG) || /^(\/|data:|blob:|https?:)/.test(p) ? p : IMG + p)

// ─── Small helpers ─────────────────────────────────────────────────
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const n0 = (n) => Math.round(n).toLocaleString('en-PK')
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const by = (k, dir = 1) => (a, b) => ((a[k] ?? Infinity) > (b[k] ?? Infinity) ? dir : (a[k] ?? Infinity) < (b[k] ?? Infinity) ? -dir : 0)
const initial = (name) => esc((name || '?').trim()[0].toUpperCase())
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
function ago(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 864e5
  if (d < 1 / 24) return 'Just now'
  if (d < 1) return `${Math.round(d * 24)}h ago`
  if (d < 30) return `${Math.round(d)}d ago`
  return fmtDate(iso)
}

// ─── Icons ─────────────────────────────────────────────────────────
// Phosphor Icons, the website's own family (DESIGN.md section 7), built into
// icons.js by scripts/build-app-icons.mjs. Regular weight by default; `fill`
// for "on" states (a liked heart, a rating star); a stroke width at or below
// 1.6 maps to light and at or above 2.4 to bold, so call sites that asked for
// thinner or heavier lines keep reading the way they were designed.
const ICONS = window.PLUG_ICONS || {}
function ic(name, size = 20, opt = {}) {
  const glyph = ICONS[name]
  const sw = opt.sw || 1.8
  const weight = opt.fill ? 'fill' : sw <= 1.6 ? 'light' : sw >= 2.4 ? 'bold' : 'regular'
  return `<svg class="i" width="${size}" height="${size}" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${glyph ? glyph[weight] : ''}</svg>`
}
function logoMark(size = 24, color = '#6FE8B6') {
  return `<svg width="${size}" height="${size}" viewBox="4 6 160 160" aria-hidden="true"><g fill="${color}" stroke="${color}" stroke-linejoin="round"><path stroke-width="11" d="M99 18 L88 66 L130 69 L57 152 L61 107 L14 102 Z"/><path stroke-width="5" d="M143.5 75 L140.5 85.5 L154 85.5 L154 88.5 L138.5 88.5 L135.5 99.5 L122 101.5 Z"/></g></svg>`
}
function logo(size = 22, dark = true) {
  const accent = dark ? '#6FE8B6' : '#159E89'
  return `<span class="row" style="gap:.22em;font:700 ${size}px/1 var(--font);letter-spacing:-0.035em;color:${dark ? '#fff' : 'var(--fg)'}">${logoMark(size * 1.18, accent)}<span>plug<span style="color:${accent}">.pk</span></span></span>`
}

// ─── Connectors, speed, stations ───────────────────────────────────
const CONN = {
  CCS2: { label: 'CCS2', cls: 'b-mint', dc: true },
  CHAdeMO: { label: 'CHAdeMO', cls: 'b-amber', dc: true },
  Type2: { label: 'Type 2', cls: 'b-teal', dc: false },
  GBT: { label: 'GB/T', cls: 'b-green', dc: true },
  Type1: { label: 'Type 1', cls: 'b-slate', dc: false },
}
function normConn(s) {
  const k = String(s).toLowerCase().replace(/[\s/\-_.]/g, '')
  if (k.startsWith('ccs')) return 'CCS2'
  if (k.includes('chademo')) return 'CHAdeMO'
  if (k.includes('type2')) return 'Type2'
  if (k.includes('gbt')) return 'GBT'
  if (k.includes('type1')) return 'Type1'
  return null
}
const carConns = (car) => (car?.connectors ? [...new Set(car.connectors.split(/[,;]/).map(normConn).filter(Boolean))] : [])
const connBadge = (t) => `<span class="badge ${CONN[t]?.cls || 'b-slate'}">${esc(CONN[t]?.label || t)}</span>`
function connBadges(types, max = 3) {
  const shown = types.slice(0, max).map(connBadge).join('')
  return shown + (types.length > max ? `<span class="badge b-slate">+${types.length - max}</span>` : '')
}

const TIER = {
  ultra: { label: 'Ultra rapid', cls: 'b-mint', dot: '#0F7A6A' },
  rapid: { label: 'Rapid', cls: 'b-amber', dot: '#D97706' },
  fast: { label: 'Fast', cls: 'b-green', dot: '#16A34A' },
  slow: { label: 'Slow', cls: 'b-slate', dot: '#989FA1' },
}
const tier = (kw) => (kw >= 150 ? 'ultra' : kw >= 50 ? 'rapid' : kw >= 7 ? 'fast' : 'slow')
const fmtKw = (kw) => (Number.isInteger(kw) ? kw : kw.toFixed(1))
const speedBadge = (kw) => `<span class="badge ${TIER[tier(kw)].cls}">${ic('bolt', 12, { fill: true, sw: 1 })}<span class="mono">${fmtKw(kw)} kW</span></span>`
const exampleBadge = (big) => `<span class="badge ${big ? 'md ' : ''}b-example">${big ? ic('info', 14) : ''}Example listing</span>`

const stMax = (s) => Math.max(...s.connectors.map((c) => c.kw))
const stPorts = (s) => s.connectors.reduce((a, c) => a + c.ports, 0)
const stTypes = (s) => [...new Set(s.connectors.map((c) => c.type))]
const stById = (id) => D.stations.find((s) => s.id === id)
const carBySlug = (slug) => D.cars.find((c) => c.slug === slug)
const stReviews = (s) => [...S.myReviews.filter((r) => r.stationId === s.id), ...s.reviews]
function stRating(s) {
  const r = stReviews(s)
  return r.length ? Math.round((r.reduce((a, x) => a + x.rating, 0) / r.length) * 10) / 10 : null
}
/** Does this connector suit this car? null when the catalogue doesn't list the car's sockets. */
function fits(car, type) {
  const mine = carConns(car)
  if (!car || !mine.length) return null
  if (CONN[type]?.dc && !car.dc) return false
  return mine.includes(type)
}

function stars(v, size = 14) {
  let h = '<span class="stars">'
  for (let i = 1; i <= 5; i++) h += `<span class="${v >= i - 0.25 ? 'on' : ''}">${ic('star', size, { fill: true, sw: 1 })}</span>`
  return h + '</span>'
}

// Approximate "you are here" per city. The prototype has no GPS, so it's a fixed point.
const CITY = {
  Lahore: { me: [31.5204, 74.3487], spot: 'Liberty Market', landmark: 'minar' },
  Islamabad: { me: [33.7181, 73.0576], spot: 'F-7 Markaz', landmark: 'faisal' },
  Karachi: { me: [24.8452, 67.0423], spot: 'Shahrah-e-Faisal', landmark: 'quaid' },
}
// Every city the website knows (src/lib/constants.ts PAKISTAN_CITIES), with the
// approximate centre from src/lib/city-coordinates.ts. Cities with a hand-drawn
// map and a named "you are here" spot are in CITY above; the rest use the
// centre as the fixed point and the plain map (screens-map.js GENERIC_ART).
const ALL_CITIES = [
  ["Abbottabad", 34.1688, 73.2215],
  ["Astore", 35.3667, 74.85],
  ["Attock", 33.766, 72.36],
  ["Badin", 24.656, 68.837],
  ["Bagh", 33.98, 73.77],
  ["Bahawalnagar", 29.9983, 73.2533],
  ["Bahawalpur", 29.3956, 71.6836],
  ["Bannu", 32.9889, 70.6056],
  ["Batkhela", 34.6167, 72],
  ["Bhakkar", 31.6333, 71.0667],
  ["Bhimber", 32.974, 74.079],
  ["Chakwal", 32.9328, 72.863],
  ["Chaman", 30.92, 66.45],
  ["Charsadda", 34.1682, 71.7404],
  ["Chilas", 35.42, 74.1],
  ["Chiniot", 31.72, 72.9781],
  ["Chitral", 35.8518, 71.7864],
  ["Dadu", 26.73, 67.78],
  ["Dera Ghazi Khan", 30.0561, 70.6403],
  ["Dera Ismail Khan", 31.8313, 70.9019],
  ["Dera Murad Jamali", 28.55, 68.2167],
  ["Faisalabad", 31.4504, 73.135],
  ["Ghotki", 28, 69.3167],
  ["Gilgit", 35.9208, 74.308],
  ["Gujranwala", 32.1877, 74.1945],
  ["Gujrat", 32.574, 74.0754],
  ["Gwadar", 25.1264, 62.3225],
  ["Hafizabad", 32.0709, 73.688],
  ["Hangu", 33.5333, 71.05],
  ["Haripur", 33.9942, 72.9333],
  ["Hub", 25, 67.1],
  ["Hunza", 36.3167, 74.65],
  ["Hyderabad", 25.396, 68.3578],
  ["Islamabad", 33.6844, 73.0479],
  ["Jacobabad", 28.282, 68.438],
  ["Jamshoro", 25.43, 68.28],
  ["Jhang", 31.2781, 72.3317],
  ["Jhelum", 32.9333, 73.7333],
  ["Kalat", 29.026, 66.59],
  ["Karachi", 24.8607, 67.0011],
  ["Karak", 33.1167, 71.0833],
  ["Kasur", 31.1187, 74.45],
  ["Khairpur", 27.5295, 68.7592],
  ["Khanewal", 30.3017, 71.9321],
  ["Kharan", 28.585, 65.415],
  ["Khushab", 32.296, 72.352],
  ["Khuzdar", 27.812, 66.61],
  ["Kohat", 33.5869, 71.4414],
  ["Kotli", 33.518, 73.902],
  ["Lahore", 31.5204, 74.3587],
  ["Lakki Marwat", 32.607, 70.911],
  ["Larkana", 27.558, 68.212],
  ["Layyah", 30.96, 70.94],
  ["Lodhran", 29.54, 71.63],
  ["Loralai", 30.3705, 68.598],
  ["Mandi Bahauddin", 32.5861, 73.4917],
  ["Mansehra", 34.33, 73.2],
  ["Mardan", 34.1989, 72.0231],
  ["Mastung", 29.799, 66.845],
  ["Matiari", 25.599, 68.446],
  ["Mianwali", 32.5839, 71.537],
  ["Mingora", 34.7795, 72.3614],
  ["Mirpur", 33.1478, 73.7519],
  ["Mirpur Khas", 25.5276, 69.0122],
  ["Multan", 30.1575, 71.5249],
  ["Muzaffarabad", 34.37, 73.4711],
  ["Muzaffargarh", 30.0736, 71.1805],
  ["Nankana Sahib", 31.4492, 73.7126],
  ["Narowal", 32.1, 74.87],
  ["Nawabshah", 26.2483, 68.4096],
  ["Nowshera", 34.0153, 71.9747],
  ["Nushki", 29.55, 66.02],
  ["Okara", 30.8138, 73.4534],
  ["Pakpattan", 30.34, 73.4],
  ["Panjgur", 26.97, 64.1],
  ["Peshawar", 34.0151, 71.5249],
  ["Quetta", 30.1798, 66.975],
  ["Rahim Yar Khan", 28.4202, 70.2952],
  ["Rajanpur", 29.1041, 70.3297],
  ["Rawalakot", 33.8578, 73.7604],
  ["Rawalpindi", 33.5651, 73.0169],
  ["Sahiwal", 30.6682, 73.1114],
  ["Sanghar", 26.046, 68.949],
  ["Sargodha", 32.0836, 72.6711],
  ["Sheikhupura", 31.7131, 73.9783],
  ["Shikarpur", 27.9556, 68.6382],
  ["Sialkot", 32.4945, 74.5229],
  ["Sibi", 29.543, 67.877],
  ["Skardu", 35.2971, 75.6333],
  ["Sukkur", 27.7052, 68.8574],
  ["Swabi", 34.12, 72.47],
  ["Tando Adam", 25.7667, 68.6614],
  ["Tando Allahyar", 25.46, 68.719],
  ["Tank", 32.2167, 70.3833],
  ["Thatta", 24.7461, 67.9243],
  ["Timergara", 34.8281, 71.8419],
  ["Toba Tek Singh", 30.9709, 72.4826],
  ["Turbat", 26.0023, 63.045],
  ["Umerkot", 25.3614, 69.7361],
  ["Usta Mohammad", 28.18, 68.05],
  ["Vehari", 30.0442, 72.3489],
  ["Wah Cantonment", 33.7667, 72.75],
  ["Zhob", 31.341, 69.449],
]
for (const [name, lat, lng] of ALL_CITIES) {
  if (!CITY[name]) CITY[name] = { me: [lat, lng], spot: `central ${name}`, landmark: null }
}
// Cities that hold at least one listed station, in the order CITY lists them.
const CITIES_WITH_STATIONS = Object.keys(CITY).filter((c) => D.stations.some((s) => s.city === c))
function haversine([a, b], [c, d]) {
  const R = 6371, r = Math.PI / 180
  const x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}
// ─── Where you are ─────────────────────────────────────────────────
// The phone's position when you allow it (this session only, never saved),
// otherwise the city's fixed "you are here" spot.
const myPos = () => U.gps || CITY[S.city]?.me
const stDist = (s) => {
  const from = U.gps || CITY[s.city]?.me
  return from ? haversine(from, [s.lat, s.lng]) * 1.25 : null // road factor
}

function requestGps(after) {
  if (!navigator.geolocation) return toast('Location isn’t available on this device', 'info')
  toast('Finding your location…', 'locate')
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const here = [pos.coords.latitude, pos.coords.longitude]
      const [name, km] = ALL_CITIES.map(([n, la, lo]) => [n, haversine(here, [la, lo])]).sort((a, b) => a[1] - b[1])[0] || []
      // Further than this from every listed city: probably not in Pakistan, so
      // distances from here would be meaningless. Keep the chosen city.
      if (!name || km > 80) return toast(`You seem to be outside the cities we cover, so we’re showing ${S.city}`, 'info')
      U.gps = here
      if (S.city !== name) { S.city = name; save() }
      U.map.fitted = null
      toast(`Using your location · ${name}`, 'locate')
      if (U.sheet) closeSheet()
      render()
      after?.()
    },
    (err) => toast(err.code === 1 ? 'Location is blocked. Choose your city instead.' : 'Couldn’t find your location. Choose your city instead.', 'info'),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  )
}

// ─── Will my car make it? ──────────────────────────────────────────
// Electric range only: a plug-in hybrid's combined petrol figure says nothing
// about reaching a charger on battery.
const elecRange = (c) => (c.category === 'EV' ? c.range : c.eRange ?? c.range)
// The share of a full battery the drive takes, at 85% of rated range (motorway
// speed, AC on — the same allowance the route planner uses), and whether any
// of the station's plugs fits. Current charge is not known, so it is stated as
// a share of a full battery rather than "you will arrive with X%".
function reachInfo(s, car = myCar()) {
  if (!car) return null
  const range = elecRange(car)
  const km = stDist(s)
  const plug = carConns(car).length ? stTypes(s).some((t) => fits(car, t)) : null
  const pct = range > 0 && km != null ? Math.max(1, Math.ceil((km / (range * 0.85)) * 100)) : null
  return { pct, plug, model: car.model }
}
// One line on the cards ("Fits your car · ~2% battery"); the station page, which
// has the room, names the car (`full`). The full sentence is the tooltip either way.
function reachChip(s, { full = false } = {}) {
  const r = reachInfo(s)
  if (!r) return ''
  const car = full ? `your ${esc(r.model)}` : 'your car'
  if (r.plug === false) return `<span class="reach no" title="None of these plugs fits your ${esc(r.model)}">${ic('info', 13)}No plug for ${car}</span>`
  const far = r.pct != null && r.pct > 100
  const text = r.pct == null ? '' : far ? 'Beyond one full charge' : `~${r.pct}% battery`
  const tone = far ? 'no' : r.pct > 60 ? 'warn' : 'ok'
  const title = `${r.plug ? `Fits your ${esc(r.model)}. ` : ''}${far ? 'Further than one full charge.' : r.pct != null ? `About ${r.pct}% of a full battery to get there.` : ''}`
  return `<span class="reach ${tone}" title="${title}">${ic(far ? 'info' : r.plug ? 'check' : 'batteryBolt', 13)}${r.plug ? `Fits ${car}${text ? ' · ' : ''}` : ''}${text}</span>`
}
const fmtDist = (km) => (km == null ? '' : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`)

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
function hoursNow(h) {
  if (!h) return { open: null, text: 'Hours not listed' }
  if (h.is24Hours) return { open: true, text: 'Open 24 hours' }
  const now = new Date()
  const d = h[DAYS[now.getDay()]]
  if (!d || d.isClosed) return { open: false, text: 'Closed today' }
  const t = now.getHours() * 60 + now.getMinutes()
  const m = (s) => +s.slice(0, 2) * 60 + +s.slice(3)
  if (t >= m(d.open) && t < m(d.close)) return { open: true, text: `Open · closes ${d.close}` }
  return { open: false, text: t < m(d.open) ? `Closed · opens ${d.open}` : 'Closed for today' }
}

const AMEN = {
  restaurant: ['fork', 'Restaurant'], cafe: ['coffee', 'Café'], washroom: ['door', 'Washroom'], wifi: ['wifi', 'Wi-Fi'],
  parking: ['parking', 'Parking'], prayer: ['moon', 'Prayer room'], shopping: ['bag', 'Shopping'], hotel: ['bed', 'Hotel'],
}

// ─── Cars ──────────────────────────────────────────────────────────
const KIND = { EV: 'Fully electric', PHEV: 'Plug-in hybrid', Hybrid: 'Hybrid', REEV: 'Range extender' }
const carRange = (c) => c.range ?? c.eRange
const carStage = (c, cls = '', style = '') => `<div class="stage-img ${cls}"${style ? ` style="${style}"` : ''}><img src="${img(c.image)}" alt="" loading="lazy"></div>`
const isPlugIn = (c) => c && c.category !== 'Hybrid' && c.battery

// ─── Charging maths (ported from src/lib/charging-time.ts) ─────────
const EFF = { ac: 0.9, dc: 0.95 }
function dcTaper(soc) {
  if (soc <= 50) return 0.9
  if (soc <= 80) return 0.9 + (0.6 - 0.9) * ((soc - 50) / 30)
  return 0.6 + (0.15 - 0.6) * ((soc - 80) / 20)
}
function dcMinutes(kwh, kw, from, to) {
  let h = 0
  for (let soc = from; soc < to; soc += 0.5) {
    const w = Math.min(0.5, to - soc)
    h += (kwh * w) / 100 / EFF.dc / (kw * dcTaper(soc + w / 2))
  }
  return h * 60
}
function roundMinutes(m) {
  if (!Number.isFinite(m) || m <= 0) return 0
  const step = m < 15 ? 1 : m < 120 ? 5 : 10
  return Math.max(step, Math.round(m / step) * step)
}
function fmtDur(m) {
  if (!Number.isFinite(m) || m < 0) return '—'
  if (m < 1) return 'Under a minute'
  const r = roundMinutes(m), h = Math.floor(r / 60), mm = r % 60
  return h === 0 ? `${mm} min` : mm === 0 ? `${h}h` : `${h}h ${mm}m`
}
function estimateCharge({ kwh, from, to, mode, chargerKw, carKw, rate }) {
  if (!(kwh > 0)) return { ok: false, msg: 'This car has no battery figure in the catalogue.' }
  if (to <= from) return { ok: false, msg: 'Set a target above your current charge.' }
  if (!(chargerKw > 0)) return { ok: false, msg: 'Choose a charger power above 0 kW.' }
  if (chargerKw > 400) return { ok: false, msg: 'Enter a charger power up to 400 kW — check the figure printed on the charger.' }
  const carKnown = carKw > 0
  const kw = carKnown ? Math.min(chargerKw, carKw) : chargerKw
  const limitedBy = !carKnown ? 'unknown' : carKw < chargerKw ? 'car' : carKw === chargerKw ? 'matched' : 'charger'
  const energy = (kwh * (to - from)) / 100
  const grid = energy / EFF[mode]
  let minutes, split = null
  if (mode === 'ac') minutes = (grid / kw) * 60
  else {
    minutes = dcMinutes(kwh, kw, from, to)
    if (to > 80 && from < 80) {
      const total = roundMinutes(minutes)
      const first = Math.min(roundMinutes(dcMinutes(kwh, kw, from, 80)), total)
      split = { to80: first, past80: Math.max(0, total - first) }
    }
  }
  return { ok: true, minutes, energy, grid, kw, limitedBy, cost: rate > 0 ? grid * rate : null, split }
}
const fmtKwh = (k) => (k > 0 && k < 0.1 ? `${k.toFixed(2)} kWh` : `${k < 10 ? k.toFixed(1) : n0(k)} kWh`)
const fmtRs = (a) => `Rs ${n0(a)}`
function rangeAdded(range, from, to) {
  if (!(range > 0) || to <= from) return null
  const km = (range * (to - from)) / 100, step = km < 100 ? 5 : 10
  return Math.max(step, Math.round(km / step) * step)
}
function readyAt(minutes) {
  if (!(minutes > 0)) return null
  const now = new Date(), end = new Date(now.getTime() + roundMinutes(minutes) * 6e4)
  const t = end.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
  return end.getDate() !== now.getDate() ? `${t} tomorrow` : t
}

// ─── Range standards (ported from src/lib/range-standards.ts) ──────
const STD = {
  WLTP: { name: 'Worldwide Harmonised Light Vehicles Test Procedure', region: 'Europe, UK and many exports', gist: 'A 30-minute lab drive from city crawl to 131 km/h, at 23°C.', v: [1, 1, 1] },
  EPA: { name: 'US Environmental Protection Agency rating', region: 'United States', gist: 'Several cycles, including fast and cold ones, then corrected down.', v: [0.87, 0.78, 0.98] },
  NEDC: { name: 'New European Driving Cycle', region: 'Older EU; some Chinese brochures', gist: 'A gentle, largely steady lab drive that WLTP replaced in 2017–18.', v: [1.22, 1.14, 1.33] },
  CLTC: { name: 'China Light-duty Vehicle Test Cycle', region: 'China and its exports', gist: 'A slow, stop-start city drive — average 29 km/h, a fifth of it idling.', v: [1.25, 1.18, 1.33] },
}
const STD_ORDER = ['WLTP', 'EPA', 'NEDC', 'CLTC']
function roundKm(km) {
  if (!Number.isFinite(km) || km <= 0) return 0
  const step = km < 50 ? 1 : km < 200 ? 5 : 10
  return Math.max(1, Math.round(km / step) * step)
}
function convertRange(km, from) {
  if (!(km >= 20)) return null
  const [st, sl, sh] = STD[from].v
  return STD_ORDER.map((to) => {
    if (to === from) return { std: to, quoted: true, t: km, lo: km, hi: km }
    const [dt, dl, dh] = STD[to].v
    return { std: to, quoted: false, t: roundKm((km * dt) / st), lo: roundKm((km * dl) / sh), hi: roundKm((km * dh) / sl) }
  })
}
const SCEN = [
  { id: 'mixed', icon: 'route', title: 'Everyday mixed driving', cond: 'City and open road, moderate weather', s: [0.79, 0.73, 0.86], basis: 'Observed range of 15 EVs in mixed driving' },
  { id: 'summer', icon: 'thermo', title: 'A Pakistani summer, AC running', cond: 'Same driving at 35°C and above, cabin cooled', s: [0.79 * 0.83, 0.73 * 0.83, 0.86 * 0.83], basis: 'The above, less the 17% AAA measured at 35°C with AC' },
  { id: 'motorway', icon: 'gauge', title: 'Motorway at 120 km/h', cond: 'Sustained high speed, e.g. Lahore–Islamabad on the M-2', s: [0.7, 0.6, 0.8], basis: '57 EVs range-tested at a steady 130 km/h' },
]
function roadEstimates(km, from) {
  if (!(km >= 20)) return null
  const [st, sl, sh] = STD[from].v
  const w = [km / st, km / sh, km / sl]
  return SCEN.map((sc) => ({ sc, t: roundKm(w[0] * sc.s[0]), lo: roundKm(w[1] * sc.s[1]), hi: roundKm(w[2] * sc.s[2]) }))
}

// ─── Routes (distances from src/lib/route-distances.ts) ────────────
const ROADS = [
  ['Islamabad', 'Lahore', 375], ['Lahore', 'Karachi', 1215], ['Karachi', 'Hyderabad', 165], ['Islamabad', 'Peshawar', 180],
  ['Lahore', 'Faisalabad', 140], ['Islamabad', 'Murree', 65], ['Lahore', 'Multan', 340], ['Lahore', 'Sialkot', 130],
  ['Karachi', 'Sukkur', 470], ['Islamabad', 'Abbottabad', 120], ['Islamabad', 'Multan', 545], ['Karachi', 'Multan', 890],
  ['Islamabad', 'Karachi', 1420], ['Lahore', 'Rawalpindi', 365], ['Islamabad', 'Gilgit', 590], ['Islamabad', 'Muzaffarabad', 140],
  ['Lahore', 'Gujranwala', 80], ['Karachi', 'Quetta', 690],
]
const POPULAR = [
  ['Islamabad', 'Lahore', 'M-2 motorway'], ['Lahore', 'Karachi', 'The long haul'], ['Islamabad', 'Peshawar', 'M-1 motorway'],
  ['Lahore', 'Faisalabad', 'M-3 motorway'], ['Karachi', 'Hyderabad', 'M-9 motorway'], ['Islamabad', 'Murree', 'Weekend hill run'],
]
const ROUTE_CITIES = [...new Set(ROADS.flatMap((r) => [r[0], r[1]]))].sort()
const roadKm = (a, b) => (ROADS.find((r) => (r[0] === a && r[1] === b) || (r[0] === b && r[1] === a)) || [])[2] ?? null
const driveMin = (km) => Math.round((km / 80) * 60)
const DERATE = 0.85, RESERVE = 10

/** A journey plan that only claims what the listed chargers and the car's own figures support. */
function planRoute(from, to, car, start) {
  const km = roadKm(from, to)
  if (!km) return { error: `We don't have a road distance for ${from} to ${to} yet. Try one of the popular routes.` }
  const base = { from, to, km, drive: driveMin(km), car, start }
  if (!car) return { ...base, kind: 'nocar' }
  if (!isPlugIn(car)) return { ...base, kind: 'hybrid' }
  const rated = carRange(car)
  if (!rated) return { ...base, kind: 'norange' }
  const kmPerPct = (rated * DERATE) / 100
  const need = km / kmPerPct
  const dest = D.stations.filter((s) => s.city === to)
  if (car.category !== 'EV') {
    const elecKm = Math.max(0, Math.floor(kmPerPct * (start - RESERVE)))
    return { ...base, kind: 'phev', elecKm: Math.min(elecKm, km), dest }
  }
  if (start - need >= RESERVE) return { ...base, kind: 'direct', arrive: Math.floor(start - need), dest }
  const reach = Math.floor(kmPerPct * (100 - RESERVE))
  if (need + RESERVE <= 100) {
    const target = Math.min(100, Math.ceil((need + RESERVE) / 5) * 5)
    const usable = D.stations
      .filter((s) => s.city === from)
      .map((s) => {
        const c = s.connectors.filter((c) => fits(car, c.type) !== false).sort((a, b) => (CONN[b.type].dc && car.dc ? b.kw : 0) - (CONN[a.type].dc && car.dc ? a.kw : 0) || b.kw - a.kw)[0]
        return c ? { s, c } : null
      })
      .filter(Boolean)
      .sort((a, b) => b.c.kw - a.c.kw)[0]
    if (usable) {
      const mode = CONN[usable.c.type].dc && car.dc ? 'dc' : 'ac'
      const est = estimateCharge({ kwh: car.battery, from: start, to: target, mode, chargerKw: usable.c.kw, carKw: mode === 'dc' ? car.dc : car.ac, rate: 50 })
      return { ...base, kind: 'topup', target, station: usable.s, conn: usable.c, mode, est, arrive: Math.floor(target - need), dest }
    }
    const est = estimateCharge({ kwh: car.battery, from: start, to: target, mode: 'ac', chargerKw: 7.4, carKw: car.ac, rate: 50 })
    return { ...base, kind: 'tophome', target, est, arrive: Math.floor(target - need), dest }
  }
  return { ...base, kind: 'gap', reach, need, dest }
}

// ─── State ─────────────────────────────────────────────────────────
const KEY = 'plugpk-app-v1'
const DEFAULT = {
  onboarded: false, user: null, theme: 'system', city: 'Lahore',
  // No car until the person picks one: a pre-filled Atto 3 showed up as
  // already chosen on the onboarding car picker.
  garage: [], primary: null,
  saved: [], routes: [], fav: [], compare: [], liked: {}, myReviews: [], myPosts: [], myComments: {}, clubs: [],
  savedPosts: [], votes: {},
  notif: { routes: true, community: true, news: false, offers: false }, seenNotif: false,
}
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}
let S = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), load())
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)) } catch { /* storage blocked: the session still works */ }
}
const myCar = () => carBySlug(S.primary)
const firstName = () => (S.user?.name || '').split(' ')[0]

// Per-session UI state, never saved.
const U = {
  stack: [{ s: 'home' }], dir: '', sheet: null, sheetAnim: false, onbStep: 0, authMode: 'signup', pick: null, pickQ: '',
  map: { sel: null, view: 'map', conn: [], speed: 0, amen: [], q: '', z: 1, x: 0, y: 0, fitted: null },
  cars: { q: '', cat: 'all', brand: null, sort: 'price-asc' },
  comm: { cat: 'all', sort: 'latest', q: '' },
  svc: { cat: 'all', city: 'all' },
  calc: { slug: null, mode: 'dc', from: 20, to: 80, kw: 60, custom: '', rate: '50' },
  rng: { km: '410', std: 'NEDC' },
  route: { from: 'Lahore', to: 'Islamabad', start: 90, slug: null },
  search: '',
  draft: { title: '', body: '', cat: 'general' },
  review: { rating: 0, text: '' },
}

// ─── Theme ─────────────────────────────────────────────────────────
const HOST_THEME = document.documentElement.getAttribute('data-theme')
function applyTheme() {
  const r = document.documentElement
  if (S.theme === 'system') HOST_THEME ? r.setAttribute('data-theme', HOST_THEME) : r.removeAttribute('data-theme')
  else r.setAttribute('data-theme', S.theme)
  const meta = $('meta[name="theme-color"]')
  if (meta) meta.content = isDark() ? '#08110F' : '#05241E'
}
function isDark() {
  const a = document.documentElement.getAttribute('data-theme')
  return a ? a === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => S.theme === 'system' && render())

// ─── Render loop ───────────────────────────────────────────────────
const SCREENS = {}
const SHEETS = {}
const A = {} // click actions:  data-a="name" data-v="value"
const IN = {} // input handlers: data-in="name"

const cur = () => U.stack[U.stack.length - 1]
function view() {
  if (!S.onboarded) return SCREENS.onboarding()
  const t = cur()
  return (SCREENS[t.s] || SCREENS.home)(t)
}
let rendered = null
function render() {
  applyTheme()
  // Lets CSS drop costly effects (backdrop blur) while the live map is showing.
  $("#app").classList.toggle("on-map", cur().s === "map")
  const host = $('#screen')
  const old = host.firstElementChild
  if (old && rendered) {
    const sc = old.querySelector('.scroll')
    if (sc) rendered.scroll = sc.scrollTop
  }
  const a = document.activeElement
  const focus = a && a.id && host.contains(a) ? { id: a.id, s: a.selectionStart, e: a.selectionEnd } : null
  const v = view()
  host.innerHTML = `<div class="screen ${U.dir} ${v.tabs ? 'has-tabs' : ''}">${v.html}</div>`
  U.dir = ''
  rendered = S.onboarded ? cur() : null
  const sc = host.querySelector('.scroll')
  if (sc && rendered?.scroll) sc.scrollTop = rendered.scroll
  if (focus) {
    const el = document.getElementById(focus.id)
    if (el) { el.focus({ preventScroll: true }); try { el.setSelectionRange(focus.s, focus.e) } catch { /* not a text field */ } }
  }
  $('#tabs').innerHTML = v.tabs ? tabbar(cur().s) : ''
  $('#statusbar').classList.toggle('on-dark', v.sb === 'light')
  polish(host)
  v.after?.()
  renderSheet()
}
/** Small finishing touches on every screen: header hairline on scroll, images fade in. */
function polish(host) {
  const bar = host.querySelector('.topbar'), sc = host.querySelector('.scroll')
  if (bar && sc) {
    const f = () => bar.classList.toggle('scrolled', sc.scrollTop > 4)
    sc.addEventListener('scroll', f, { passive: true })
    f()
  }
  // A sticky bar pins just under the status bar; once it does, a backing fades in behind the clock so text never runs under it.
  const stick = host.querySelector('[data-stick]'), scrim = host.querySelector('.sb-scrim')
  if (stick && scrim && sc) {
    const sb = $('#statusbar'), dark = sb.classList.contains('on-dark')
    const g = () => {
      const stuck = stick.getBoundingClientRect().top - sc.getBoundingClientRect().top <= scrim.offsetHeight + 0.5
      scrim.classList.toggle('on', stuck)
      stick.classList.toggle('stuck', stuck)
      sb.classList.toggle('on-dark', dark && !stuck)
    }
    sc.addEventListener('scroll', g, { passive: true })
    g()
  }
  host.querySelectorAll('img').forEach((i) => {
    if (i.complete) return
    i.classList.add('ld')
    const done = () => i.classList.remove('ld')
    i.addEventListener('load', done, { once: true })
    i.addEventListener('error', done, { once: true })
  })
}
/** Re-render only the named [data-part] regions of the current screen (keeps sliders and focus alive). */
function renderPart(...names) {
  const v = view()
  const t = document.createElement('div')
  t.innerHTML = v.html
  for (const n of names) {
    const live = $(`#screen [data-part="${n}"]`), fresh = t.querySelector(`[data-part="${n}"]`)
    if (live && fresh) live.innerHTML = fresh.innerHTML
  }
  v.afterPart?.()
}
function go(s, params = {}) {
  U.stack.push({ s, ...params })
  U.dir = 'fwd'
  U.sheet = null
  render()
}
function back() {
  if (U.sheet) return closeSheet()
  if (U.stack.length > 1) { U.stack.pop(); U.dir = 'back'; render() }
}
function tab(s) {
  if (U.stack.length === 1 && cur().s === s) {
    const sc = $('#screen .scroll')
    if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  // Opening Stations plays the country-to-city fly-in (screens-map.js).
  if (s === 'map') U.map.intro = true
  U.stack = [{ s }]
  U.dir = 'fade'
  U.sheet = null
  render()
}
// Four tabs, in order of how often they are used. Map is labelled Stations
// because finding a charger is what the screen is for; Cars left the bar (it
// is browsed before buying, not daily) and stays one tap away on Home and in search.
const TABS = [['home', 'home', 'Home'], ['map', 'station', 'Stations'], ['routes', 'route', 'Routes'], ['community', 'users', 'Community']]
function tabbar(cur) {
  return `<nav class="tabbar" aria-label="Primary">${TABS.map(([s, i, l]) => `<button class="tab ${cur === s ? 'on' : ''}" data-a="tab" data-v="${s}" ${cur === s ? 'aria-current="page"' : ''}><span class="pill">${ic(i, 22)}</span>${l}</button>`).join('')}</nav>`
}

function openSheet(t, extra = {}) {
  U.sheet = { t, ...extra }
  U.sheetAnim = true
  renderSheet()
}
function closeSheet() {
  U.sheet = null
  renderSheet()
}
function renderSheet() {
  const h = $('#sheet')
  if (!U.sheet) { h.innerHTML = ''; return }
  const s = SHEETS[U.sheet.t](U.sheet)
  const body = $('#sheet .sheet-body')
  const keep = body && !U.sheetAnim ? body.scrollTop : 0
  h.innerHTML = `<div class="backdrop" data-a="closeSheet"></div>
    <div class="sheet ${U.sheetAnim ? 'anim' : ''} ${s.full ? 'full' : ''}" role="dialog" aria-modal="true" aria-label="${esc(s.title)}">
      <div class="grab"></div>
      <div class="sheet-head"><h2>${s.title}</h2><button class="icon-btn" data-a="closeSheet" aria-label="Close">${ic('x', 22)}</button></div>
      <div class="sheet-body">${s.body}</div>
      ${s.foot ? `<div class="sheet-foot">${s.foot}</div>` : ''}
    </div>`
  if (keep) $('#sheet .sheet-body').scrollTop = keep
  U.sheetAnim = false
  s.after?.()
}

let toastTimer
function toast(msg, icon = 'check') {
  const w = $('#toast')
  w.innerHTML = `<div class="toast-wrap" role="status"><div class="toast">${ic(icon, 18)}<span>${esc(msg)}</span></div></div>`
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    const t = w.querySelector('.toast')
    if (t) { t.classList.add('out'); setTimeout(() => (w.innerHTML = ''), 260) }
  }, 2400)
}
async function copyText(text, done = 'Copied') {
  try { await navigator.clipboard.writeText(text); toast(done, 'copy') } catch { toast('Copy isn’t allowed here — select the text instead', 'info') }
}

// ─── Shared actions ────────────────────────────────────────────────
Object.assign(A, {
  tab: (v) => tab(v),
  back: () => back(),
  go: (v, el) => go(v, { ...el.dataset, a: undefined, v: undefined }),
  closeSheet: () => closeSheet(),
  sheet: (v, el) => openSheet(v, { ...el.dataset }),
  theme: (v) => { S.theme = v; save(); render(); toast(v === 'system' ? 'Following your device' : v === 'dark' ? 'Dark mode on' : 'Light mode on', v === 'dark' ? 'moon' : v === 'light' ? 'sun' : 'monitor') },
  save: (id) => {
    const on = S.saved.includes(id)
    S.saved = on ? S.saved.filter((x) => x !== id) : [id, ...S.saved]
    save(); render(); toast(on ? 'Removed from saved' : 'Saved to your stations', 'bookmark')
  },
  fav: (slug) => {
    const on = S.fav.includes(slug)
    S.fav = on ? S.fav.filter((x) => x !== slug) : [slug, ...S.fav]
    save(); render(); toast(on ? 'Removed from favourites' : 'Added to favourites', 'heart')
  },
  compare: (slug) => {
    const on = S.compare.includes(slug)
    if (!on && S.compare.length >= 3) return toast('Compare up to 3 cars — remove one first', 'info')
    S.compare = on ? S.compare.filter((x) => x !== slug) : [...S.compare, slug]
    save(); render()
  },
  copy: (v) => copyText(v),
  // Choosing a city by hand switches GPS off: distances then come from that city.
  city: (v) => { S.city = v; U.gps = null; U.map.sel = null; U.map.fitted = null; save(); closeSheet(); render() },
  noop: () => {},
})

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-a]')
  if (!t) return
  const fn = A[t.dataset.a]
  if (!fn) return
  if (t.tagName !== 'A') e.preventDefault()
  fn(t.dataset.v, t, e)
})
document.addEventListener('input', (e) => {
  const t = e.target.closest('[data-in]')
  if (t && IN[t.dataset.in]) IN[t.dataset.in](t.value, t, e)
})
document.addEventListener('change', (e) => {
  const t = e.target.closest('[data-ch]')
  if (t && IN[t.dataset.ch]) IN[t.dataset.ch](t.value, t, e)
})
document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-submit]')
  if (!f) return
  e.preventDefault()
  A[f.dataset.submit]?.(null, f, e)
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') back()
})

// ─── Install as an app ─────────────────────────────────────────────
// Chrome and Edge offer their own install dialog (beforeinstallprompt), which
// the "Install" button opens. iOS has none, so the app shows the two taps
// (Share, Add to Home Screen) instead. Hidden once installed or dismissed.
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  U.installEvt = e
  if (document.readyState === 'complete') render()
})
window.addEventListener('appinstalled', () => {
  U.installEvt = null
  S.installDismissed = true
  save()
  toast('plug.pk is on your home screen')
  render()
})
const canInstall = () => !isStandalone() && (U.installEvt || isIos())

function installCard() {
  if (!canInstall() || S.installDismissed) return ''
  return `<div class="install-card">
    <img src="icons/icon-192.png" alt="" width="44" height="44">
    <div class="grow"><b>Install plug.pk</b><span>Full screen and works offline</span></div>
    <button class="btn btn-sm btn-primary" data-a="installApp">Install</button>
    <button class="icon-btn sm" data-a="dismissInstall" aria-label="Not now">${ic('x', 16)}</button>
  </div>`
}

Object.assign(A, {
  installApp: async () => {
    if (U.installEvt) {
      const evt = U.installEvt
      U.installEvt = null
      evt.prompt()
      await evt.userChoice.catch(() => null)
      render()
    } else if (isIos()) openSheet('installIos')
  },
  dismissInstall: () => { S.installDismissed = true; save(); render() },
})

// ─── Profile photo ────────────────────────────────────────────────────
// Kept on this phone with the account (S.user.photo): cropped to a square and
// shrunk to 256px, a JPEG of about 20 KB, so it fits easily in saved state.
const myPhoto = () => S.user?.photo || null
// The signed-in user's avatar contents: their photo, else their initial.
function meAvatar(iconSize = 20) {
  if (myPhoto()) return `<img class="avatar-img" src="${myPhoto()}" alt="">`
  return S.user ? initial(S.user.name) : ic('user', iconSize)
}

function shrinkPhoto(file, size = 256) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      // Cover crop from the middle, so a portrait or landscape photo fills the circle.
      const side = Math.min(img.naturalWidth, img.naturalHeight)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable image')) }
    img.src = url
  })
}

SHEETS.photo = () => ({
  title: 'Profile photo',
  body: `<div class="photo-preview">${myPhoto() ? `<img src="${myPhoto()}" alt="Your current photo">` : `<span>${S.user ? initial(S.user.name) : ic('user', 40)}</span>`}</div>
    <div class="list mt-16">
      <button class="list-row" data-a="pickPhoto"><span class="ico">${ic('image', 18)}</span><span class="grow"><b class="t15">Choose from gallery</b></span>${ic('chevR', 18)}</button>
      <button class="list-row" data-a="pickPhoto" data-v="camera"><span class="ico">${ic('camera', 18)}</span><span class="grow"><b class="t15">Take a photo</b></span>${ic('chevR', 18)}</button>
      ${myPhoto() ? `<button class="list-row" data-a="removePhoto"><span class="ico" style="color:var(--danger, #C2410C)">${ic('trash', 18)}</span><span class="grow"><b class="t15" style="color:var(--danger, #C2410C)">Remove photo</b></span></button>` : ''}
    </div>`,
})

Object.assign(A, {
  pickPhoto: (v) => {
    if (!S.user) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    // Opens the front camera straight away on a phone; ignored on a computer.
    if (v === 'camera') input.setAttribute('capture', 'user')
    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) return toast('That file is not a photo', 'info')
      try {
        S.user.photo = await shrinkPhoto(file)
        save(); closeSheet(); render()
        toast('Profile photo updated')
      } catch {
        toast('Could not read that photo, try another', 'info')
      }
    })
    input.click()
  },
  removePhoto: () => {
    if (!S.user) return
    delete S.user.photo
    save(); closeSheet(); render()
    toast('Photo removed')
  },
})

SHEETS.installIos = () => ({
  title: 'Add plug.pk to your Home Screen',
  body: `<ol class="install-steps">
      <li><span class="n">1</span><span>Tap ${ic('share', 18)} <b>Share</b> in Safari’s toolbar.</span></li>
      <li><span class="n">2</span><span>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</span></li>
    </ol>
    <p class="t13 muted mt-12">plug.pk then opens full screen from its own icon, like any other app.</p>`,
})
