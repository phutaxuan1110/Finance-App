import type { DisplayCurrency } from "@/types";
import { formatVND } from "./utils";

export const CURRENCIES: { code: DisplayCurrency; label: string }[] = [
  { code: "VND", label: "VNĐ" },
  { code: "USD", label: "USD" },
  { code: "AUD", label: "AUD" },
];

export interface ExchangeRates {
  /** 1 VND expressed in USD */
  USD: number;
  /** 1 VND expressed in AUD */
  AUD: number;
  fetchedAt: string; // ISO timestamp of when this was fetched
}

const RATES_CACHE_KEY = "snek:v1:exchangeRates";
// The underlying API only refreshes once a day, so there's no point
// refetching more often than this — we just reuse whatever's cached.
const RATES_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export function getCachedRates(): ExchangeRates | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExchangeRates;
    if (
      typeof parsed?.USD !== "number" ||
      typeof parsed?.AUD !== "number" ||
      Date.now() - new Date(parsed.fetchedAt).getTime() > RATES_TTL_MS
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCachedRates(rates: ExchangeRates) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(rates));
  } catch {
    // Non-critical — worst case we just refetch next time instead of
    // using a stale cache.
  }
}

/**
 * Fetches live VND→USD/AUD exchange rates from ExchangeRate-API's free,
 * no-signup "open access" endpoint (https://www.exchangerate-api.com/docs/free).
 * That endpoint refreshes once a day; the result is cached in localStorage
 * on top of that so a normal browsing session doesn't refetch repeatedly.
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const cached = getCachedRates();
  if (cached) return cached;

  const res = await fetch("https://open.er-api.com/v6/latest/VND");
  if (!res.ok) {
    throw new Error("Không thể tải tỷ giá quy đổi. Vui lòng thử lại sau.");
  }
  const json = await res.json();
  if (json?.result !== "success" || typeof json?.rates?.USD !== "number" || typeof json?.rates?.AUD !== "number") {
    throw new Error("Dữ liệu tỷ giá trả về không hợp lệ.");
  }

  const rates: ExchangeRates = {
    USD: json.rates.USD,
    AUD: json.rates.AUD,
    fetchedAt: new Date().toISOString(),
  };
  setCachedRates(rates);
  return rates;
}

/** Converts a VND-denominated amount into the given display currency.
 * Returns the VND amount unchanged for "VND" or whenever rates aren't
 * available (never throws / never returns NaN silently). */
export function convertFromVND(amountVND: number, currency: DisplayCurrency, rates: ExchangeRates | null): number {
  if (currency === "VND" || !rates) return amountVND;
  return amountVND * rates[currency];
}

/**
 * Formats a VND-denominated amount for display in the given currency.
 * Falls back to plain VND formatting whenever the target currency is VND,
 * or rates aren't loaded yet / failed to load — a money amount always
 * displays as something sensible, never blank or "NaN".
 */
export function formatMoney(amountVND: number, currency: DisplayCurrency, rates: ExchangeRates | null): string {
  if (currency === "VND" || !rates) return formatVND(amountVND);
  const converted = convertFromVND(amountVND, currency, rates);
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(converted);
}

/** Same as `formatMoney`, but with an explicit +/- sign — the
 * currency-aware equivalent of `formatSignedVND`. */
export function formatSignedMoney(
  amountVND: number,
  type: "income" | "expense" | "transfer",
  currency: DisplayCurrency,
  rates: ExchangeRates | null
): string {
  if (type === "income") return `+${formatMoney(amountVND, currency, rates)}`;
  if (type === "expense") return `-${formatMoney(amountVND, currency, rates)}`;
  return formatMoney(amountVND, currency, rates);
}
