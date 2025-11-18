// sw.js
const CACHE_NAME = 'tienda-pwa-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/tienda.html', 
  '/admin.html',
  '/manifest.webmanifest',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

self.addEventListener('install', event => {
  console.log('Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto, agregando archivos...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Todos los archivos cacheados');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Error durante la instalación:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve el recurso cacheado si existe
        if (response) {
          return response;
        }
        
        // Si no está en cache, haz la petición
        return fetch(event.request)
          .then(response => {
            // Verifica si la respuesta es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona la respuesta para guardarla en cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('Fetch failed:', error);
            // Puedes devolver una página offline personalizada aquí
            return new Response('Sin conexión', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/html'
              })
            });
          });
      })
  );
});