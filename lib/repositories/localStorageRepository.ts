import type { Account, AppData, Category, MonthlyBudget, Transaction, UserSettings } from "@/types";
import { buildDemoData } from "@/lib/seed";
import { ensureCategoryTypes } from "@/lib/categoryMigration";
import { storageGet, storageSet, storageClearAll } from "./storage";
import type { DataRepository } from "./types";

const DATA_KEY = "app-data";

function emptySettings(): UserSettings {
  return {
    name: "Bạn",
    currency: "VND",
    financialMonthStartDay: 1,
    theme: "dark",
    defaultMonthlyLimit: 0,
  };
}

function readData(): AppData {
  const fallback: AppData = {
    accounts: [],
    transactions: [],
    categories: [],
    budgets: [],
    settings: emptySettings(),
    meta: {},
  };
  const data = storageGet<AppData>(DATA_KEY, fallback);
  // First run: no data at all yet -> seed with demo data.
  if (!data.meta?.seededAt && data.accounts.length === 0 && data.transactions.length === 0) {
    const seeded = buildDemoData();
    storageSet(DATA_KEY, seeded);
    return seeded;
  }

  // Self-healing migration: backfill any category missing a valid
  // income/expense type (see lib/categoryMigration.ts). Safe no-op for
  // every category this app has ever created itself.
  const migratedCategories = ensureCategoryTypes(data.categories, data.transactions);
  if (migratedCategories.some((c, i) => c !== data.categories[i])) {
    data.categories = migratedCategories;
    storageSet(DATA_KEY, data);
  }

  return data;
}

function writeData(data: AppData) {
  storageSet(DATA_KEY, data);
}

export class LocalStorageRepository implements DataRepository {
  async loadAll(): Promise<AppData> {
    return readData();
  }

  async listAccounts(): Promise<Account[]> {
    return readData().accounts;
  }

  async upsertAccount(account: Account): Promise<Account> {
    const data = readData();
    const idx = data.accounts.findIndex((a) => a.id === account.id);
    if (idx >= 0) data.accounts[idx] = account;
    else data.accounts.push(account);

    // Enforce a single primary account
    if (account.isPrimary) {
      data.accounts = data.accounts.map((a) =>
        a.id === account.id ? a : { ...a, isPrimary: false }
      );
    }
    writeData(data);
    return account;
  }

  async deleteAccount(id: string): Promise<void> {
    const data = readData();
    data.accounts = data.accounts.filter((a) => a.id !== id);
    writeData(data);
  }

  async listTransactions(): Promise<Transaction[]> {
    return readData().transactions;
  }

  async upsertTransaction(transaction: Transaction): Promise<Transaction> {
    const data = readData();
    const idx = data.transactions.findIndex((t) => t.id === transaction.id);
    if (idx >= 0) data.transactions[idx] = transaction;
    else data.transactions.push(transaction);
    writeData(data);
    return transaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    const data = readData();
    data.transactions = data.transactions.filter((t) => t.id !== id);
    writeData(data);
  }

  async listCategories(): Promise<Category[]> {
    return readData().categories;
  }

  async upsertCategory(category: Category): Promise<Category> {
    const data = readData();
    const idx = data.categories.findIndex((c) => c.id === category.id);
    if (idx >= 0) data.categories[idx] = category;
    else data.categories.push(category);
    writeData(data);
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    const data = readData();
    data.categories = data.categories.filter((c) => c.id !== id);
    // Mirrors the Supabase schema's `category_id ... on delete set null`:
    // transactions that used this category are kept, just unlinked, rather
    // than left pointing at an id that no longer exists.
    data.transactions = data.transactions.map((t) =>
      t.categoryId === id ? { ...t, categoryId: undefined } : t
    );
    writeData(data);
  }

  async listBudgets(): Promise<MonthlyBudget[]> {
    return readData().budgets;
  }

  async upsertBudget(budget: MonthlyBudget): Promise<MonthlyBudget> {
    const data = readData();
    const idx = data.budgets.findIndex((b) => b.id === budget.id);
    if (idx >= 0) data.budgets[idx] = budget;
    else data.budgets.push(budget);
    writeData(data);
    return budget;
  }

  async getSettings(): Promise<UserSettings> {
    return readData().settings;
  }

  async updateSettings(settings: UserSettings): Promise<UserSettings> {
    const data = readData();
    data.settings = settings;
    writeData(data);
    return settings;
  }

  async resetToDemoData(): Promise<AppData> {
    const seeded = buildDemoData();
    writeData(seeded);
    return seeded;
  }

  async wipeAllData(): Promise<AppData> {
    storageClearAll();
    const empty: AppData = {
      accounts: [],
      transactions: [],
      categories: [],
      budgets: [],
      settings: emptySettings(),
      meta: {},
    };
    writeData(empty);
    return empty;
  }

  async exportJSON(): Promise<string> {
    return JSON.stringify(readData(), null, 2);
  }

  async importJSON(json: string): Promise<AppData> {
    const parsed = JSON.parse(json) as AppData;
    // Minimal shape validation to avoid corrupting storage with garbage
    if (!parsed || !Array.isArray(parsed.accounts) || !Array.isArray(parsed.transactions)) {
      throw new Error("File không đúng định dạng dữ liệu SNEK.");
    }
    writeData(parsed);
    return parsed;
  }

  async setMeta(patch: Partial<AppData["meta"]>): Promise<void> {
    const data = readData();
    data.meta = { ...data.meta, ...patch };
    writeData(data);
  }
}

export const repository: DataRepository = new LocalStorageRepository();
