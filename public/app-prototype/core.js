// plug.pk app prototype — core: data, icons, maths, state and the render loop.
// Plain JavaScript, no build step. Screens live in screens-*.js.
'use strict'

const D = window.PLUG_DATA
// Served by the website at /app-prototype, images sit at /images. Anywhere else
// (a published preview), they are published next to the page.
const IMG = location.pathname.startsWith('/app-prototype') ? '/images/' : 'images/'
const img = (p) => (p ? IMG + p : '')

// ─── Small helpers ─────────────────────────────────────────────────
const $ = (s, r = document) => r.querySelector(s)
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

// ─── Icons (24px grid, stroke) ─────────────────────────────────────
const P = {
  home: '<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>',
  map: '<path d="M9 4 3.5 6.5v13.5L9 17.5l6 2.5 5.5-2.5V4L15 6.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  pin: '<path d="M12 21.5s-7-6.2-7-11.7a7 7 0 0 1 14 0c0 5.5-7 11.7-7 11.7z"/><circle cx="12" cy="9.8" r="2.6"/>',
  route: '<circle cx="6" cy="18.5" r="2.5"/><circle cx="18" cy="5.5" r="2.5"/><path d="M8.5 18.5H17a3.5 3.5 0 0 0 0-7H7a3.5 3.5 0 0 1 0-7h8.5"/>',
  car: '<path d="M5 17H3.5a1 1 0 0 1-1-1v-3.3a2 2 0 0 1 .4-1.2L5 8.6a2 2 0 0 1 1.6-.8h10.8a2 2 0 0 1 1.6.8l2.1 2.9a2 2 0 0 1 .4 1.2V16a1 1 0 0 1-1 1H19"/><path d="M9 17h6M5.5 11.5h13"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  nav: '<path d="M3.5 11 20.5 3.5 13 20.5l-2-7.5z"/>',
  locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  bookmark: '<path d="M6 3.5h12V21l-6-4-6 4z"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  heart: '<path d="M12 20s-8-4.7-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.3 12 20 12 20z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  bolt: '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"/>',
  plug: '<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5"/>',
  battery: '<rect x="2.5" y="7" width="17" height="10" rx="2.5"/><path d="M22 11v2M6 10.5v3M9.5 10.5v3"/>',
  gauge: '<path d="M4 18a9 9 0 1 1 16 0"/><path d="m12 14 4-5"/>',
  compare: '<path d="M7 4 3 8l4 4M3 8h14M17 12l4 4-4 4M21 16H7"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  rows: '<rect x="4" y="4" width="16" height="7" rx="1.5"/><rect x="4" y="13" width="16" height="7" rx="1.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  building: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M2 21h20M8 8h3M8 12h3M8 16h3"/>',
  handshake: '<path d="m11 17 2 2a1.4 1.4 0 0 0 2-2"/><path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2l-3-3.1a2 2 0 0 0-2.8 0l-.9.9a1.4 1.4 0 0 1-2-2L12.6 7a3 3 0 0 1 3.9-.3L17 7h4v8h-2M3 7h4l1 1M3 7v8h2l3.5 3.5a1.4 1.4 0 0 0 2-2"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.8h.01"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  arrowL: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  arrowR: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  arrowUR: '<path d="M7 17 17 7M8 7h9v9"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  fork: '<path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 21V3c-2.5 1-4 3.5-4 7v3h4"/>',
  coffee: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>',
  door: '<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18M14 12h.01"/>',
  wifi: '<path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/>',
  parking: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M9.5 17V7h3.5a3 3 0 0 1 0 6H9.5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  bag: '<path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
  bed: '<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="2"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  phone: '<path d="M21.5 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.6 4.2 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L7.5 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.9 2.1z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  swap: '<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  package: '<path d="M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>',
  buoy: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m5.6 5.6 3.6 3.6M14.8 14.8l3.6 3.6M14.8 9.2l3.6-3.6M5.6 18.4l3.6-3.6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  pencil: '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  calc: '<rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M8 6.5h8M8 11h.01M12 11h.01M16 11h.01M8 14.5h.01M12 14.5h.01M16 14.5v3.5M8 18h.01M12 18h.01"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  sort: '<path d="M3 6h18M6 12h12M10 18h4"/>',
  // Home shortcuts: drawn for their job rather than borrowed.
  station: '<rect x="3.5" y="3" width="10" height="18" rx="2"/><path d="M3.5 21h10M13.5 9.5h2a2 2 0 0 1 2 2v4.5a1.5 1.5 0 0 0 3 0V8.5L18 6"/><path d="m9.5 7-2.5 4h3.5L8 15"/>',
  trip: '<circle cx="6" cy="19" r="2.2"/><path d="M8.2 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h5"/><path d="M18.5 2.5a3 3 0 0 0-3 3c0 2.2 3 4.8 3 4.8s3-2.6 3-4.8a3 3 0 0 0-3-3z"/><circle cx="18.5" cy="5.5" r=".6"/>',
  batteryBolt: '<rect x="2.5" y="6.5" width="16.5" height="11" rx="2.8"/><path d="M22 10.5v3"/><path d="m11.5 8.8-2.8 3.4h3.6l-2.8 3.4"/>',
  speedo: '<path d="M3.6 18.5a9 9 0 1 1 16.8 0"/><path d="M12 15.5l4-4"/><circle cx="12" cy="15.5" r="1.5"/><path d="M12 6.5V8M6.3 9.3l1 1M17.7 9.3l-1 1M4.6 14.5H6M18 14.5h1.4"/>',
  sedan: '<path d="M3 15.5v-2.6l2-4.1a2 2 0 0 1 1.8-1.1h7.7a2 2 0 0 1 1.5.7l3 3.6 1.6.6a1.5 1.5 0 0 1 .9 1.4v1.5"/><path d="M3 15.5h2M9 15.5h6M19 15.5h2M4.5 12h15"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/>',
  store: '<path d="M3.5 9.5 5 4h14l1.5 5.5"/><path d="M3.5 9.5a2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.6 0"/><path d="M5 12.5V20h14v-7.5M10 20v-4.5h4V20"/>',
  people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5a6 6 0 0 1 12 0"/><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14a6 6 0 0 1 3.5 5.5"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 5.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  thermo: '<path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 5-9 16-9 0 11-3 16-9 16zM4 20c4-4 7-6 11-8"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  dots: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
}
function ic(name, size = 20, opt = {}) {
  const fill = opt.fill ? 'currentColor' : 'none'
  return `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="${opt.sw || 1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`
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
const CITIES_WITH_STATIONS = Object.keys(CITY)
function haversine([a, b], [c, d]) {
  const R = 6371, r = Math.PI / 180
  const x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}
const stDist = (s) => (CITY[s.city] ? haversine(CITY[s.city].me, [s.lat, s.lng]) * 1.25 : null) // road factor
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
  garage: ['byd-atto-3-advanced'], primary: 'byd-atto-3-advanced',
  saved: [], routes: [], fav: [], compare: [], liked: {}, myReviews: [], myPosts: [], myComments: {}, clubs: [],
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
  U.stack = [{ s }]
  U.dir = 'fade'
  U.sheet = null
  render()
}
const TABS = [['home', 'home', 'Home'], ['map', 'map', 'Map'], ['routes', 'route', 'Routes'], ['cars', 'car', 'Cars'], ['community', 'users', 'Community']]
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
  flipTheme: () => A.theme(isDark() ? 'light' : 'dark'),
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
  city: (v) => { S.city = v; U.map.sel = null; U.map.fitted = null; save(); closeSheet(); render() },
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
