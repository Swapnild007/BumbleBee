const CACHE_NAME = 'jarvis-personal-intelligence-v26';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './training/intents.json'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Always try the network first for page navigations so GitHub Pages updates
  // are not hidden behind a previously cached index.html.
  if (request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/BumbleBee/')) {
    event.respondWith(fetch(request, { cache: 'no-store' }).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put('./index.html', copy.clone());
          cache.put('./', copy);
        });
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match('./index.html') || await caches.match('./');
      return cached || new Response('JARVIS is offline and no cached page is available.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }));
    return;
  }
  event.respondWith(caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(() => new Response('Offline resource unavailable', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
  }));
});
