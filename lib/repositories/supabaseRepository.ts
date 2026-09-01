import type {
  Account,
  AppData,
  Category,
  MonthlyBudget,
  Transaction,
  UserSettings,
} from "@/types";
import { buildDemoData } from "@/lib/seed";
import { ensureCategoryTypes } from "@/lib/categoryMigration";
import { supabase } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/utils";
import type { DataRepository } from "./types";

/**
 * Turns a PostgREST error (`{ message, details, hint, code }`) into a real,
 * current-realm `Error`. We deliberately never throw the raw PostgREST
 * object as-is: bundling/version differences have, in the past, produced
 * error objects whose prototype chain doesn't reliably satisfy
 * `instanceof Error` for every caller, which silently downgraded a real,
 * actionable database error (RLS violation, missing column, constraint
 * violation, etc.) into a generic "please try again" message — hiding the
 * actual root cause instead of surfacing it.
 */
function dbError(error: { message: string; details?: string; hint?: string; code?: string }): Error {
  const parts = [error.message];
  if (error.hint) parts.push(error.hint);
  return new Error(getErrorMessage(error, parts.filter(Boolean).join(" — ")));
}

/**
 * True when a PostgREST "column not found in schema cache" error refers to
 * `columnName` specifically (code `PGRST204`, e.g. "Could not find the
 * 'image_data_url' column of 'categories' in the schema cache"). This means
 * the live Supabase database hasn't actually run the migration that adds
 * this column yet, even though schema.sql / the app code expects it.
 */
function isMissingColumnError(
  error: { code?: string; message?: string } | null | undefined,
  columnName: string
): boolean {
  if (!error?.message) return false;
  if (error.code && error.code !== "PGRST204") return false;
  return error.message.includes(`'${columnName}'`) && error.message.toLowerCase().includes("column");
}

/**
 * Upserts category rows, tolerating a live database that is missing the
 * `image_data_url` column (a pending migration — see
 * supabase/migrations/002_add_categories_image_data_url.sql). Without this,
 * every single category save fails with a schema-cache error, even edits
 * that never touch the image (name/icon/color/type), because the column is
 * always present — as `null` when unset — in the payload sent to PostgREST.
 *
 * On success: resolves normally. If the column turned out to be missing,
 * everything except the image itself was still saved, and the returned flag
 * tells the caller so it can warn the user instead of pretending the image
 * was stored too.
 */
async function upsertCategoryRows(
  db: NonNullable<typeof supabase>,
  rows: ReturnType<typeof categoryToRow>[]
): Promise<{ imageColumnMissing: boolean }> {
  const { error } = await db.from("categories").upsert(rows);
  if (!error) return { imageColumnMissing: false };
  if (!isMissingColumnError(error, "image_data_url")) throw dbError(error);

  const rowsWithoutImage = rows.map((row) => {
    const rest = { ...row };
    delete (rest as { image_data_url?: unknown }).image_data_url;
    return rest;
  });
  const { error: retryError } = await db.from("categories").upsert(rowsWithoutImage);
  if (retryError) throw dbError(retryError);
  return { imageColumnMissing: true };
}

// ---------------------------------------------------------------------------
// Row <-> app-type mapping. The DB uses snake_case columns; the app's types
// use camelCase. Keeping the mapping in one place means the rest of the
// class can work entirely in app-shaped objects.
// ---------------------------------------------------------------------------

type AccountRow = {
  id: string;
  name: string;
  institution: string;
  type: Account["type"];
  last_four_digits: string | null;
  balance: number;
  color: string;
  is_primary: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

type TransactionRow = {
  id: string;
  type: Transaction["type"];
  amount: number;
  account_id: string;
  destination_account_id: string | null;
  category_id: string | null;
  merchant: string | null;
  note: string | null;
  date: string;
  receipt_url: string | null;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  recurring_series_id: string | null;
  recurrence_index: number | null;
  recurrence_frequency: Transaction["recurrenceFrequency"] | null;
  recurrence_interval: number | null;
  recurrence_start_date: string | null;
  recurrence_end_date: string | null;
  recurrence_count: number | null;
};

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: Category["type"];
  is_default: boolean;
  image_data_url: string | null;
};

type BudgetRow = {
  id: string;
  month: number;
  year: number;
  limit: number;
  category_limits: MonthlyBudget["categoryLimits"];
  created_at: string;
  updated_at: string;
};

