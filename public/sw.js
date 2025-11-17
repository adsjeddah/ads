// Service Worker for caching and performance
const CACHE_NAME = 'ads-cache-v1';
const urlsToCache = [
  '/',
  '/styles/globals.css',
  '/images/reviews/mohamed.jpg',
  '/images/reviews/asmaa.webp',
  '/images/reviews/khaled.jpg',
  '/images/reviews/doha.jpg',
  '/images/reviews/abdallah.png',
  '/images/reviews/hagar.jpg',
  '/images/reviews/ali.jpg',
  '/images/reviews/mohanad.jpg',
  '/images/reviews/osama.png',
  '/images/reviews/hany.jpg',
  '/images/reviews/otibi.jpg',
  '/images/reviews/marawan.webp',
  '/images/reviews/rihana.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache each URL individually to handle failures gracefully
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn('Failed to cache:', url, err);
            });
          })
        );
      })
  );
});

self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Clone the request for caching
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response for caching
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(err => {
        console.error('Fetch failed:', err);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});