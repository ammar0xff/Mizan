/* Mizan service worker — app shell caching with resilient offline fallback.
   API requests are NEVER cached (financial and transactional data must always be fresh). */
const CACHE = "mizan-shell-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Never touch API calls or cross-origin requests
  if (e.request.method !== "GET" || url.pathname.includes("/api/") || url.origin !== self.location.origin) {
    return;
  }

  if (e.request.mode === "navigate") {
    // Network-first for navigation, robust offline fallback to shell index.html
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached =
            (await caches.match("/index.html")) ||
            (await caches.match("./index.html")) ||
            (await caches.match("/")) ||
            (await caches.match("./"));
          if (cached) return cached;
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }),
    );
    return;
  }

  // Cache-first for static assets with safe network fallback
  e.respondWith(
    caches.match(e.request).then(async (hit) => {
      if (hit) return hit;
      try {
        const res = await fetch(e.request);
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      } catch {
        return new Response("", { status: 408, statusText: "Network Error" });
      }
    }),
  );
});
