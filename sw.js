const CACHE_NAME = 'my-site-cache-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1';
const MAX_DYNAMIC_ITEMS = 5;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll([
          '/',
          '/index.html',
          '/css/bootstrap.min.css',
          '/css/londinium-theme.css',
          '/css/styles.css',
          '/js/bootstrap.min.js',
          '/js/application.js',
          '/js/app.js'
          // Asegúrate de incluir todas las imágenes necesarias aquí
        ]);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => {
          return name !== CACHE_NAME && name !== DYNAMIC_CACHE_NAME;
        }).map(name => {
          return caches.delete(name);
        })
      );
    })
  );
});

function limitCacheSize(cacheName, maxSize) {
  caches.open(cacheName).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > maxSize) {
        cache.delete(keys[0]).then(() => {
          limitCacheSize(cacheName, maxSize);
        });
      }
    });
  });
}

self.addEventListener('fetch', event => {
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(fetchResponse => {
          return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(event.request.url, fetchResponse.clone());
            limitCacheSize(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_ITEMS);
            return fetchResponse;
          });
        });
      })
    );
  }
});
