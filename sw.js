const CACHE_NAME = 'obsidian-portfolio-v30-advanced';
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './core-metrics.js',
    './fdbk.html',
    './resume.html',
    './status.html',
    './404.html',
    './assets/maintenance-bg.jpg',
    './logo.png',
    './preview.png',
    'https://unpkg.com/feather-icons'
];

// Install Event - Precache critical assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Precaching critical assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// Activate Event - Clean up old caches and enable Navigation Preload
self.addEventListener('activate', (event) => {
    self.clients.claim();
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            if (self.registration.navigationPreload) {
                return self.registration.navigationPreload.enable();
            }
        })
    );
});

// Fetch Event - Advanced Routing Strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Bypass non-GET requests and Supabase API calls
    if (request.method !== 'GET' || url.hostname.includes('supabase.co')) return;

    // STRATEGY 1: HTML Documents -> Network First, fallback to Cache
    if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            (async () => {
                try {
                    const preloadResponse = await event.preloadResponse;
                    if (preloadResponse) return preloadResponse;

                    const networkResponse = await fetch(request);
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                } catch (error) {
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) return cachedResponse;
                    // Fallback to offline page if available (like 404.html)
                    return caches.match('./404.html');
                }
            })()
        );
        return;
    }

    // STRATEGY 2: Images & Fonts -> Cache First, fallback to Network
    if (request.destination === 'image' || request.destination === 'font' || url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(request).then((networkResponse) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, networkResponse.clone());
                    });
                    return networkResponse;
                }).catch(() => { /* offline silent failure */ });
            })
        );
        return;
    }

    // STRATEGY 3: JS & CSS -> Stale-While-Revalidate
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => { /* offline silent failure */ });

            return cachedResponse || fetchPromise;
        })
    );
});
