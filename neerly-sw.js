// Neerly service worker (v0.7b): shows push notifications and opens Neerly when one is tapped.
// It caches nothing, so a new index.html is always picked up straight away.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: e.data ? e.data.text() : '' }; }
  // iPhone turns notifications off for a site that receives a push without showing one, so always show one.
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.title || 'Neerly', {
      body: d.body || '',
      icon: 'neerly-assets/icon-192.png',
      badge: 'neerly-assets/favicon-32.png',
      tag: d.tag || undefined,
      renotify: !!d.tag,
      data: { url: d.url || './' },
    }),
    // v0.7b.1: an open Neerly page refreshes straight away (Watching badge, live screen).
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => ws.forEach(w => w.postMessage({ type: 'push', tag: d.tag || '' }))),
  ]));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Reuse an open Neerly window: send it to the link (a share), or just bring it forward.
    for (const w of wins) {
      if (new URL(w.url).origin !== new URL(url).origin) continue;
      try { await w.focus(); } catch {}
      if (new URL(url).search) { try { await w.navigate(url); } catch { return self.clients.openWindow(url); } }
      return;
    }
    return self.clients.openWindow(url);
  })());
});
