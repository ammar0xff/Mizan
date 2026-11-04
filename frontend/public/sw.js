/* Mizan service worker — app shell caching with resilient offline fallback.
   API requests are NEVER cached (financial and transactional data must always be fresh). */
const CACHE = "mizan-shell-v3";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
      .catch(() => {}),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .catch(() => {}),
  );
});

self.addEventListener("fetch", (e) => {
  let url;
  try {
    url = new URL(e.request.url);
  } catch {
    return;
  }

  // Never touch non-GET, API calls, or cross-origin requests
  if (
    e.request.method !== "GET" ||
    url.pathname.includes("/api/") ||
    url.pathname.startsWith("/api") ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Navigation requests: Network-first with resilient cache fallback to SPA shell
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(async () => {
          const scope = self.registration.scope;
          const cached =
            (await caches.match(e.request)) ||
            (await caches.match(scope + "index.html")) ||
            (await caches.match("./index.html")) ||
            (await caches.match("/index.html")) ||
            (await caches.match(scope)) ||
            (await caches.match("./")) ||
            (await caches.match("/"));
          if (cached) return cached;
          return new Response(
            `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>ميزان — وضع عدم الاتصال</title><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#35151D;color:#F5EBDD;text-align:center;"><div style="padding:24px;border:1px solid rgba(255,255,255,0.1);border-radius:16px;background:rgba(255,255,255,0.05);"><h1 style="margin:0 0 8px;">ميزان ERP</h1><p style="opacity:0.8;">تعذر تحميل الصفحة — يرجى التحقق من اتصال الإنترنت.</p><button onclick="location.reload()" style="margin-top:16px;padding:8px 18px;border-radius:8px;border:none;background:#651E2C;color:#fff;cursor:pointer;font-weight:bold;">إعادة المحاولة</button></div></body></html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
          );
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
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      } catch {
        return new Response("", { status: 408, statusText: "Asset Unavailable" });
      }
    }),
  );
});
