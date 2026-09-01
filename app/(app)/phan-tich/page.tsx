"use client";

import { useMemo, useState } from "react";
import { Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";
import { useData } from "@/lib/data-context";
import { Card, CardTitle } from "@/components/ui/Card";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { IncomeExpenseBarChart, type ComparisonPoint } from "@/components/charts/IncomeExpenseBarChart";
import { CategoryVisual } from "@/components/finance/CategoryVisual";
import { cn, formatVND } from "@/lib/utils";
import { categoryBreakdown, generateInsightsForPeriod, sumByType } from "@/lib/calculations";
import {
  getPreviousPeriodRange,
  getRangeForPeriod,
  groupTransactionsByDay,
  groupTransactionsByMonth,
  isCurrentPeriod,
  shiftAnchor,
  transactionsInDateRange,
  type AnalysisPeriod,
} from "@/lib/period";

export default function AnalysisPage() {
  const { data, loading, getBudgetFor } = useData();
  const [period, setPeriod] = useState<AnalysisPeriod>("month");
  const [anchor, setAnchor] = useState(new Date());

  const transactions = useMemo(() => data?.transactions ?? [], [data]);
  const categories = useMemo(() => data?.categories ?? [], [data]);

  const range = useMemo(() => getRangeForPeriod(period, anchor), [period, anchor]);
  const prevRange = useMemo(() => getPreviousPeriodRange(period, range), [period, range]);

  const periodTx = useMemo(() => transactionsInDateRange(transactions, range), [transactions, range]);
  const prevPeriodTx = useMemo(() => transactionsInDateRange(transactions, prevRange), [transactions, prevRange]);

  const income = sumByType(periodTx, "income");
  const expense = sumByType(periodTx, "expense");
  const savings = income - expense;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  const breakdown = useMemo(() => categoryBreakdown(periodTx, categories, "expense"), [periodTx, categories]);
  const prevExpense = sumByType(prevPeriodTx, "expense");
  const expenseChangePercent = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : null;

  const isCurrent = isCurrentPeriod(period, range);

  // For the month view, project end-of-month spending only while viewing the
  // current month, using its own current budget as the limit. For week/year
  // we don't have a budget entity, so no projection/limit is shown there.
  const budget = period === "month" ? getBudgetFor(anchor.getMonth() + 1, anchor.getFullYear()) : undefined;
  const daysElapsedInRange = isCurrent
    ? Math.max(1, Math.floor((new Date().getTime() - range.start.getTime()) / 86_400_000) + 1)
    : Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000) + 1);
  const totalDaysInRange = Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000) + 1);
  const dailyPace = daysElapsedInRange > 0 ? expense / daysElapsedInRange : 0;
  const projectedSpending = isCurrent ? dailyPace * totalDaysInRange : undefined;
  const avgDaily = expense / daysElapsedInRange;

  const insights = useMemo(
    () =>
      generateInsightsForPeriod({
        periodTx,
        previousPeriodTx: prevPeriodTx,
        categories,
        periodNounPhrase: period === "week" ? "tuần trước" : period === "year" ? "năm trước" : "tháng trước",
        projectedSpending: period === "month" ? projectedSpending : undefined,
        budgetLimit: budget?.limit,
      }),
    [periodTx, prevPeriodTx, categories, period, projectedSpending, budget]
  );

  const comparisonData: ComparisonPoint[] = useMemo(() => {
    if (period === "year") {
      const buckets = groupTransactionsByMonth(transactions, anchor.getFullYear());
      return buckets.map((b) => ({ label: b.label, income: b.income, expense: b.expense }));
    }
    // week and month: show per-day bars across the selected range
    const buckets = groupTransactionsByDay(transactions, range);
    return buckets.map((b) => ({ label: b.label, income: b.income, expense: b.expense }));
  }, [transactions, period, anchor, range]);

  const savingsTitle =
    period === "week" ? "Tiết kiệm tuần này" : period === "year" ? `Tiết kiệm năm ${range.label}` : "Tiết kiệm tháng này";
  const avgLabel = period === "year" ? "Chi tiêu TB / tháng" : "Chi tiêu TB / ngày";
  const avgValue = period === "year" ? expense / 12 : avgDaily;
  const comparisonNoun = period === "week" ? "tuần trước" : period === "year" ? "năm trước" : "tháng trước";

  function navigate(delta: number) {
    setAnchor((a) => shiftAnchor(period, a, delta));
  }

  if (loading || !data) {
    return <div className="py-20 text-center text-text-muted">Đang tải dữ liệu…</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Phân tích</h1>
        <div className="flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/[0.08] p-1">
          {(["week", "month", "year"] as AnalysisPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setAnchor(new Date());
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px]",
                period === p ? "bg-accent text-white" : "text-text-muted hover:text-text-primary"
              )}
            >
              {p === "week" ? "Tuần" : p === "month" ? "Tháng" : "Năm"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/[0.08] px-1.5 py-1 w-fit">
        <button
          onClick={() => navigate(-1)}
          aria-label="Kỳ trước"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium px-2 min-w-[140px] text-center">{range.label}</span>
        <button
          onClick={() => navigate(1)}
          aria-label="Kỳ sau"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardTitle className="mb-3">Thu nhập & chi tiêu</CardTitle>
          <IncomeExpenseBarChart data={comparisonData} />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-1">
            <CardTitle>{savingsTitle}</CardTitle>
          </div>
          <p className={cn("text-2xl font-semibold tabular-nums mt-2", savings >= 0 ? "text-success" : "text-danger")}>
            {formatVND(savings)}
          </p>
          <p className="text-xs text-text-muted mt-1">Tỷ lệ tiết kiệm: {savingsRate.toFixed(0)}% thu nhập</p>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-2xl bg-white/[0.03] px-3 py-3">
              <p className="text-[11px] text-text-muted mb-1">{avgLabel}</p>
              <p className="text-sm font-semibold tabular-nums">{formatVND(avgValue)}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.03] px-3 py-3">
              <p className="text-[11px] text-text-muted mb-1">Dự báo cuối kỳ</p>
              <p className="text-sm font-semibold tabular-nums">
                {period === "month" && isCurrent ? formatVND(projectedSpending ?? 0) : "—"}
              </p>
            </div>
          </div>

          {expenseChangePercent !== null && (
            <p className="text-xs text-text-muted mt-3">
              So với {comparisonNoun}: chi tiêu {expenseChangePercent >= 0 ? "tăng" : "giảm"}{" "}
              <span className={expenseChangePercent >= 0 ? "text-danger" : "text-success"}>
                {Math.abs(expenseChangePercent).toFixed(0)}%
              </span>
            </p>
          )}
        </Card>

        <Card className="md:col-span-2">
          <CardTitle className="mb-3">Chi tiêu theo danh mục</CardTitle>
          {breakdown.length === 0 ? (
            <p className="text-sm text-text-muted py-6 text-center">Chưa có dữ liệu chi tiêu trong khoảng thời gian này.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <CategoryDonutChart items={breakdown} total={expense} />
              <div className="flex flex-col gap-3">
                {breakdown.map((item) => (
                  <div key={item.category.id} className="flex items-center gap-3">
                    <div
                      className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full"
                      style={{ backgroundColor: item.category.imageDataUrl ? undefined : `${item.category.color}22`, color: item.category.color }}
                    >
                      <CategoryVisual category={item.category} size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{item.category.name}</span>
                        <span className="text-sm font-semibold tabular-nums">{formatVND(item.amount)}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/[0.06] mt-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${item.percent}%`, backgroundColor: item.category.color }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-text-muted w-9 text-right shrink-0">{item.percent.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={18} className="text-warning" />
            <CardTitle>Gợi ý thông minh</CardTitle>
          </div>
          {insights.length === 0 ? (
            <p className="text-sm text-text-muted">Chưa đủ dữ liệu để tạo gợi ý. Hãy thêm thêm giao dịch nhé.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {insights.map((insight) => (
                <li
                  key={insight.id}
                  className={cn(
                    "text-sm rounded-2xl px-4 py-3",
                    insight.tone === "positive" && "bg-success/10 text-success",
                    insight.tone === "warning" && "bg-warning/10 text-warning",
                    insight.tone === "neutral" && "bg-white/[0.04] text-text-primary"
                  )}
                >
                  {insight.text}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
