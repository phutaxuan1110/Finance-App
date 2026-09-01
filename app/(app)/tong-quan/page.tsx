"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useData } from "@/lib/data-context";
import { useTransactionActions } from "@/lib/useTransactionActions";
import { SnakeMascot } from "@/components/mascot/SnakeMascot";
import { mascotForBudget } from "@/components/mascot/mascotLogic";
import { MonthSwitcher } from "@/components/finance/MonthSwitcher";
import { BudgetCard } from "@/components/finance/BudgetCard";
import { EditBudgetSheet } from "@/components/finance/EditBudgetSheet";
import { SummaryTiles } from "@/components/finance/SummaryTiles";
import { MonthCalendar } from "@/components/finance/MonthCalendar";
import { DayDetailSheet } from "@/components/finance/DayDetailSheet";
import { EmptyState } from "@/components/finance/EmptyState";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { Card } from "@/components/ui/Card";
import {
  computeBudgetStatus,
  sumByType,
  totalBalance,
  totalBankBalance,
  transactionsInMonth,
} from "@/lib/calculations";
import { formatVND } from "@/lib/utils";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export default function DashboardPage() {
  const { data, loading, getBudgetFor } = useData();
  const actions = useTransactionActions();

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [primaryOnly, setPrimaryOnly] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const budget = getBudgetFor(month, year);

  const monthTx = useMemo(
    () => transactionsInMonth(data?.transactions ?? [], month, year),
    [data, month, year]
  );

  const status = useMemo(
    () => computeBudgetStatus(budget, data?.transactions ?? [], new Date(year, month - 1, Math.min(today.getDate(), 28))),
    [budget, data, month, year] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const mascot = mascotForBudget(status, data?.transactions ?? [], false);

  const accounts = data?.accounts ?? [];
  const primaryAccount = accounts.find((a) => a.isPrimary);
  const displayedBalance = primaryOnly && primaryAccount ? primaryAccount.balance : totalBalance(accounts);

  const income = sumByType(monthTx, "income");
  const expense = sumByType(monthTx, "expense");

  const recentTransactions = [...(data?.transactions ?? [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  function accountById(id?: string) {
    return accounts.find((a) => a.id === id);
  }

  if (loading || !data) {
    return <div className="py-20 text-center text-text-muted">Đang tải dữ liệu…</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SnakeMascot expression={mascot.expression} size={52} />
          <div>
            <p className="text-sm text-text-muted">
              {greeting()}, {data.settings.name}
            </p>
            <p className="text-xs text-text-muted">{mascot.message}</p>
          </div>
        </div>
      </div>

      <MonthSwitcher month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-text-muted">
            {primaryOnly ? "Số dư tài khoản chính" : "Tổng số dư ngân hàng"}
          </p>
          {primaryAccount && (
            <button
              onClick={() => setPrimaryOnly((v) => !v)}
              className="text-[11px] font-medium text-accent-soft hover:underline"
            >
              {primaryOnly ? "Xem tất cả" : "Chỉ tài khoản chính"}
            </button>
          )}
        </div>
        <p className="text-3xl font-semibold tabular-nums">{formatVND(displayedBalance)}</p>
        <p className="text-xs text-text-muted mt-1">
          Ngân hàng: {formatVND(totalBankBalance(accounts))}
        </p>
      </div>

      <SummaryTiles income={income} expense={expense} />

      <BudgetCard status={status} mascot={mascot} onEditLimit={() => setBudgetSheetOpen(true)} />

      <Card>
        <p className="text-base font-semibold mb-3">Lịch chi tiêu</p>
        <MonthCalendar
          month={month}
          year={year}
          transactions={monthTx}
          categories={data.categories}
          onSelectDay={setSelectedDay}
        />
      </Card>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-base font-semibold">Giao dịch gần đây</p>
          <Link href="/giao-dich" className="text-xs font-medium text-accent-soft hover:underline">
            Xem tất cả
          </Link>
        </div>
        {recentTransactions.length === 0 ? (
          <EmptyState
            title="Chưa có giao dịch nào"
            description="Nhấn nút + để thêm giao dịch đầu tiên của bạn."
            expression="neutral"
          />
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {recentTransactions.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                category={data.categories.find((c) => c.id === t.categoryId)}
                account={accountById(t.accountId)}
                destinationAccount={accountById(t.destinationAccountId)}
                onEdit={() => actions.requestEdit(t)}
                onDelete={() => actions.requestDelete(t)}
              />
            ))}
          </div>
        )}
      </div>

      <EditBudgetSheet open={budgetSheetOpen} onClose={() => setBudgetSheetOpen(false)} month={month} year={year} />

      <DayDetailSheet
        date={selectedDay}
        onClose={() => setSelectedDay(null)}
        transactions={monthTx}
        accounts={accounts}
        categories={data.categories}
        onEdit={(t) => actions.requestEdit(t)}
        onDelete={(t) => actions.requestDelete(t)}
        onAddForDate={(date) => actions.requestAddForDate(date)}
      />

      {actions.dialogs}
    </div>
  );
}
