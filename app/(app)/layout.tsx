"use client";

import React, { useRef, useState } from "react";
import { DataProvider } from "@/lib/data-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { OnboardingProvider, useOnboarding } from "@/lib/onboarding-context";
import { ToastProvider } from "@/lib/toast-context";
import { BottomNav } from "@/components/navigation/BottomNav";
import { FloatingAddButton } from "@/components/navigation/FloatingAddButton";
import { Sidebar } from "@/components/navigation/Sidebar";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { InstallHintBanner } from "@/components/pwa/InstallHintBanner";
import { MigrationBanner } from "@/components/auth/MigrationBanner";
import { OnboardingProfileFlow } from "@/components/onboarding/OnboardingProfileFlow";
import { CoachMark } from "@/components/onboarding/CoachMark";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DataProvider>
        <CurrencyProvider>
          <OnboardingProvider>
            <AppGate>{children}</AppGate>
          </OnboardingProvider>
        </CurrencyProvider>
      </DataProvider>
    </ToastProvider>
  );
}

function AppGate({ children }: { children: React.ReactNode }) {
  const { showProfileSetup } = useOnboarding();
  if (showProfileSetup) return <OnboardingProfileFlow />;
  return <AppShell>{children}</AppShell>;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);
  const { walkthroughActive, walkthroughStep, skipWalkthrough } = useOnboarding();
  const mobileAddRef = useRef<HTMLButtonElement>(null);
  const desktopAddRef = useRef<HTMLButtonElement>(null);

  const buttonStepActive = walkthroughActive && walkthroughStep === "button" && !addOpen;

  return (
    <div className="min-h-dvh w-full flex">
      <Sidebar ref={desktopAddRef} onAddClick={() => setAddOpen(true)} />
      <div className="flex-1 min-w-0">
        <main className="mx-auto w-full max-w-3xl main-content-padding">
          <InstallHintBanner />
          <MigrationBanner />
          {children}
        </main>
      </div>
      <BottomNav />
      <FloatingAddButton ref={mobileAddRef} onClick={() => setAddOpen(true)} />
      <AddTransactionSheet open={addOpen} onClose={() => setAddOpen(false)} />

      {/* Guided-walkthrough step 1: highlight whichever "+" is actually
          visible at the current viewport (mobile floating button vs
          desktop sidebar button) — CoachMark itself no-ops for a hidden
          target, so rendering both unconditionally is safe. */}
      <CoachMark
        targetRef={mobileAddRef}
        active={buttonStepActive}
        title="Tạo giao dịch đầu tiên"
        description="Bấm vào đây để thêm khoản thu hoặc khoản chi."
        onSkip={skipWalkthrough}
      />
      <CoachMark
        targetRef={desktopAddRef}
        active={buttonStepActive}
        title="Tạo giao dịch đầu tiên"
        description="Bấm vào đây để thêm khoản thu hoặc khoản chi."
        onSkip={skipWalkthrough}
      />
    </div>
  );
}