type SettingsRow = {
  user_id: string;
  name: string;
  avatar_emoji: string | null;
  currency: string;
  financial_month_start_day: number;
  default_account_id: string | null;
  theme: UserSettings["theme"];
  default_monthly_limit: number;
  meta: AppData["meta"];
};

function accountToRow(a: Account, userId: string): AccountRow & { user_id: string } {
  return {
    id: a.id,
    user_id: userId,
    name: a.name,
    institution: a.institution,
    type: a.type,
    last_four_digits: a.lastFourDigits ?? null,
    balance: a.balance,
    color: a.color,
    is_primary: a.isPrimary,
    is_archived: a.isArchived,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  };
}
function rowToAccount(r: AccountRow): Account {
  return {
    id: r.id,
    name: r.name,
    institution: r.institution,
    type: r.type,
    lastFourDigits: r.last_four_digits ?? undefined,
    balance: r.balance,
    color: r.color,
    isPrimary: r.is_primary,
    isArchived: r.is_archived,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function transactionToRow(t: Transaction, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    type: t.type,
    amount: t.amount,
    account_id: t.accountId,
    destination_account_id: t.destinationAccountId ?? null,
    category_id: t.categoryId ?? null,
    merchant: t.merchant ?? null,
    note: t.note ?? null,
    date: t.date,
    receipt_url: t.receiptUrl ?? null,
    is_recurring: t.isRecurring,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    recurring_series_id: t.recurringSeriesId ?? null,
    recurrence_index: t.recurrenceIndex ?? null,
    recurrence_frequency: t.recurrenceFrequency ?? null,
    recurrence_interval: t.recurrenceInterval ?? null,
    recurrence_start_date: t.recurrenceStartDate ?? null,
    recurrence_end_date: t.recurrenceEndDate ?? null,
    recurrence_count: t.recurrenceCount ?? null,
  };
}
function rowToTransaction(r: TransactionRow): Transaction {
  return {
    id: r.id,
    type: r.type,
    amount: r.amount,
    accountId: r.account_id,
    destinationAccountId: r.destination_account_id ?? undefined,
    categoryId: r.category_id ?? undefined,
    merchant: r.merchant ?? undefined,
    note: r.note ?? undefined,
    date: r.date,
    receiptUrl: r.receipt_url ?? undefined,
    isRecurring: r.is_recurring,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    recurringSeriesId: r.recurring_series_id ?? undefined,
    recurrenceIndex: r.recurrence_index ?? undefined,
    recurrenceFrequency: r.recurrence_frequency ?? undefined,
    recurrenceInterval: r.recurrence_interval ?? undefined,
    recurrenceStartDate: r.recurrence_start_date ?? undefined,
    recurrenceEndDate: r.recurrence_end_date ?? undefined,
    recurrenceCount: r.recurrence_count ?? undefined,
  };
}

function categoryToRow(c: Category, userId: string) {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: c.type,
    is_default: c.isDefault,
    image_data_url: c.imageDataUrl ?? null,
  };
}
function rowToCategory(r: CategoryRow): Category {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    type: r.type,
    isDefault: r.is_default,
    imageDataUrl: r.image_data_url ?? undefined,
  };
}

