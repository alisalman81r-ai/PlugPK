// public/app-prototype/sw.js — makes the installed app open instantly and work offline.
//
// App files (HTML, CSS, JS, data): network first, so a new version shows up on
// the next launch, with the cached copy as the offline fallback. Photos, fonts
// and the map library: cache first, they never change under the same address.
// Map tiles are left alone — caching a city's worth would fill the phone —
// but the map's style, fonts and sprites are cached.

// Bump when the shell list changes; the old cache is deleted on activate.
const CACHE = 'plugpk-app-v2'
const SHELL = [
  './index.html', './app.css', './icons.js', './data.js', './core.js',
  './screens-home.js', './screens-map.js', './screens-drive.js', './screens-more.js', './screens-community.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
]
const TILE_HOSTS = ['tiles.openfreemap.org']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('plugpk-app-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

async function networkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    // no-cache: always revalidate with the server, so a stylesheet updated
    // alongside a script can never be served from an older copy.
    // (A navigation request cannot take options; the page itself is sent with
    // max-age=0 and revalidated anyway.)
    const response = await fetch(request.mode === 'navigate' ? request : new Request(request, { cache: 'no-cache' }))
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    // An offline launch asks for the page itself: serve the cached shell.
    if (request.mode === 'navigate') return (await cache.match('./index.html')) || Response.error()
    return Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // The map's style, fonts and sprites never change under the same address:
  // cache them, so reopening Stations does not fetch them again. The tiles
  // themselves (/planet/…) are left to the browser.
  if (TILE_HOSTS.includes(url.hostname)) {
    if (!url.pathname.startsWith('/planet')) event.respondWith(cacheFirst(request))
    return
  }

  const sameOrigin = url.origin === self.location.origin
  const appFile = sameOrigin && url.pathname.startsWith('/app-prototype/')
  if (request.mode === 'navigate' || appFile) return event.respondWith(networkFirst(request))

  const asset =
    (sameOrigin && (url.pathname.startsWith('/images/') || url.pathname.startsWith('/_next/image'))) ||
    url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'cdn.jsdelivr.net'
  if (asset) event.respondWith(cacheFirst(request))
})
