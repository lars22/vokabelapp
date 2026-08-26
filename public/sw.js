// Service Worker für die Vokabel-App (React/Vite-Build).
// Da Vite die JS/CSS-Dateien beim Build hasht (z. B. index-a1b2c3.js), kann
// hier keine feste Dateiliste vorab gecacht werden. Stattdessen: Runtime-
// Caching – jede erfolgreich geladene Datei (HTML, gehashtes JS/CSS,
// Font-Awesome) wird beim ersten (Online-)Besuch automatisch in den Cache
// gelegt und danach auch offline aus dem Cache bedient.
//
// Praktisch heißt das: Einmal die App mit Internet öffnen (z. B. direkt
// nach dem Deploy), danach startet sie auch im Flugmodus. Nach jedem neuen
// Deploy (neue Datei-Hashes) muss die App einmal online geöffnet werden,
// damit der Cache aktualisiert wird.

const CACHE_NAME = 'vokabeln-shell-v1';

self.addEventListener('install', () => {
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

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // API-Aufrufe an Supabase nie über den Cache leiten – Offline-Handling
  // dafür übernimmt die Sync-Queue in der App, nicht der Service Worker.
  if (url.includes('supabase.co')) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // offline & kein Cache-Treffer -> Fehler durchreichen

      // Cache-first, damit die App sofort (auch offline) startet;
      // im Hintergrund trotzdem aktualisieren, wenn online.
      return cached || networkFetch;
    })
  );
});
