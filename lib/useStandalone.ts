"use client";

import { useEffect, useState } from "react";

// iOS Safari exposes navigator.standalone; every other engine that supports
// installable PWAs supports the display-mode media query instead.
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(display-mode: standalone)");
    const nav = navigator as NavigatorWithStandalone;

    const update = () => setIsStandalone(mql.matches || nav.standalone === true);
    update();

    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);

  return isStandalone;
}

/** True for iOS Safari specifically (not other iOS browsers, not desktop). */
export function useIsIOSSafari(): boolean {
  const [isIOSSafari, setIsIOSSafari] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    setIsIOSSafari(isIOS && isSafari);
  }, []);

  return isIOSSafari;
}
