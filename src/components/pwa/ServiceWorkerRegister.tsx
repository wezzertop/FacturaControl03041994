"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registrado con éxito:", reg.scope);
        })
        .catch((err) => {
          console.warn("Fallo al registrar Service Worker:", err);
        });
    }
  }, []);

  return null;
}
