const CACHE_NAME = 'puzzle-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/game.html',
  '/css/style.css',
  '/js/api.js',
  '/js/dashboard.js',
  '/js/game.js',
  '/assets/icon.svg',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap'
];

// Install Event: Cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network first, fallback to cache for API requests. Cache first for assets.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Do not cache API requests
  if (url.pathname.includes('/api/') || url.pathname.includes('/uploads/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For static assets and HTML, Stale-While-Revalidate or Network fallback
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // If network fails and no cache, let it fail (or provide an offline page)
      });
      return cachedResponse || fetchPromise;
    })
  );
});
