const CACHE = 'turbo-race-v1';
const ARCHIVOS = [
  '/Juniors17904/',
  '/Juniors17904/index.html',
  '/Juniors17904/style.css',
  '/Juniors17904/game.js',
  '/Juniors17904/app.js',
  '/Juniors17904/supabase-client.js',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
