/**
 * ============================================================
 * SERVICE WORKER v1.0
 * Кэширование для офлайн-режима PWA
 * ============================================================
 */

const CACHE_NAME = 'pro-menu-v3.0.0';
const RUNTIME_CACHE = 'pro-menu-runtime-v3.0.0';

// Файлы для предварительного кэширования
const PRECACHE_URLS = [
    './',
    './testtm1.html',
    './kp.js',
    './daily-menu-module.js',
    './analytics-module.js',
    './utils.js',
    './mobile-module-v3.js',
    './manifest.json',
    // CDN
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
    'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// ============================================================
// УСТАНОВКА
// ============================================================

self.addEventListener('install', event => {
    console.log('[SW] Установка...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Предварительное кэширование');
                return cache.addAll(PRECACHE_URLS).catch(err => {
                    console.warn('[SW] Часть ресурсов не закэширована:', err);
                    // Продолжаем работу даже если что-то не закэшировалось
                });
            })
            .then(() => self.skipWaiting())
    );
});

// ============================================================
// АКТИВАЦИЯ
// ============================================================

self.addEventListener('activate', event => {
    console.log('[SW] Активация...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                        .map(name => {
                            console.log('[SW] Удаление старого кэша:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ============================================================
// ПЕРЕХВАТ ЗАПРОСОВ
// ============================================================

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Пропускаем не-GET запросы
    if (request.method !== 'GET') return;

    // Пропускаем chrome-extension и другие схемы
    if (!url.protocol.startsWith('http')) return;

    // Стратегия: Network First для HTML, Cache First для остального
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirst(request));
    } else {
        event.respondWith(cacheFirst(request));
    }
});

// ============================================================
// СТРАТЕГИИ КЭШИРОВАНИЯ
// ============================================================

/**
 * Cache First — сначала кэш, потом сеть
 * Хорошо для статических ресурсов (CSS, JS, изображения)
 */
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
        // Обновляем кэш в фоне
        fetch(request).then(response => {
            if (response && response.status === 200) {
                cache.put(request, response.clone());
            }
        }).catch(() => {});
        
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const runtimeCache = await caches.open(RUNTIME_CACHE);
            runtimeCache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // Если офлайн и нет кэша
        console.warn('[SW] Не удалось загрузить:', request.url);
        return new Response('Офлайн-режим', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Network First — сначала сеть, потом кэш
 * Хорошо для HTML и API-запросов
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        
        if (cached) {
            console.log('[SW] Офлайн — используем кэш для:', request.url);
            return cached;
        }
        
        // Fallback
        return cache.match('./testtm1.html');
    }
}

// ============================================================
// СООБЩЕНИЯ ОТ КЛИЕНТА
// ============================================================

self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(names => 
                Promise.all(names.map(name => caches.delete(name)))
            )
        );
    }
});

console.log('[SW] Service Worker загружен');