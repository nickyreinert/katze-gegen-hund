/* Legt das Spiel ab, damit es auch ohne Netz startet.
   Bei jeder Aenderung an den Dateien die Nummer im Namen hochzaehlen. */
const LAGER = "katze-gegen-hund-v1";
const DATEIEN = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(LAGER)
      .then(lager => lager.addAll(DATEIEN))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(namen => Promise.all(namen.filter(n => n !== LAGER).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const anfrage = e.request;
  if (anfrage.method !== "GET") return;

  // Die Seite selbst zuerst aus dem Netz holen, damit Neuerungen ankommen.
  if (anfrage.mode === "navigate") {
    e.respondWith(
      fetch(anfrage)
        .then(antwort => {
          const kopie = antwort.clone();
          caches.open(LAGER).then(lager => lager.put("./index.html", kopie));
          return antwort;
        })
        .catch(() => caches.match("./index.html").then(a => a || caches.match("./")))
    );
    return;
  }

  e.respondWith(
    caches.match(anfrage).then(treffer => treffer || fetch(anfrage).then(antwort => {
      if (antwort.ok && new URL(anfrage.url).origin === location.origin) {
        const kopie = antwort.clone();
        caches.open(LAGER).then(lager => lager.put(anfrage, kopie));
      }
      return antwort;
    }))
  );
});