function budgetToRow(b: MonthlyBudget, userId: string) {
  return {
    id: b.id,
    user_id: userId,
    month: b.month,
    year: b.year,
    limit: b.limit,
    category_limits: b.categoryLimits,
    created_at: b.createdAt,
    updated_at: b.updatedAt,
  };
}
function rowToBudget(r: BudgetRow): MonthlyBudget {
  return {
    id: r.id,
    month: r.month,
    year: r.year,
    limit: r.limit,
    categoryLimits: r.category_limits ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToSettings(r: SettingsRow): UserSettings {
  return {
    name: r.name,
    avatarEmoji: r.avatar_emoji ?? undefined,
    currency: r.currency,
    financialMonthStartDay: r.financial_month_start_day,
    defaultAccountId: r.default_account_id ?? undefined,
    theme: r.theme,
    defaultMonthlyLimit: r.default_monthly_limit,
  };
}

function assertClient() {
  if (!supabase) {
    throw new Error(
      "Supabase chưa được cấu hình. Vui lòng thêm NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY vào .env.local."
    );
  }
  return supabase;
}

/**
 * Cloud-backed implementation of DataRepository, one instance per signed-in
 * user. Row Level Security in Postgres is the real security boundary here
 * (every query is automatically scoped to auth.uid() by the database), so
 * this class doesn't need to filter by user_id on reads — only set it on
 * writes so new rows are correctly owned.
 */
export class SupabaseRepository implements DataRepository {
  constructor(private userId: string) {}

  async loadAll(): Promise<AppData> {
    const [accounts, transactions, categories, budgets, settings] = await Promise.all([
      this.listAccounts(),
      this.listTransactions(),
      this.listCategories(),
      this.listBudgets(),
      this.getSettings(),
    ]);
    const db = assertClient();
    const { data: settingsRow } = await db
      .from("user_settings")
      .select("meta")
      .eq("user_id", this.userId)
      .maybeSingle();

    return {
      accounts,
      transactions,
      categories,
      budgets,
      settings,
      meta: (settingsRow?.meta as AppData["meta"]) ?? {},
    };
  }

  async listAccounts(): Promise<Account[]> {
    const db = assertClient();
    const { data, error } = await db.from("accounts").select("*").order("created_at");
    if (error) throw dbError(error);
    return (data as AccountRow[]).map(rowToAccount);
  }

  async upsertAccount(account: Account): Promise<Account> {
    const db = assertClient();
    if (account.isPrimary) {
      // Enforce a single primary account, mirroring LocalStorageRepository.
      await db.from("accounts").update({ is_primary: false }).eq("user_id", this.userId).neq("id", account.id);
    }
    const { error } = await db.from("accounts").upsert(accountToRow(account, this.userId));
    if (error) throw dbError(error);
    return account;
  }

  async deleteAccount(id: string): Promise<void> {
    const db = assertClient();
    const { error } = await db.from("accounts").delete().eq("id", id);
    if (error) throw dbError(error);
  }

  async listTransactions(): Promise<Transaction[]> {
    const db = assertClient();
    const { data, error } = await db.from("transactions").select("*").order("date", { ascending: false });
    if (error) throw dbError(error);
    return (data as TransactionRow[]).map(rowToTransaction);
  }

  async upsertTransaction(transaction: Transaction): Promise<Transaction> {
    const db = assertClient();
    const { error } = await db.from("transactions").upsert(transactionToRow(transaction, this.userId));
    if (error) throw dbError(error);
    return transaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    const db = assertClient();
    const { error } = await db.from("transactions").delete().eq("id", id);
    if (error) throw dbError(error);
  }

  async listCategories(): Promise<Category[]> {
    const db = assertClient();
    const { data, error } = await db.from("categories").select("*");
    if (error) throw dbError(error);
    const categories = (data as CategoryRow[]).map(rowToCategory);

    // Defensive migration for any category missing a valid type (see
    // lib/categoryMigration.ts) — a no-op for every category this app has
    // ever created itself, but protects hand-edited/imported data.
    const { data: txData } = await db.from("transactions").select("category_id, type");
    const migrated = ensureCategoryTypes(
      categories,
      (txData ?? []).map((t: { category_id: string | null; type: Transaction["type"] }) => ({
        categoryId: t.category_id ?? undefined,
        type: t.type,
      }))
    );
    const changed = migrated.filter((c, i) => c !== categories[i]);
    if (changed.length > 0) {
      // Best-effort defensive write — never let it block reading categories.
      try {
        await upsertCategoryRows(db, changed.map((c) => categoryToRow(c, this.userId)));
      } catch {
        // Ignore: this is just a self-healing backfill, not part of the
        // caller's request.
      }
    }
    return migrated;
  }

  async upsertCategory(category: Category): Promise<Category> {
    const db = assertClient();
    const { imageColumnMissing } = await upsertCategoryRows(db, [categoryToRow(category, this.userId)]);
    if (imageColumnMissing && category.imageDataUrl) {
      // Name/icon/color/type were saved successfully (see upsertCategoryRows);
      // only the image itself could not be, so say so explicitly rather than
      // silently dropping it or blocking the whole save.
      throw new Error(
        "Đã lưu tên/biểu tượng/màu của danh mục, nhưng KHÔNG lưu được ảnh vì cơ sở dữ liệu Supabase chưa có cột 'image_data_url' trong bảng categories. Vui lòng chạy migration (supabase/migrations/002_add_categories_image_data_url.sql) rồi thử lưu ảnh lại."
      );
    }
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    const db = assertClient();
    const { error } = await db.from("categories").delete().eq("id", id);
    if (error) throw dbError(error);
  }

  async listBudgets(): Promise<MonthlyBudget[]> {
    const db = assertClient();
    const { data, error } = await db.from("budgets").select("*");
    if (error) throw dbError(error);
    return (data as BudgetRow[]).map(rowToBudget);
  }

  async upsertBudget(budget: MonthlyBudget): Promise<MonthlyBudget> {
    const db = assertClient();
    const { error } = await db.from("budgets").upsert(budgetToRow(budget, this.userId));
    if (error) throw dbError(error);
    return budget;
  }

  async getSettings(): Promise<UserSettings> {
    const db = assertClient();
    const { data, error } = await db
      .from("user_settings")
      .select("*")
      .eq("user_id", this.userId)
      .maybeSingle();
    if (error) throw dbError(error);
    if (!data) {
      // First time this user has ever loaded the app: create their row.
      const defaults: UserSettings = {
        name: "Bạn",
        currency: "VND",
        financialMonthStartDay: 1,
        theme: "dark",
        defaultMonthlyLimit: 0,
      };
      await this.updateSettings(defaults);
      return defaults;
    }
    return rowToSettings(data as SettingsRow);
  }

  async updateSettings(settings: UserSettings): Promise<UserSettings> {
    const db = assertClient();
    const { error } = await db.from("user_settings").upsert({
      user_id: this.userId,
      name: settings.name,
      avatar_emoji: settings.avatarEmoji ?? null,
      currency: settings.currency,
      financial_month_start_day: settings.financialMonthStartDay,
      default_account_id: settings.defaultAccountId ?? null,
      theme: settings.theme,
      default_monthly_limit: settings.defaultMonthlyLimit,
      updated_at: new Date().toISOString(),
    });
    if (error) throw dbError(error);
    return settings;
  }

  async resetToDemoData(): Promise<AppData> {
    await this.wipeAllData();
    const seeded = buildDemoData();
    await this.importJSON(JSON.stringify(seeded));
    return this.loadAll();
  }

  async wipeAllData(): Promise<AppData> {
    const db = assertClient();
    await db.from("transactions").delete().eq("user_id", this.userId);
    await db.from("budgets").delete().eq("user_id", this.userId);
    await db.from("accounts").delete().eq("user_id", this.userId);
    await db.from("categories").delete().eq("user_id", this.userId);
    await db
      .from("user_settings")
      .update({ meta: {} })
      .eq("user_id", this.userId);
    return this.loadAll();
  }

  async exportJSON(): Promise<string> {
    const data = await this.loadAll();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Bulk-writes an entire AppData blob for this user. Used both for
   * "Nhập / khôi phục dữ liệu" in Settings, and for the one-time
   * "sync my old local data to my new account" migration flow.
   */
  async importJSON(json: string): Promise<AppData> {
    const parsed = JSON.parse(json) as AppData;
    if (!parsed || !Array.isArray(parsed.accounts) || !Array.isArray(parsed.transactions)) {
      throw new Error("File không đúng định dạng dữ liệu SNEK.");
    }
    const db = assertClient();

    if (parsed.categories?.length) {
      await upsertCategoryRows(db, parsed.categories.map((c) => categoryToRow(c, this.userId)));
    }
    if (parsed.accounts.length) {
      const { error } = await db.from("accounts").upsert(parsed.accounts.map((a) => accountToRow(a, this.userId)));
      if (error) throw dbError(error);
    }
    if (parsed.transactions.length) {
      const { error } = await db
        .from("transactions")
        .upsert(parsed.transactions.map((t) => transactionToRow(t, this.userId)));
      if (error) throw dbError(error);
    }
    if (parsed.budgets?.length) {
      const { error } = await db.from("budgets").upsert(parsed.budgets.map((b) => budgetToRow(b, this.userId)));
      if (error) throw dbError(error);
    }
    if (parsed.settings) {
      await this.updateSettings(parsed.settings);
    }
    await this.setMeta(parsed.meta ?? {});
    return this.loadAll();
  }

  async setMeta(patch: Partial<AppData["meta"]>): Promise<void> {
    const db = assertClient();
    const { data } = await db.from("user_settings").select("meta").eq("user_id", this.userId).maybeSingle();
    const currentMeta = (data?.meta as AppData["meta"]) ?? {};
    const { error } = await db
      .from("user_settings")
      .upsert({ user_id: this.userId, meta: { ...currentMeta, ...patch } });
    if (error) throw dbError(error);
  }
}
