import type {
  Account,
  AppData,
  Category,
  MonthlyBudget,
  Transaction,
  UserSettings,
} from "@/types";

/**
 * The UI never talks to localStorage directly. It talks to this interface.
 * Today it's implemented by LocalStorageRepository. Later, a
 * SupabaseRepository can implement the exact same methods (still returning
 * Promises) and the rest of the app does not need to change.
 */
export interface DataRepository {
  loadAll(): Promise<AppData>;

  // Accounts
  listAccounts(): Promise<Account[]>;
  upsertAccount(account: Account): Promise<Account>;
  deleteAccount(id: string): Promise<void>;

  // Transactions
  listTransactions(): Promise<Transaction[]>;
  upsertTransaction(transaction: Transaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // Categories
  listCategories(): Promise<Category[]>;
  upsertCategory(category: Category): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Budgets
  listBudgets(): Promise<MonthlyBudget[]>;
  upsertBudget(budget: MonthlyBudget): Promise<MonthlyBudget>;

  // Settings
  getSettings(): Promise<UserSettings>;
  updateSettings(settings: UserSettings): Promise<UserSettings>;

  // Bulk / lifecycle
  resetToDemoData(): Promise<AppData>;
  wipeAllData(): Promise<AppData>;
  exportJSON(): Promise<string>;
  importJSON(json: string): Promise<AppData>;

  setMeta(patch: Partial<AppData["meta"]>): Promise<void>;
}
