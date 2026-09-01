"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Account, AppData, Category, MonthlyBudget, Transaction, UserSettings } from "@/types";
import { getRepository } from "@/lib/repositories/getRepository";
import { LocalStorageRepository } from "@/lib/repositories/localStorageRepository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/lib/auth-context";
import { uid } from "@/lib/utils";

interface DataContextValue {
  data: AppData | null;
  loading: boolean;
  refresh: () => Promise<void>;
  /** True once data is being read/written from the user's cloud account rather than this device's localStorage. */
  isCloudSynced: boolean;

  // One-time "sync my old local data to my new account" flow
  migrationAvailable: boolean;
  runMigration: () => Promise<void>;
  dismissMigration: () => void;

  // Accounts
  saveAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // Transactions
  saveTransaction: (transaction: Transaction, previous?: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addTransactionsBatch: (transactions: Transaction[]) => Promise<void>;
  deleteTransactionsBatch: (ids: string[]) => Promise<void>;
  replaceTransactionsBatch: (updates: { transaction: Transaction; previous: Transaction }[]) => Promise<void>;

  // Budgets
  saveBudget: (budget: MonthlyBudget) => Promise<void>;
  getBudgetFor: (month: number, year: number) => MonthlyBudget | undefined;

  // Settings
  saveSettings: (settings: UserSettings) => Promise<void>;

  // Categories
  saveCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  resetDemoData: () => Promise<void>;
  wipeAllData: () => Promise<void>;
  exportJSON: () => Promise<string>;
  importJSON: (json: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function applyBalanceDelta(accounts: Account[], accountId: string, delta: number): Account[] {
  return accounts.map((a) =>
    a.id === accountId ? { ...a, balance: a.balance + delta, updatedAt: new Date().toISOString() } : a
  );
}

function migratedFlagKey(userId: string) {
  return `snek:migrated:${userId}`;
}
function migrationDismissedKey(userId: string) {
  return `snek:migration-dismissed:${userId}`;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const isCloudSynced = isSupabaseConfigured && !!userId;

  // Recreated whenever the signed-in user changes (including sign-out),
  // so every read/write always targets the right place: this device's
  // localStorage, or this specific user's cloud account.
  const repository = useMemo(() => getRepository(userId), [userId]);

  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrationAvailable, setMigrationAvailable] = useState(false);

  const refresh = useCallback(async () => {
    const all = await repository.loadAll();
    setData(all);
    setLoading(false);
  }, [repository]);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    refresh();
  }, [refresh, authLoading]);

