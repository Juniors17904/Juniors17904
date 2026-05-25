const CACHE = 'turbo-race-v3';
const ARCHIVOS = [
  '/',
  '/index.html',
  '/style.css',
  '/game.js',
  '/app.js',
  '/garage.js',
  '/supabase-client.js',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
