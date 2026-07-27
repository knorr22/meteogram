// Minimal offline-capable service worker.
// The scope is derived from where this file is served (root in dev,
// /meteogram/ on GitHub Pages), so no base path is hardcoded.
const VERSION = 'meteogram-v1'
const BASE = new URL('./', self.location).pathname
const APP_SHELL = [BASE, BASE + 'index.html']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // Never cache API traffic — forecasts must stay fresh.
  if (url.hostname.endsWith('open-meteo.com')) return

  // SPA navigations: network first, fall back to the cached shell offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(BASE + 'index.html').then((r) => r || caches.match(BASE)))
    )
    return
  }

  // Same-origin static assets: cache first, then network (and cache it).
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(VERSION).then((c) => c.put(req, copy))
            return res
          })
      )
    )
  }
})
