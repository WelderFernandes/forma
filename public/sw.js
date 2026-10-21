/**
 * Service worker do Forma.
 *
 * Estratégia segura para PWA:
 * - Cache somente de assets estáticos e da página offline.
 * - Navegação: rede primeiro; se falhar, mostra a página offline.
 * - APIs, páginas autenticadas e HTML privado nunca entram no cache.
 *
 * Ao mudar os assets estáticos, incremente CACHE_NAME para limpar o cache
 * antigo no próximo activate.
 */

const CACHE_NAME = "forma-static-v2";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icon.svg",
  "/icon-maskable.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon-180.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Não falhe a instalação inteira se um asset opcional estiver indisponível.
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/icon-maskable.svg" ||
    url.pathname === "/favicon.ico"
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;

    return new Response(
      "<!doctype html><html lang=\"pt-BR\"><meta charset=\"utf-8\"><title>Sem conexão</title><body style=\"font-family:sans-serif;background:#0b1008;color:#f4efe3;display:grid;place-items:center;min-height:100vh;margin:0\"><main style=\"text-align:center\"><h1>Sem conexão</h1><p>Verifique sua internet e tente novamente.</p></main></body></html>",
      {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegação nunca é cacheada: evita servir páginas autenticadas antigas.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Apenas assets estáticos e ícones usam cache.
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }

  // APIs, manifest e demais requisições seguem direto para a rede.
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === "CLEAR_CACHES") {
    event.waitUntil(
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key)))),
    );
  }
});
