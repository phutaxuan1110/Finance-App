import {
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  eachDayOfInterval,
  getDate,
  isAfter,
  isValid,
  lastDayOfMonth,
  setDate,
} from "date-fns";
import type { RecurrenceFrequency, Transaction, TransactionType } from "@/types";
import { uid } from "./utils";

export interface RecurrenceInput {
  frequency: RecurrenceFrequency;
  startDate: Date;
  endMode: "count" | "date";
  count?: number; // used when endMode === "count"
  endDate?: Date; // used when endMode === "date"
}

const MAX_OCCURRENCES = 60; // hard safety cap regardless of user input
const DEFAULT_UNBOUNDED_CAP = 12;

function clampToMonthLength(monthAnchor: Date, desiredDay: number): Date {
  const lastDay = lastDayOfMonth(monthAnchor).getDate();
  return setDate(monthAnchor, Math.min(desiredDay, lastDay));
}

/**
 * Adds `amount` periods of `frequency` to `date`, clamping to the last day
 * of the target month when the original day-of-month doesn't exist there
 * (e.g. 31/01 -> 28 or 29/02). Only ever operates on local calendar date
 * components via date-fns, so there is no UTC/timezone drift.
 */
function addPeriods(date: Date, frequency: RecurrenceFrequency, amount: number): Date {
  if (frequency === "weekly") return addWeeks(date, amount);
  if (frequency === "yearly") return clampToMonthLength(addYears(date, amount), getDate(date));
  return clampToMonthLength(addMonths(date, amount), getDate(date));
}

/** Compute the list of occurrence dates for a recurrence configuration. */
export function computeRecurrenceDates(input: RecurrenceInput): Date[] {
  const dates: Date[] = [];
  let i = 0;
  while (i < MAX_OCCURRENCES) {
    const occurrence = i === 0 ? input.startDate : addPeriods(input.startDate, input.frequency, i);

    if (input.endMode === "date" && input.endDate && isAfter(occurrence, input.endDate)) break;
    if (input.endMode === "count" && input.count && i >= input.count) break;
    if (!input.endDate && !input.count && i >= DEFAULT_UNBOUNDED_CAP) break;

    dates.push(occurrence);
    i++;
  }
  return dates;
}

interface RecurringSeriesBase {
  type: TransactionType;
  amount: number;
  accountId: string;
  categoryId?: string;
  merchant?: string;
  note?: string;
}

/**
 * Builds the full list of Transaction objects for a recurring series,
 * preserving the time-of-day from the original start date and copying all
 * shared fields (amount, account, category, merchant, note...).
 */
export function buildRecurringSeries(base: RecurringSeriesBase, input: RecurrenceInput): Transaction[] {
  const dates = computeRecurrenceDates(input);
  const seriesId = uid("series");
  const now = new Date().toISOString();
  const hours = input.startDate.getHours();
  const minutes = input.startDate.getMinutes();

  return dates.map((date, index) => {
    const occurrence = new Date(date);
    occurrence.setHours(hours, minutes, 0, 0);
    return {
      id: uid("txn"),
      type: base.type,
      amount: base.amount,
      accountId: base.accountId,
      categoryId: base.categoryId,
      merchant: base.merchant,
      note: base.note,
      date: occurrence.toISOString(),
      isRecurring: true,
      createdAt: now,
      updatedAt: now,
      recurringSeriesId: seriesId,
      recurrenceIndex: index,
      recurrenceFrequency: input.frequency,
      recurrenceInterval: 1,
      recurrenceStartDate: input.startDate.toISOString(),
      recurrenceEndDate: input.endMode === "date" ? input.endDate?.toISOString() : undefined,
      recurrenceCount: dates.length,
    };
  });
}

export const FREQUENCY_LABEL: Record<RecurrenceFrequency, string> = {
  weekly: "Hàng tuần",
  monthly: "Hàng tháng",
  yearly: "Hàng năm",
};

