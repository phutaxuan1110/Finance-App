"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DisplayCurrency } from "@/types";
import { useData } from "./data-context";
import {
  fetchExchangeRates,
  formatMoney as formatMoneyUtil,
  formatSignedMoney as formatSignedMoneyUtil,
  getCachedRates,
  type ExchangeRates,
} from "./currency";
import { getErrorMessage } from "./utils";

interface CurrencyContextValue {
  currency: DisplayCurrency;
  /** Persists the choice to user settings (VND is always what's stored — this only changes display). */
  setCurrency: (currency: DisplayCurrency) => Promise<void>;
  rates: ExchangeRates | null;
  ratesLoading: boolean;
  ratesError: string | null;
  refreshRates: () => Promise<void>;
  /** Formats a VND-denominated amount in the current display currency. */
  formatMoney: (amountVND: number) => string;
  /** Same, with an explicit +/- sign for income/expense rows. */
  formatSignedMoney: (amountVND: number, type: "income" | "expense" | "transfer") => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { data, saveSettings } = useData();
  const currency: DisplayCurrency = data?.settings.currency ?? "VND";

  const [rates, setRates] = useState<ExchangeRates | null>(() => getCachedRates());
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const refreshRates = useCallback(async () => {
    setRatesLoading(true);
    setRatesError(null);
    try {
      const fresh = await fetchExchangeRates();
      setRates(fresh);
    } catch (err) {
      setRatesError(getErrorMessage(err, "Không thể tải tỷ giá quy đổi."));
    } finally {
      setRatesLoading(false);
    }
  }, []);

  // Only fetch live rates once the person actually wants a foreign-currency
  // view — plain VND usage (the default) never makes a network call.
  useEffect(() => {
    if (currency !== "VND" && !rates && !ratesLoading) {
      refreshRates();
    }
  }, [currency, rates, ratesLoading, refreshRates]);

  const setCurrency = useCallback(
    async (next: DisplayCurrency) => {
      if (!data) return;
      await saveSettings({ ...data.settings, currency: next });
    },
    [data, saveSettings]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      rates,
      ratesLoading,
      ratesError,
      refreshRates,
      formatMoney: (amountVND: number) => formatMoneyUtil(amountVND, currency, rates),
      formatSignedMoney: (amountVND: number, type: "income" | "expense" | "transfer") =>
        formatSignedMoneyUtil(amountVND, type, currency, rates),
    }),
    [currency, setCurrency, rates, ratesLoading, ratesError, refreshRates]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}
