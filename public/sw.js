// Synapse Systems Service Worker
// يخزّن الملفات الأساسية ليعمل التطبيق بدون إنترنت (Offline-first)

const CACHE = 'synapse-v1'
const CORE = ['/', '/manifest.json', '/favicon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()))
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

  // استراتيجية: شبكة أولاً، عند الفشل ارجع للكاش
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.method === 'GET') {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(request, clone)).catch(() => {})
        }
        return res
      })
      .catch(() => caches.match(request).then((r) => r || caches.match('/')))
  )
})
