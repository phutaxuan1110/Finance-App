"use client";

import React, { useState } from "react";
import { DataProvider } from "@/lib/data-context";
import { CurrencyProvider } from "@/lib/currency-context";
import { ToastProvider } from "@/lib/toast-context";
import { BottomNav } from "@/components/navigation/BottomNav";
import { FloatingAddButton } from "@/components/navigation/FloatingAddButton";
import { Sidebar } from "@/components/navigation/Sidebar";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { InstallHintBanner } from "@/components/pwa/InstallHintBanner";
import { MigrationBanner } from "@/components/auth/MigrationBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DataProvider>
        <CurrencyProvider>
          <AppShell>{children}</AppShell>
        </CurrencyProvider>
      </DataProvider>
    </ToastProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="min-h-dvh w-full flex">
      <Sidebar onAddClick={() => setAddOpen(true)} />
      <div className="flex-1 min-w-0">
        <main className="mx-auto w-full max-w-3xl main-content-padding">
          <InstallHintBanner />
          <MigrationBanner />
          {children}
        </main>
      </div>
      <BottomNav />
      <FloatingAddButton onClick={() => setAddOpen(true)} />
      <AddTransactionSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
