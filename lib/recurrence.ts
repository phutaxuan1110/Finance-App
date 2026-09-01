import { addMonths, addWeeks, addYears, getDate, isAfter, lastDayOfMonth, setDate } from "date-fns";
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
