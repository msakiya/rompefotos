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

// Fetch Event: Handle offline API requests and asset caching
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Handle /uploads/ images (cache them like static assets)
  if (url.pathname.includes('/uploads/')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        }).catch(() => {});
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Handle /api/ requests
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        // If it's a GET request (like getting the gallery), cache it!
        if (event.request.method === 'GET' && networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      }).catch(async (error) => {
        // WE ARE OFFLINE
        
        // If GET gallery, return cached version
        if (event.request.method === 'GET') {
          const cached = await caches.match(event.request);
          if (cached) return cached;
        }

        // If checking auth (POST checkAuth), pretend we are logged in so they can play
        if (url.pathname.includes('auth.php') && url.searchParams.get('action') === 'check') {
           return new Response(JSON.stringify({ status: 'success', logged_in: true }), {
             headers: { 'Content-Type': 'application/json' }
           });
        }

        // Return a generic offline error for other POSTs (uploading, saving score)
        return new Response(JSON.stringify({ 
          status: 'error', 
          message: 'Sin conexión a internet. Esta acción no se puede realizar offline.' 
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 400
        });
      })
    );
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
      }).catch(() => {});
      return cachedResponse || fetchPromise;
    })
  );
});
