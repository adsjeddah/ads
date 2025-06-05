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
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
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