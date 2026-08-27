self.addEventListener("push", (event) => {
  const origin = self.location.origin;
  let payload = {
    title: "Shanah City",
    body: "You have a new update.",
    url: "/",
    icon: `${origin}/shanah-city-logo.png`,
    badge: `${origin}/push-badge-96.png`,
  };

  try {
    payload = { ...payload, ...event.data?.json() };
  } catch {
    // Keep default payload.
  }

  const icon =
    typeof payload.icon === "string" && payload.icon.startsWith("http")
      ? payload.icon
      : `${origin}${payload.icon || "/shanah-city-logo.png"}`;
  const badge =
    typeof payload.badge === "string" && payload.badge.startsWith("http")
      ? payload.badge
      : `${origin}${payload.badge || "/push-badge-96.png"}`;

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon,
      badge,
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            if ("navigate" in client) {
              return client.navigate(targetUrl).then((next) => next?.focus());
            }
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }),
  );
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
