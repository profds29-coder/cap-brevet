/* Service worker de Cap Brevet : garde l'application en mémoire pour qu'elle marche sans connexion.
   La version (VERSION) change à chaque construction : l'ancienne copie est alors remplacée. */
const VERSION = '__VERSION__';
const CACHE = 'capbrevet-' + VERSION;
const FICHIERS = __FICHIERS__;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(cles => Promise.all(cles.filter(k => k.startsWith('capbrevet-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* D'abord la copie locale (rapide, hors connexion), sinon le réseau. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(rep => rep ||
      fetch(e.request).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
  );
});
