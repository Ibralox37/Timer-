/* Timer Challenge – Service Worker
   Macht das Spiel offline spielbar und installierbar.
   Konten/Rangliste brauchen weiterhin Internet. */

const CACHE = "timer-challenge-v2";

const DATEIEN = [
  "./",
  "./index.html",
  "./kronix-logo-hell.png",
  "./kronix-favicon.png",
  "./icon-192.png",
  "./icon-512.png",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(DATEIEN))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  /* Server-Anfragen (Konten, Rangliste) nie aus dem Cache */
  if (url.includes(".supabase.co")) return;
  if (event.request.method !== "GET") return;

  /* Spielseite: erst Netz (damit Updates ankommen), sonst Cache */
  if (event.request.mode === "navigate" || url.endsWith("index.html")) {
    event.respondWith(
      fetch(event.request)
        .then((antwort) => {
          const kopie = antwort.clone();
          caches.open(CACHE).then((c) => c.put(event.request, kopie));
          return antwort;
        })
        .catch(() => caches.match(event.request).then((t) => t || caches.match("./index.html")))
    );
    return;
  }

  /* Bilder & Co: erst Cache, sonst Netz */
  event.respondWith(
    caches.match(event.request).then(
      (treffer) =>
        treffer ||
        fetch(event.request).then((antwort) => {
          const kopie = antwort.clone();
          caches.open(CACHE).then((c) => c.put(event.request, kopie));
          return antwort;
        })
    )
  );
});
