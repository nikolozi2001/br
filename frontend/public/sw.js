// Simple service worker for basic caching
const CACHE_NAME = 'business-register-v1';

// Cache essential files - these will be available after build
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Cache all assets from the assets folder
const cacheAssets = async () => {
  const cache = await caches.open(CACHE_NAME);

  // First cache the essential files
  await cache.addAll(urlsToCache).catch((error) => {
    console.warn('Some essential files could not be cached:', error);
  });

  // Then try to cache assets dynamically
  try {
    const response = await fetch('/assets/');
    if (response.ok) {
      // If we can list assets, cache them
      const assets = await response.json();
      if (Array.isArray(assets)) {
        const assetUrls = assets.map(asset => `/assets/${asset}`);
        await cache.addAll(assetUrls).catch(() => {
          // Silently fail for individual asset caching
        });
      }
    }
  } catch {
    // Silently fail - assets will be cached on demand
    console.log('Dynamic asset caching not available');
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(cacheAssets());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});