  // Detect "this browser has local data from before I signed up" exactly
  // once per user, right after their cloud data has loaded empty.
  useEffect(() => {
    if (!isCloudSynced || !userId || loading || !data) return;
    if (data.accounts.length > 0 || data.transactions.length > 0) return; // cloud already has data
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(migratedFlagKey(userId))) return;
    if (window.localStorage.getItem(migrationDismissedKey(userId))) return;

    const local = new LocalStorageRepository();
    local.loadAll().then((localData) => {
      if (localData.accounts.length > 0 || localData.transactions.length > 0) {
        setMigrationAvailable(true);
      }
    });
  }, [isCloudSynced, userId, loading, data]);

  const runMigration = useCallback(async () => {
    if (!userId) return;
    const local = new LocalStorageRepository();
    const json = await local.exportJSON();
    await repository.importJSON(json);
    window.localStorage.setItem(migratedFlagKey(userId), "1");
    setMigrationAvailable(false);
    await refresh();
  }, [userId, repository, refresh]);

  const dismissMigration = useCallback(() => {
    if (userId) window.localStorage.setItem(migrationDismissedKey(userId), "1");
    setMigrationAvailable(false);
  }, [userId]);

  const saveAccount = useCallback(
    async (account: Account) => {
      await repository.upsertAccount(account);
      await refresh();
    },
    [repository, refresh]
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      await repository.deleteAccount(id);
      await refresh();
    },
    [repository, refresh]
  );

  // Handles balance side-effects for add / edit / delete of a transaction.
  const saveTransaction = useCallback(
    async (transaction: Transaction, previous?: Transaction) => {
      const current = await repository.loadAll();
      let accounts = current.accounts;

      // Reverse the effect of the previous version of this transaction, if any.
      if (previous) {
        if (previous.type === "income") {
          accounts = applyBalanceDelta(accounts, previous.accountId, -previous.amount);
        } else if (previous.type === "expense") {
          accounts = applyBalanceDelta(accounts, previous.accountId, previous.amount);
        } else if (previous.type === "transfer" && previous.destinationAccountId) {
          accounts = applyBalanceDelta(accounts, previous.accountId, previous.amount);
          accounts = applyBalanceDelta(accounts, previous.destinationAccountId, -previous.amount);
        }
      }

      // Apply the effect of the new version.
      if (transaction.type === "income") {
        accounts = applyBalanceDelta(accounts, transaction.accountId, transaction.amount);
      } else if (transaction.type === "expense") {
        accounts = applyBalanceDelta(accounts, transaction.accountId, -transaction.amount);
      } else if (transaction.type === "transfer" && transaction.destinationAccountId) {
        accounts = applyBalanceDelta(accounts, transaction.accountId, -transaction.amount);
        accounts = applyBalanceDelta(accounts, transaction.destinationAccountId, transaction.amount);
      }

      for (const acc of accounts) {
        await repository.upsertAccount(acc);
      }
      await repository.upsertTransaction(transaction);
      await repository.setMeta({
        lastRecentAccountId: transaction.accountId,
        lastRecentCategoryId: transaction.categoryId,
      });
      await refresh();
    },
    [repository, refresh]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const current = await repository.loadAll();
      const txn = current.transactions.find((t) => t.id === id);
      if (txn) {
        let accounts = current.accounts;
        if (txn.type === "income") {
          accounts = applyBalanceDelta(accounts, txn.accountId, -txn.amount);
        } else if (txn.type === "expense") {
          accounts = applyBalanceDelta(accounts, txn.accountId, txn.amount);
        } else if (txn.type === "transfer" && txn.destinationAccountId) {
          accounts = applyBalanceDelta(accounts, txn.accountId, txn.amount);
          accounts = applyBalanceDelta(accounts, txn.destinationAccountId, -txn.amount);
        }
        for (const acc of accounts) {
          await repository.upsertAccount(acc);
        }
      }
      await repository.deleteTransaction(id);
      await refresh();
    },
    [repository, refresh]
  );

  // Inserts many brand-new transactions (e.g. a recurring series) as one
  // atomic-feeling operation: balances are updated by their cumulative
  // effect in a single pass, and the UI only refreshes once at the end.
  const addTransactionsBatch = useCallback(
    async (transactions: Transaction[]) => {
      if (transactions.length === 0) return;
      const current = await repository.loadAll();
      let accounts = current.accounts;

      for (const transaction of transactions) {
        if (transaction.type === "income") {
          accounts = applyBalanceDelta(accounts, transaction.accountId, transaction.amount);
        } else if (transaction.type === "expense") {
          accounts = applyBalanceDelta(accounts, transaction.accountId, -transaction.amount);
        } else if (transaction.type === "transfer" && transaction.destinationAccountId) {
          accounts = applyBalanceDelta(accounts, transaction.accountId, -transaction.amount);
          accounts = applyBalanceDelta(accounts, transaction.destinationAccountId, transaction.amount);
        }
      }

      for (const acc of accounts) {
        await repository.upsertAccount(acc);
      }
      for (const transaction of transactions) {
        await repository.upsertTransaction(transaction);
      }
      const last = transactions[transactions.length - 1];
      await repository.setMeta({
        lastRecentAccountId: last.accountId,
        lastRecentCategoryId: last.categoryId,
      });
      await refresh();
    },
    [repository, refresh]
  );

  // Deletes many transactions (e.g. "this and future" or "entire series")
  // and reverses their combined balance effect in one pass, refreshing once.
  const deleteTransactionsBatch = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      const current = await repository.loadAll();
      let accounts = current.accounts;
      const toDelete = current.transactions.filter((t) => idSet.has(t.id));

      for (const txn of toDelete) {
        if (txn.type === "income") {
          accounts = applyBalanceDelta(accounts, txn.accountId, -txn.amount);
        } else if (txn.type === "expense") {
          accounts = applyBalanceDelta(accounts, txn.accountId, txn.amount);
        } else if (txn.type === "transfer" && txn.destinationAccountId) {
          accounts = applyBalanceDelta(accounts, txn.accountId, txn.amount);
          accounts = applyBalanceDelta(accounts, txn.destinationAccountId, -txn.amount);
        }
      }

      for (const acc of accounts) {
        await repository.upsertAccount(acc);
      }
      for (const id of ids) {
        await repository.deleteTransaction(id);
      }
      await refresh();
    },
    [repository, refresh]
  );

  // Applies edits to multiple existing transactions at once (e.g. "this and
  // future occurrences" or "entire series" of a recurring transaction),
  // reversing each one's previous balance effect and applying its new one
  // in a single pass, then refreshing once.
  const replaceTransactionsBatch = useCallback(
    async (updates: { transaction: Transaction; previous: Transaction }[]) => {
      if (updates.length === 0) return;
      const current = await repository.loadAll();
      let accounts = current.accounts;

      for (const { transaction, previous } of updates) {
        if (previous.type === "income") {
          accounts = applyBalanceDelta(accounts, previous.accountId, -previous.amount);
        } else if (previous.type === "expense") {
          accounts = applyBalanceDelta(accounts, previous.accountId, previous.amount);
        } else if (previous.type === "transfer" && previous.destinationAccountId) {
          accounts = applyBalanceDelta(accounts, previous.accountId, previous.amount);
          accounts = applyBalanceDelta(accounts, previous.destinationAccountId, -previous.amount);
        }

        if (transaction.type === "income") {
          accounts = applyBalanceDelta(accounts, transaction.accountId, transaction.amount);
        } else if (transaction.type === "expense") {
          accounts = applyBalanceDelta(accounts, transaction.accountId, -transaction.amount);
        } else if (transaction.type === "transfer" && transaction.destinationAccountId) {
          accounts = applyBalanceDelta(accounts, transaction.accountId, -transaction.amount);
          accounts = applyBalanceDelta(accounts, transaction.destinationAccountId, transaction.amount);
        }
      }

      for (const acc of accounts) {
        await repository.upsertAccount(acc);
      }
      for (const { transaction } of updates) {
        await repository.upsertTransaction(transaction);
      }
      await refresh();
    },
    [repository, refresh]
  );

  const saveBudget = useCallback(
    async (budget: MonthlyBudget) => {
      await repository.upsertBudget(budget);
      await refresh();
    },
    [repository, refresh]
  );

  const getBudgetFor = useCallback(
    (month: number, year: number) => {
      return data?.budgets.find((b) => b.month === month && b.year === year);
    },
    [data]
  );

  const saveSettings = useCallback(
    async (settings: UserSettings) => {
      await repository.updateSettings(settings);
      await refresh();
    },
    [repository, refresh]
  );

  const saveCategory = useCallback(
    async (category: Category) => {
      try {
        await repository.upsertCategory(category);
      } finally {
        // Always resync app state with what's actually in the database,
        // even when upsertCategory throws — some writes (e.g. the
        // Supabase "image column missing" case) still save everything
        // except one field, and the UI shouldn't stay stuck showing the
        // old data for the parts that DID save just because the whole
        // call is reported as a failure.
        await refresh();
      }
    },
    [repository, refresh]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await repository.deleteCategory(id);
      await refresh();
    },
    [repository, refresh]
  );

  const resetDemoData = useCallback(async () => {
    await repository.resetToDemoData();
    await refresh();
  }, [repository, refresh]);

  const wipeAllData = useCallback(async () => {
    await repository.wipeAllData();
    await refresh();
  }, [repository, refresh]);

  const exportJSON = useCallback(async () => {
    return repository.exportJSON();
  }, [repository]);

  const importJSON = useCallback(
    async (json: string) => {
      await repository.importJSON(json);
      await refresh();
    },
    [repository, refresh]
  );

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      loading,
      refresh,
      isCloudSynced,
      migrationAvailable,
      runMigration,
      dismissMigration,
      saveAccount,
      deleteAccount,
      saveTransaction,
      deleteTransaction,
      addTransactionsBatch,
      deleteTransactionsBatch,
      replaceTransactionsBatch,
      saveBudget,
      getBudgetFor,
      saveSettings,
      saveCategory,
      deleteCategory,
      resetDemoData,
      wipeAllData,
      exportJSON,
      importJSON,
    }),
    [
      data,
      loading,
      refresh,
      isCloudSynced,
      migrationAvailable,
      runMigration,
      dismissMigration,
      saveAccount,
      deleteAccount,
      saveTransaction,
      deleteTransaction,
      addTransactionsBatch,
      deleteTransactionsBatch,
      replaceTransactionsBatch,
      saveBudget,
      getBudgetFor,
      saveSettings,
      saveCategory,
      deleteCategory,
      resetDemoData,
      wipeAllData,
      exportJSON,
      importJSON,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}

export function newId(prefix: string) {
  return uid(prefix);
}
