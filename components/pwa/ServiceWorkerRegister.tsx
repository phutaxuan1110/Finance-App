"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Registered after load so it never competes with the initial render
    // for bandwidth/CPU on slow connections.
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability is a progressive enhancement — if registration
        // fails (e.g. unsupported browser, blocked by policy) the app
        // continues to work normally as a regular web page.
      });
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  return null;
}
