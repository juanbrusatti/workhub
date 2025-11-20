const CACHE_NAME = "coworkhub-v1"
const RUNTIME_CACHE = "coworkhub-runtime"
const URLS_TO_CACHE = ["/", "/client/dashboard", "/admin/dashboard", "/offline.html"]

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE).catch((err) => {
        console.log("Cache addAll error:", err)
      })
    }),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip API calls to external services
  if (url.origin !== self.location.origin) {
    return
  }

  if (request.method !== "GET") {
    return
  }

  event.respondWith(
    caches
      .match(request)
      .then((response) => {
        if (response) {
          return response
        }

        return fetch(request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === "error") {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Cache HTML pages and API responses
          if (request.headers.get("accept")?.includes("text/html") || url.pathname.startsWith("/api/")) {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache)
            })
          }

          return response
        })
      })
      .catch(() => {
        // Return offline page for HTML requests
        if (request.headers.get("accept")?.includes("text/html")) {
          return caches.match("/offline.html")
        }
      }),
  )
})
