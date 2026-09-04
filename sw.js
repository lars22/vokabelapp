// Service Worker für die Vokabel-App
// Sorgt dafür, dass die App (HTML/CSS/JS + Icons) auch OHNE Internetverbindung
// startet. Die eigentlichen Lerndaten laufen weiterhin über localStorage +
// die Supabase-Sync-Queue in index.html – das hier ist nur die "App-Hülle".

const CACHE_NAME = 'vokabeln-shell-v6';

// Alles, was für den reinen App-Start nötig ist. Bei Änderungen an diesen
// Dateien einfach CACHE_NAME hochzählen (z. B. -v7), damit der Browser
// den neuen Stand nachlädt statt den alten Cache weiterzuverwenden.
// Alle Sprachpakete stehen hier, damit ein Sprachwechsel auch offline
// funktioniert, selbst wenn diese Sprache noch nie aktiv genutzt wurde.
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './vocab-es.js',
  './vocab-fr.js',
  './vocab-it.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Strategie: "Cache, dann Netzwerk" für die App-Hülle.
// Supabase-API-Aufrufe (an *.supabase.co) laufen bewusst NICHT über den
// Cache, sondern direkt durch — die Offline-Behandlung dafür übernimmt
// die Sync-Queue in index.html, nicht der Service Worker.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes('supabase.co')) return; // API-Calls unangetastet lassen

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Erfolgreiche GETs zusätzlich in den Cache legen, für den nächsten Offline-Start
        if (event.request.method === 'GET' && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
