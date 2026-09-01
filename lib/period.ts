import {
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import type { Transaction } from "@/types";
import { VIETNAMESE_MONTHS } from "./utils";

export type AnalysisPeriod = "week" | "month" | "year";

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

// Vietnamese week convention: Monday first, Sunday last.
const WEEK_OPTIONS = { weekStartsOn: 1 as const };

export function getWeekRange(anchor: Date): DateRange {
  const start = startOfWeek(anchor, WEEK_OPTIONS);
  const end = endOfWeek(anchor, WEEK_OPTIONS);
  return { start, end, label: `${format(start, "dd/MM")} – ${format(end, "dd/MM/yyyy")}` };
}

export function getMonthRange(anchor: Date): DateRange {
  const start = startOfMonth(anchor);
  const end = endOfMonth(anchor);
  return { start, end, label: `${VIETNAMESE_MONTHS[start.getMonth()]}, ${start.getFullYear()}` };
}

export function getYearRange(anchor: Date): DateRange {
  const start = startOfYear(anchor);
  const end = endOfYear(anchor);
  return { start, end, label: `${start.getFullYear()}` };
}

export function getRangeForPeriod(period: AnalysisPeriod, anchor: Date): DateRange {
  if (period === "week") return getWeekRange(anchor);
  if (period === "year") return getYearRange(anchor);
  return getMonthRange(anchor);
}

/** Move the anchor date one period forward/backward (delta = -1 or 1). */
export function shiftAnchor(period: AnalysisPeriod, anchor: Date, delta: number): Date {
  if (period === "week") return delta > 0 ? addWeeks(anchor, 1) : subWeeks(anchor, 1);
  if (period === "year") return delta > 0 ? addYears(anchor, 1) : subYears(anchor, 1);
  return delta > 0 ? addMonths(anchor, 1) : subMonths(anchor, 1);
}

/** The equivalent range immediately preceding `range`, of the same period type. */
export function getPreviousPeriodRange(period: AnalysisPeriod, range: DateRange): DateRange {
  if (period === "week") return getWeekRange(subWeeks(range.start, 1));
  if (period === "year") return getYearRange(subYears(range.start, 1));
  return getMonthRange(subMonths(range.start, 1));
}

export function transactionsInDateRange(transactions: Transaction[], range: DateRange): Transaction[] {
  return transactions.filter((t) => isWithinInterval(new Date(t.date), { start: range.start, end: range.end }));
}

export interface DayBucket {
  date: Date;
  label: string;
  income: number;
  expense: number;
}

/** One bucket per calendar day within the range (used for week view, and optionally month view). */
export function groupTransactionsByDay(transactions: Transaction[], range: DateRange): DayBucket[] {
  const days = eachDayOfInterval({ start: range.start, end: range.end });
  return days.map((date) => {
    const dayTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });
    return {
      date,
      label: format(date, "dd/MM"),
      income: dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });
}

export interface MonthBucket {
  month: number;
  year: number;
  label: string;
  income: number;
  expense: number;
}

/** One bucket per calendar month within the given year. */
export function groupTransactionsByMonth(transactions: Transaction[], year: number): MonthBucket[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    return {
      month,
      year,
      label: `T${month}`,
      income: monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });
}

/** Weekday short labels in Vietnamese convention, Monday first. */
export const WEEKDAY_LABELS_MON_FIRST = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function isCurrentPeriod(period: AnalysisPeriod, range: DateRange, now: Date = new Date()): boolean {
  return now >= range.start && now <= range.end;
}

export function averageDailySpendingInRange(transactions: Transaction[], range: DateRange, now: Date = new Date()) {
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const isCurrent = isCurrentPeriod("month", range, now);
  const daysElapsed = isCurrent
    ? Math.max(1, Math.floor((now.getTime() - range.start.getTime()) / 86_400_000) + 1)
    : Math.max(1, Math.floor((range.end.getTime() - range.start.getTime()) / 86_400_000) + 1);
  return expense / daysElapsed;
}

export function daysBetweenInclusive(range: DateRange) {
  return Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000) + 1);
}
