import {
  differenceInCalendarDays,
  endOfMonth,
  getDaysInMonth,
  isSameDay,
  isSameMonth,
  startOfMonth,
} from "date-fns";
import type { Account, Category, MonthlyBudget, Transaction } from "@/types";

export function monthKey(month: number, year: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function transactionsInMonth(transactions: Transaction[], month: number, year: number) {
  return transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });
}

export function sumByType(transactions: Transaction[], type: Transaction["type"]) {
  return transactions.filter((t) => t.type === type).reduce((sum, t) => sum + t.amount, 0);
}

export function activeAccounts(accounts: Account[]) {
  return accounts.filter((a) => !a.isArchived);
}

export function totalBalance(accounts: Account[]) {
  return activeAccounts(accounts).reduce((sum, a) => sum + a.balance, 0);
}

export function totalBankBalance(accounts: Account[]) {
  return activeAccounts(accounts)
    .filter((a) => a.type === "bank")
    .reduce((sum, a) => sum + a.balance, 0);
}

export interface BudgetStatus {
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number; // can exceed 100
  daysRemaining: number;
  daysElapsed: number;
  daysInMonth: number;
  safeToSpendToday: number;
  projectedSpending: number;
  statusLabel: string;
  statusLevel: "good" | "steady" | "near" | "at" | "over";
}

export function computeBudgetStatus(
  budget: MonthlyBudget | undefined,
  transactions: Transaction[],
  referenceDate: Date = new Date()
): BudgetStatus {
  const month = budget?.month ?? referenceDate.getMonth() + 1;
  const year = budget?.year ?? referenceDate.getFullYear();
  const limit = budget?.limit ?? 0;

  const monthTx = transactionsInMonth(transactions, month, year);
  const spent = sumByType(monthTx, "expense");
  const remaining = limit - spent;
  const percentUsed = limit > 0 ? (spent / limit) * 100 : 0;

  const isCurrentMonth = isSameMonth(referenceDate, new Date(year, month - 1, 1));
  const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));
  const daysElapsed = isCurrentMonth ? referenceDate.getDate() : daysInMonth;
  const daysRemaining = isCurrentMonth ? Math.max(daysInMonth - daysElapsed + 1, 1) : 0;

  const safeToSpendToday = daysRemaining > 0 ? Math.max(remaining, 0) / daysRemaining : 0;

  const dailyPace = daysElapsed > 0 ? spent / daysElapsed : 0;
  const projectedSpending = isCurrentMonth ? dailyPace * daysInMonth : spent;

  let statusLabel = "Đang kiểm soát tốt";
  let statusLevel: BudgetStatus["statusLevel"] = "good";
  if (percentUsed > 100) {
    statusLabel = "Đã vượt giới hạn";
    statusLevel = "over";
  } else if (percentUsed === 100) {
    statusLabel = "Đã dùng hết ngân sách";
    statusLevel = "at";
  } else if (percentUsed >= 80) {
    statusLabel = "Sắp chạm giới hạn";
    statusLevel = "near";
  } else if (percentUsed >= 50) {
    statusLabel = "Chi tiêu ổn định";
    statusLevel = "steady";
  } else {
    statusLabel = "Đang kiểm soát tốt";
    statusLevel = "good";
  }

  return {
    limit,
    spent,
    remaining,
    percentUsed,
    daysRemaining,
    daysElapsed,
    daysInMonth,
    safeToSpendToday,
    projectedSpending,
    statusLabel,
    statusLevel,
  };
}

export interface CategoryBreakdownItem {
  category: Category;
  amount: number;
  percent: number;
  count: number;
}

export function categoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  type: "expense" | "income" = "expense"
): CategoryBreakdownItem[] {
  const total = sumByType(transactions, type) || 1;
  const byCategory = new Map<string, { amount: number; count: number }>();
  transactions
    .filter((t) => t.type === type && t.categoryId)
    .forEach((t) => {
      const key = t.categoryId as string;
      const existing = byCategory.get(key) ?? { amount: 0, count: 0 };
      existing.amount += t.amount;
      existing.count += 1;
      byCategory.set(key, existing);
    });

  const items: CategoryBreakdownItem[] = [];
  byCategory.forEach((value, categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;
    items.push({
      category,
      amount: value.amount,
      percent: (value.amount / total) * 100,
      count: value.count,
    });
  });

  return items.sort((a, b) => b.amount - a.amount);
}

