self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {
    title: "New request nearby",
    body: "Open Peek to view it.",
    url: "/requests"
  };

  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: { url: payload.url ?? "/requests" }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/requests";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
