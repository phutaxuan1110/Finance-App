"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Account, AppData, Category, MonthlyBudget, Transaction, UserSettings } from "@/types";
import { repository } from "@/lib/repositories/localStorageRepository";
import { uid } from "@/lib/utils";

interface DataContextValue {
  data: AppData | null;
  loading: boolean;
  refresh: () => Promise<void>;

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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await repository.loadAll();
    setData(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveAccount = useCallback(
    async (account: Account) => {
      await repository.upsertAccount(account);
      await refresh();
    },
    [refresh]
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      await repository.deleteAccount(id);
      await refresh();
    },
    [refresh]
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
    [refresh]
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
    [refresh]
  );

  // Inserts many brand-new transactions (e.g. a recurring series) as one
  // atomic-feeling operation: balances are updated by their cumulative
  // effect in a single pass, and the UI only refreshes once at the end.
  // If anything throws mid-way, nothing has been persisted for the batch
  // being written on this call (upserts happen after all deltas are
  // computed), so a failure can't leave a half-written series behind.
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
    [refresh]
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
    [refresh]
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
    [refresh]
  );

  const saveBudget = useCallback(    async (budget: MonthlyBudget) => {
      await repository.upsertBudget(budget);
      await refresh();
    },
    [refresh]
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
    [refresh]
  );

  const saveCategory = useCallback(
    async (category: Category) => {
      await repository.upsertCategory(category);
      await refresh();
    },
    [refresh]
  );

  const resetDemoData = useCallback(async () => {
    await repository.resetToDemoData();
    await refresh();
  }, [refresh]);

  const wipeAllData = useCallback(async () => {
    await repository.wipeAllData();
    await refresh();
  }, [refresh]);

  const exportJSON = useCallback(async () => {
    return repository.exportJSON();
  }, []);

  const importJSON = useCallback(
    async (json: string) => {
      await repository.importJSON(json);
      await refresh();
    },
    [refresh]
  );

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      loading,
      refresh,
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
      resetDemoData,
      wipeAllData,
      exportJSON,
      importJSON,
    }),
    [
      data,
      loading,
      refresh,
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
