// Simple Service Worker for Push Notifications Demo
// This will be replaced by Serwist if you implement full PWA features

const CACHE_NAME = "fire-protection-app-v1";

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(self.clients.claim());
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification);

  event.notification.close();

  const data = event.notification.data;

  // Open the app when notification is clicked
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      // Check if app is already open
      for (const client of clients) {
        if (client.url.includes("/") && "focus" in client) {
          return client.focus();
        }
      }

      // Open new window/tab if app not open
      if (self.clients.openWindow) {
        let url = "/";

        // Navigate to specific page based on notification data
        if (data?.type === "project" && data.projectId) {
          url = `/?project=${data.projectId}`;
        } else if (data?.type === "deadline") {
          url = `/?view=deadlines`;
        }

        return self.clients.openWindow(url);
      }
    }),
  );
});

// Handle push events (for future remote notifications)
self.addEventListener("push", (event) => {
  console.log("Push received:", event);

  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body || "You have a new notification",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: data.tag || "default",
      data: data.data || {},
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || "Fire Protection App",
        options,
      ),
    );
  }
});
