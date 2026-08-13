self.addEventListener("push", (event) => {
  let payload = {
    title: "Shanah City",
    body: "You have a new update.",
    url: "/",
  };

  try {
    payload = { ...payload, ...event.data?.json() };
  } catch {
    // Keep default payload.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/shanah-city-logo.png",
      badge: "/shanah-city-logo.png",
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
