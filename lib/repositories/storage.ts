/**
 * Low-level, safe localStorage access. Every read/write is wrapped in
 * try/catch so a corrupted value, private-browsing mode, or SSR pass never
 * crashes the app.
 */

const NAMESPACE = "snek:v1:";

export function storageGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(NAMESPACE + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NAMESPACE + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — fail silently, the in-memory state
    // still works for the current session.
  }
}

export function storageRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(NAMESPACE + key);
  } catch {
    // ignore
  }
}

export function storageClearAll(): void {
  if (typeof window === "undefined") return;
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(NAMESPACE))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
