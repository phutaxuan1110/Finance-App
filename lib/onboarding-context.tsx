"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { useData } from "./data-context";

export type WalkthroughStep = "button" | "amount" | "account" | "category" | "save";

interface OnboardingContextValue {
  /** True while the blocking name/budget setup screens should be shown. */
  showProfileSetup: boolean;
  /** True once profile setup is done and the first transaction hasn't been saved yet. */
  walkthroughActive: boolean;
  walkthroughStep: WalkthroughStep;
  setWalkthroughStep: (step: WalkthroughStep) => void;
  /** Call once the user's first transaction has been saved successfully. */
  completeOnboarding: () => Promise<void>;
  /** Hides the visual walkthrough without fabricating a transaction. Setup
   * (name/budget/currency) is kept either way. */
  skipWalkthrough: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, isCloudEnabled } = useAuth();
  const { data, saveSettings } = useData();
  const [walkthroughStep, setWalkthroughStep] = useState<WalkthroughStep>("button");

  // Onboarding is a "you just logged in" concept for real Supabase
  // accounts — guest/local-only mode has no login step at all and always
  // gets demo data immediately, so `onboardingCompleted` is hardcoded true
  // there (see localStorageRepository.ts / lib/seed.ts) and this never
  // applies to it.
  const applies = isCloudEnabled && !!user;
  const onboardingCompleted = data?.settings.onboardingCompleted ?? true;
  const needsOnboarding = applies && !onboardingCompleted;

  // Deliberately NOT a separately-persisted "current step" field: profile
  // setup being "done" is derived from the settings actually being set to
  // something real. That's what makes onboarding resumable across app
  // restarts for free — closing the app right after Screen 2 and reopening
  // it lands back on the walkthrough instead of re-asking for a name,
  // because both pieces of profile data are already saved.
  const hasName = !!data?.settings.name?.trim() && data.settings.name !== "Bạn";
  const hasBudget = (data?.settings.defaultMonthlyLimit ?? 0) > 0;
  const showProfileSetup = needsOnboarding && !(hasName && hasBudget);
  const walkthroughActive = needsOnboarding && !showProfileSetup;

  const completeOnboarding = useCallback(async () => {
    if (!data) return;
    await saveSettings({ ...data.settings, onboardingCompleted: true });
  }, [data, saveSettings]);

  const skipWalkthrough = useCallback(async () => {
    await completeOnboarding();
  }, [completeOnboarding]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      showProfileSetup,
      walkthroughActive,
      walkthroughStep,
      setWalkthroughStep,
      completeOnboarding,
      skipWalkthrough,
    }),
    [showProfileSetup, walkthroughActive, walkthroughStep, completeOnboarding, skipWalkthrough]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within an OnboardingProvider");
  return ctx;
}
