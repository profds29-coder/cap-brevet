/* Service worker de Cap Brevet : garde l'application en mémoire pour qu'elle marche sans connexion.
   La version (VERSION) change à chaque construction : l'ancienne copie est alors remplacée. */
const VERSION = '8c3a84cff4';
const CACHE = 'capbrevet-' + VERSION;
const FICHIERS = ["./", "fonts/AtkinsonHyperlegible-1.woff2", "fonts/AtkinsonHyperlegible-2.woff2", "fonts/AtkinsonHyperlegible-3.woff2", "fonts/AtkinsonHyperlegible-4.woff2", "fonts/AtkinsonHyperlegible-5.woff2", "fonts/AtkinsonHyperlegible-6.woff2", "fonts/BricolageGrotesque-7.woff2", "fonts/BricolageGrotesque-8.woff2", "fonts/polices.css", "icones/apple-touch-icon.png", "icones/icone-192.png", "icones/icone-512.png", "icones/icone-maskable-512.png", "icones/icone-maskable.svg", "icones/icone.svg", "index.html", "manifest.webmanifest"];

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