// ---------------------------------------------------------------------------
// Date-range recurring transactions: "create the same transaction for every
// calendar day in [startDate, endDate], inclusive". This replaces the old
// frequency/count-based recurrence (above) as the only way to create a NEW
// recurring series from the Add Transaction form — the old functions are
// left in place only because existing series already stored in the
// database use them (e.g. editing "toàn bộ chuỗi" of an old series still
// needs `recurrenceFrequency` to round-trip correctly), but nothing calls
// `buildRecurringSeries` / `computeRecurrenceDates` to CREATE new
// transactions anymore.
// ---------------------------------------------------------------------------

/** Hard safety cap on how many days a single date-range series may span, to
 * avoid accidentally generating an unbounded number of transactions from a
 * typo'd end date (e.g. wrong year). Generous enough for any realistic use
 * (daily entries for over a year). */
export const MAX_DATE_RANGE_DAYS = 366;

/**
 * Every calendar day from `startDate` to `endDate`, inclusive, compared by
 * local calendar date only (time-of-day on either input is ignored). Pure
 * local-date arithmetic via date-fns — never `toISOString()`/UTC — so the
 * result always matches the exact calendar dates the user picked, in their
 * own timezone, regardless of where the app is hosted or run.
 */
export function computeDateRangeDays(startDate: Date, endDate: Date): Date[] {
  if (!isValid(startDate) || !isValid(endDate)) return [];
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  if (isAfter(start, end)) return [];
  // Safety cap: never generate more than MAX_DATE_RANGE_DAYS occurrences,
  // even if the caller failed to validate the range first (validation also
  // happens in the UI via countDateRangeDays, so this is a defensive
  // backstop, not the primary user-facing check).
  return eachDayOfInterval({ start, end }).slice(0, MAX_DATE_RANGE_DAYS);
}

/** Inclusive day count for [startDate, endDate], for the "Sẽ tạo N giao
 * dịch" preview — without needing to build full Transaction objects first.
 * Returns 0 for an invalid/reversed range. */
export function countDateRangeDays(startDate: Date | null, endDate: Date | null): number {
  if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) return 0;
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  if (isAfter(start, end)) return 0;
  return differenceInCalendarDays(end, start) + 1;
}

interface DateRangeSeriesBase {
  type: TransactionType;
  amount: number;
  accountId: string;
  categoryId?: string;
  merchant?: string;
  note?: string;
}

/**
 * Builds one Transaction per calendar day in [startDate, endDate], inclusive
 * — every occurrence shares the same amount/account/category/merchant/note
 * and the same time-of-day (taken from `timeOfDay`), only the calendar date
 * differs. All occurrences share one `recurringSeriesId` so the existing
 * "sửa/xoá kỳ này trở đi / toàn bộ chuỗi" flows (which key off
 * `recurringSeriesId` + `recurrenceIndex`, not `recurrenceFrequency`) keep
 * working unchanged. `recurrenceFrequency` is deliberately left unset: a
 * plain date range isn't a weekly/monthly/yearly rule, and forcing it into
 * that enum would misrepresent what was actually created.
 */
export function buildDateRangeSeries(base: DateRangeSeriesBase, startDate: Date, endDate: Date, timeOfDay: Date): Transaction[] {
  const days = computeDateRangeDays(startDate, endDate);
  if (days.length === 0) return [];

  const hours = timeOfDay.getHours();
  const minutes = timeOfDay.getMinutes();
  const seriesId = uid("series");
  const now = new Date().toISOString();

  return days.map((day, index) => {
    const occurrence = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes, 0, 0);
    return {
      id: uid("txn"),
      type: base.type,
      amount: base.amount,
      accountId: base.accountId,
      categoryId: base.categoryId,
      merchant: base.merchant,
      note: base.note,
      date: occurrence.toISOString(),
      isRecurring: true,
      createdAt: now,
      updatedAt: now,
      recurringSeriesId: seriesId,
      recurrenceIndex: index,
      recurrenceStartDate: days[0].toISOString(),
      recurrenceEndDate: days[days.length - 1].toISOString(),
      recurrenceCount: days.length,
    };
  });
}
