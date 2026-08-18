// Synapse Systems Service Worker
// يخزّن الملفات الأساسية ليعمل التطبيق بدون إنترنت (Offline-first)

const CACHE = 'synapse-v2'
const CORE = ['/', '/manifest.json', '/favicon.svg']

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // لا نخزّن طلبات API - نتركها تذهب مباشرة للشبكة
  if (url.pathname.startsWith('/api/')) return

  // طلبات التنقل (HTML): شبكة أولاً حتى يحصل المستخدم على آخر نسخة
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then((c) => c.put('/', clone)).catch(() => {})
          }
          return res
        })
        .catch(() => caches.match('/').then((r) => r || new Response('Offline', { status: 503 })))
    )
    return
  }

  // للأصول الثابتة (JS/CSS/صور): شبكة أولاً مع تحديث الكاش
  if (request.method === 'GET') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then((c) => c.put(request, clone)).catch(() => {})
          }
          return res
        })
        .catch(() => caches.match(request).then((r) => r || new Response('Offline', { status: 503 })))
    )
  }
})
