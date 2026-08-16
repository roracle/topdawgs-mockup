/* TopDawgs service worker — cache-first for the app shell so the
   prototype opens offline and qualifies as an installable PWA. */

const CACHE = 'topdawgs-v3';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/data.js',
  './js/icons.js',
  './js/social.js',
  './js/app.js',
  './assets/logo.webp',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/photos/trail.svg',
  './assets/photos/gym.svg',
  './assets/photos/diner.svg',
  './assets/photos/cabin.svg',
  './assets/photos/night.svg',
  './assets/photos/pier.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll rejects the whole batch if any single file 404s, so add
      // them individually and tolerate misses.
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let fonts/CDNs go to network

  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) {
        // Refresh the cache in the background for next time.
        fetch(req).then(res => {
          if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
        }).catch(() => {});
        return hit;
      }
      return fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
