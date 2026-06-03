"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            const notifyUpdate = (worker: ServiceWorker) => {
              toast.info("Доступна новая версия системы", {
                description: "Обновите страницу, чтобы применить изменения",
                action: {
                  label: "Обновить",
                  onClick: () => {
                    worker.postMessage({ type: 'SKIP_WAITING' });
                  },
                },
                duration: Infinity,
              });
            };

            // Detect if there's already a waiting worker
            if (registration.waiting) {
              notifyUpdate(registration.waiting);
            }

            // Detect new workers installing
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    notifyUpdate(newWorker);
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error("PWA Service Worker registration failed:", error);
          });
      };

      // Auto reload once the new worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
        return () => window.removeEventListener("load", registerSW);
      }
    }
  }, []);

  return null;
}
