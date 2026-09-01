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
  } catch (err) {
    // IMPORTANT: do NOT swallow this. A write failure here (most commonly
    // `QuotaExceededError` from a large category image, but also private-
    // browsing storage restrictions) used to be caught and silently
    // ignored, so callers like `upsertCategory` believed the save had
    // succeeded when nothing was actually persisted — the in-memory object
    // looked right until the next reload, when the old data reappeared.
    // Re-throwing lets repository methods (and ultimately the UI) know the
    // write genuinely failed, so they can surface an error instead of a
    // false "success".
    throw err instanceof Error
      ? err
      : new Error("Không thể lưu dữ liệu vào bộ nhớ trên thiết bị (có thể do bộ nhớ đã đầy).");
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
