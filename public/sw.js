// SPADT Service Worker — network-first with fallback
// Bumped to v2 to invalidate any v1 caches automatically.
const CACHE = "spadt-v2";

self.addEventListener("install", (e) => {
  // Activate new SW immediately, replacing v1
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // Delete ALL old caches (including v1)
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Network-first for everything; fallback to cache only when offline.
// Static assets (images/fonts/_next/static) are cached after fetch for offline use.
self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return; // skip cross-origin (Supabase, esm.sh)

  e.respondWith((async () => {
    try {
      const fresh = await fetch(request);
      // Cache successful static asset responses for offline fallback only
      if (
        fresh.ok &&
        (/\.(svg|png|jpg|jpeg|webp|ico|woff2?|ttf|css)$/i.test(url.pathname) ||
          url.pathname.startsWith("/_next/static"))
      ) {
        const clone = fresh.clone();
        const cache = await caches.open(CACHE);
        cache.put(request, clone);
      }
      return fresh;
    } catch {
      // Network failed → try cache
      const cached = await caches.match(request);
      if (cached) return cached;
      // Last resort: serve dashboard shell
      const shell = await caches.match("/dashboard");
      if (shell) return shell;
      return new Response("Offline", { status: 503 });
    }
  })());
});
