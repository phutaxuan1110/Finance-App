"use client";

import React, { useState } from "react";
import { DataProvider } from "@/lib/data-context";
import { ToastProvider } from "@/lib/toast-context";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { InstallHintBanner } from "@/components/pwa/InstallHintBanner";
import { MigrationBanner } from "@/components/auth/MigrationBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DataProvider>
        <AppShell>{children}</AppShell>
      </DataProvider>
    </ToastProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="min-h-dvh flex safe-left safe-right">
      <Sidebar onAddClick={() => setAddOpen(true)} />
      <div className="flex-1 min-w-0">
        <main className="mx-auto w-full max-w-3xl px-4 md:px-8 main-content-padding">
          <InstallHintBanner />
          <MigrationBanner />
          {children}
        </main>
      </div>
      <BottomNav onAddClick={() => setAddOpen(true)} />
      <AddTransactionSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
