const CACHE_NAME = 'cupid-arrow-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-512.png',
  '/src/main.tsx',
  '/src/index.css',
  '/src/components/ArrowAvoidGame.tsx'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});