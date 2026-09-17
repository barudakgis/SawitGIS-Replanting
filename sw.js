/* SawitGIS Replanting — service worker
 * Cangkang aplikasi (index.html, manifest, ikon) disimpan untuk luring.
 * index.html: jaringan dulu (pembaruan langsung terasa), cadangan dari cache bila luring.
 * config.js: SELALU jaringan dulu dan TIDAK di-precache, agar perubahan apiUrl tidak tertahan.
 * Permintaan ke domain lain (Apps Script, ubin peta) tidak disentuh. */
var CACHE_VERSION = 'sgis-v1.1.0';
var CANGKANG = ['./', './index.html', './manifest.webmanifest', './ikon.svg'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE_VERSION).then(function (c) { return c.addAll(CANGKANG); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE_VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  var jaringanDulu = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname) || /config\.js$/.test(url.pathname);
  if (jaringanDulu) {
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok && !/config\.js$/.test(url.pathname)) { var salin = res.clone(); caches.open(CACHE_VERSION).then(function (c) { c.put(req.mode === 'navigate' ? './index.html' : req, salin); }); }
      return res;
    }).catch(function () {
      return caches.match(req.mode === 'navigate' ? './index.html' : req).then(function (r) {
        if (r) return r;
        if (/config\.js$/.test(url.pathname)) return new Response('window.SGIS_CONFIG = window.SGIS_CONFIG || {};', { headers: { 'Content-Type': 'application/javascript' } });
        return Response.error();
      });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (r) {
    return r || fetch(req).then(function (res) { if (res.ok) { var s = res.clone(); caches.open(CACHE_VERSION).then(function (c) { c.put(req, s); }); } return res; });
  }));
});