export function daysWithNoSpending(transactions: Transaction[], month: number, year: number) {
  const monthTx = transactionsInMonth(transactions, month, year).filter((t) => t.type === "expense");
  const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));
  const today = new Date();
  const isCurrent = isSameMonth(today, new Date(year, month - 1, 1));
  const daysToCheck = isCurrent ? today.getDate() : daysInMonth;

  let noSpendCount = 0;
  for (let day = 1; day <= daysToCheck; day++) {
    const dayDate = new Date(year, month - 1, day);
    const hasSpending = monthTx.some((t) => isSameDay(new Date(t.date), dayDate));
    if (!hasSpending) noSpendCount++;
  }
  return noSpendCount;
}

export function averageDailySpending(transactions: Transaction[], month: number, year: number) {
  const monthTx = transactionsInMonth(transactions, month, year);
  const spent = sumByType(monthTx, "expense");
  const today = new Date();
  const isCurrent = isSameMonth(today, new Date(year, month - 1, 1));
  const daysElapsed = isCurrent ? today.getDate() : getDaysInMonth(new Date(year, month - 1, 1));
  return daysElapsed > 0 ? spent / daysElapsed : 0;
}

export function previousMonth(month: number, year: number) {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

export interface SmartInsight {
  id: string;
  text: string;
  tone: "positive" | "neutral" | "warning";
}

/**
 * Generic, period-agnostic version of the insight engine used by the
 * Phân tích screen (week / month / year). All numbers are derived purely
 * from the transactions passed in — nothing is hardcoded.
 */
export function generateInsightsForPeriod(options: {
  periodTx: Transaction[];
  previousPeriodTx: Transaction[];
  categories: Category[];
  periodNounPhrase: string; // e.g. "tuần trước", "tháng trước", "năm trước"
  projectedSpending?: number; // only pass when the period is still in progress
  budgetLimit?: number;
}): SmartInsight[] {
  const { periodTx, previousPeriodTx, categories, periodNounPhrase, projectedSpending, budgetLimit } = options;
  const insights: SmartInsight[] = [];

  const currentBreakdown = categoryBreakdown(periodTx, categories, "expense");
  const prevBreakdown = categoryBreakdown(previousPeriodTx, categories, "expense");

  if (currentBreakdown.length > 0) {
    const top = currentBreakdown[0];
    const prevMatch = prevBreakdown.find((p) => p.category.id === top.category.id);
    if (prevMatch && prevMatch.amount > 0) {
      const changePercent = ((top.amount - prevMatch.amount) / prevMatch.amount) * 100;
      if (Math.abs(changePercent) >= 5) {
        const direction = changePercent > 0 ? "tăng" : "giảm";
        insights.push({
          id: "top-category-change",
          text: `Chi tiêu ${top.category.name.toLowerCase()} ${direction} ${Math.abs(changePercent).toFixed(0)}% so với ${periodNounPhrase}.`,
          tone: changePercent > 0 ? "warning" : "positive",
        });
      }
    } else {
      insights.push({
        id: "top-category",
        text: `${top.category.name} là khoản chi lớn nhất, chiếm ${top.percent.toFixed(0)}% tổng chi tiêu.`,
        tone: "neutral",
      });
    }
  }

  if (projectedSpending !== undefined && budgetLimit && budgetLimit > 0) {
    if (projectedSpending > budgetLimit) {
      const overBy = projectedSpending - budgetLimit;
      insights.push({
        id: "projected-over",
        text: `Bạn đang có khả năng vượt giới hạn khoảng ${Math.round(overBy).toLocaleString("vi-VN")}đ nếu giữ tốc độ hiện tại.`,
        tone: "warning",
      });
    } else {
      const remainderAtPace = budgetLimit - projectedSpending;
      insights.push({
        id: "projected-under",
        text: `Nếu giữ tốc độ hiện tại, bạn có thể còn dư khoảng ${Math.round(remainderAtPace).toLocaleString("vi-VN")}đ.`,
        tone: "positive",
      });
    }
  }

  const income = sumByType(periodTx, "income");
  const expense = sumByType(periodTx, "expense");
  if (income > 0) {
    const savingsRate = ((income - expense) / income) * 100;
    insights.push({
      id: "savings-rate",
      text: `Tỷ lệ tiết kiệm của bạn là ${savingsRate.toFixed(0)}% thu nhập.`,
      tone: savingsRate >= 20 ? "positive" : savingsRate >= 0 ? "neutral" : "warning",
    });
  } else if (expense > 0) {
    insights.push({
      id: "no-income-yet",
      text: `Chưa ghi nhận thu nhập nào trong khoảng thời gian này.`,
      tone: "neutral",
    });
  }

  return insights;
}

export function generateInsights(
  transactions: Transaction[],
  categories: Category[],
  budget: MonthlyBudget | undefined,
  referenceDate: Date = new Date()
): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const month = referenceDate.getMonth() + 1;
  const year = referenceDate.getFullYear();
  const { month: prevMonth, year: prevYear } = previousMonth(month, year);

  const currentTx = transactionsInMonth(transactions, month, year);
  const prevTx = transactionsInMonth(transactions, prevMonth, prevYear);

  const currentBreakdown = categoryBreakdown(currentTx, categories, "expense");
  const prevBreakdown = categoryBreakdown(prevTx, categories, "expense");

  if (currentBreakdown.length > 0) {
    const top = currentBreakdown[0];
    const prevMatch = prevBreakdown.find((p) => p.category.id === top.category.id);
    if (prevMatch && prevMatch.amount > 0) {
      const changePercent = ((top.amount - prevMatch.amount) / prevMatch.amount) * 100;
      if (Math.abs(changePercent) >= 5) {
        const direction = changePercent > 0 ? "tăng" : "giảm";
        insights.push({
          id: "top-category-change",
          text: `Chi tiêu ${top.category.name.toLowerCase()} ${direction} ${Math.abs(changePercent).toFixed(0)}% so với tháng trước.`,
          tone: changePercent > 0 ? "warning" : "positive",
        });
      }
    } else {
      insights.push({
        id: "top-category",
        text: `${top.category.name} là khoản chi lớn nhất tháng này, chiếm ${top.percent.toFixed(0)}% tổng chi tiêu.`,
        tone: "neutral",
      });
    }
  }

  const status = computeBudgetStatus(budget, transactions, referenceDate);
  if (status.limit > 0) {
    if (status.projectedSpending > status.limit) {
      const overBy = status.projectedSpending - status.limit;
      insights.push({
        id: "projected-over",
        text: `Bạn đang có khả năng vượt giới hạn khoảng ${Math.round(overBy).toLocaleString("vi-VN")}đ nếu giữ tốc độ hiện tại.`,
        tone: "warning",
      });
    } else {
      const remainderAtPace = status.limit - status.projectedSpending;
      insights.push({
        id: "projected-under",
        text: `Nếu giữ tốc độ hiện tại, cuối tháng bạn có thể còn dư khoảng ${Math.round(remainderAtPace).toLocaleString("vi-VN")}đ.`,
        tone: "positive",
      });
    }
  }

  const noSpend = daysWithNoSpending(transactions, month, year);
  if (noSpend > 0) {
    insights.push({
      id: "no-spend-days",
      text: `Bạn đã có ${noSpend} ngày không phát sinh chi tiêu trong tháng này.`,
      tone: "positive",
    });
  }

  const income = sumByType(currentTx, "income");
  const expense = sumByType(currentTx, "expense");
  if (income > 0) {
    const savingsRate = ((income - expense) / income) * 100;
    insights.push({
      id: "savings-rate",
      text: `Tỷ lệ tiết kiệm tháng này của bạn là ${savingsRate.toFixed(0)}% thu nhập.`,
      tone: savingsRate >= 20 ? "positive" : savingsRate >= 0 ? "neutral" : "warning",
    });
  }

  return insights;
}

export function daysRemainingInMonth(referenceDate: Date = new Date()) {
  const end = endOfMonth(referenceDate);
  return differenceInCalendarDays(end, referenceDate) + 1;
}

export function startOfMonthRange(referenceDate: Date = new Date()) {
  return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
}
