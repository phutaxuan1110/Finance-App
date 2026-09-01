// ---------------------------------------------------------------------------
// Core domain types for SNEK
// All money amounts are integers denominated in the smallest unit the user
// sees (VND has no subunit in practice), so we never do floating point math
// on currency.
// ---------------------------------------------------------------------------

export type AccountType = "bank" | "cash" | "savings";

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: AccountType;
  lastFourDigits?: string;
  balance: number; // integer VND
  color: string;
  isPrimary: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export type RecurrenceFrequency = "weekly" | "monthly" | "yearly";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // integer VND, always positive
  accountId: string;
  destinationAccountId?: string; // only for transfers
  categoryId?: string; // not used for transfers
  merchant?: string;
  note?: string;
  date: string; // ISO datetime
  receiptUrl?: string; // object URL / data URL preview, best-effort only
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;

  // --- Recurring series metadata (all optional for backward compatibility) ---
  /** Shared id across every transaction generated from the same recurring setup. */
  recurringSeriesId?: string;
  /** 0-based position of this transaction within its series. */
  recurrenceIndex?: number;
  recurrenceFrequency?: RecurrenceFrequency;
  /** Currently always 1 (every week/month/year); reserved for future "every N" support. */
  recurrenceInterval?: number;
  /** ISO date of the first occurrence in the series. */
  recurrenceStartDate?: string;
  /** ISO date after which no further occurrences should exist, if end-by-date was chosen. */
  recurrenceEndDate?: string;
  /** Total number of occurrences, if end-by-count was chosen. */
  recurrenceCount?: number;
}

export type CategoryKind = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string;
  type: CategoryKind;
  isDefault: boolean;
}

export interface CategoryLimit {
  categoryId: string;
  limit: number;
}

export interface MonthlyBudget {
  id: string;
  month: number; // 1-12
  year: number;
  limit: number;
  categoryLimits: CategoryLimit[];
  createdAt: string;
  updatedAt: string;
}

export type ThemePreference = "dark" | "light" | "system";

export interface UserSettings {
  name: string;
  avatarEmoji?: string;
  currency: string;
  financialMonthStartDay: number; // 1-28
  defaultAccountId?: string;
  theme: ThemePreference;
  defaultMonthlyLimit: number;
}

export interface AppData {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: MonthlyBudget[];
  settings: UserSettings;
  meta: {
    lastRecentCategoryId?: string;
    lastRecentAccountId?: string;
    seededAt?: string;
  };
}

export type MascotExpression =
  | "neutral"
  | "happy"
  | "proud"
  | "focused"
  | "worried"
  | "shocked"
  | "sleeping";
