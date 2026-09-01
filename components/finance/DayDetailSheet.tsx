"use client";

import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { EmptyState } from "@/components/finance/EmptyState";
import { formatVND } from "@/lib/utils";
import type { Account, Category, Transaction } from "@/types";

export function DayDetailSheet({
  date,
  onClose,
  transactions,
  accounts,
  categories,
  onEdit,
  onDelete,
  onAddForDate,
}: {
  date: Date | null;
  onClose: () => void;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
  onAddForDate: (date: Date) => void;
}) {
  if (!date) return null;

  const dayTx = transactions
    .filter((t) => format(new Date(t.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const income = dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  function accountById(id?: string) {
    return accounts.find((a) => a.id === id);
  }

  return (
    <Sheet open={!!date} onClose={onClose} title={`Giao dịch ngày ${format(date, "dd/MM/yyyy")}`}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-success/10 px-4 py-3">
            <p className="text-[11px] text-text-muted mb-0.5">Tổng thu</p>
            <p className="text-sm font-semibold tabular-nums text-success">{formatVND(income)}</p>
          </div>
          <div className="rounded-2xl bg-danger/10 px-4 py-3">
            <p className="text-[11px] text-text-muted mb-0.5">Tổng chi</p>
            <p className="text-sm font-semibold tabular-nums text-danger">{formatVND(expense)}</p>
          </div>
        </div>

        <Button variant="outline" onClick={() => onAddForDate(date)}>
          <Plus size={16} /> Thêm giao dịch ngày này
        </Button>

        {dayTx.length === 0 ? (
          <EmptyState title="Chưa có giao dịch" description="Ngày này chưa có giao dịch nào được ghi nhận." expression="neutral" />
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {dayTx.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                category={categories.find((c) => c.id === t.categoryId)}
                account={accountById(t.accountId)}
                destinationAccount={accountById(t.destinationAccountId)}
                onEdit={() => onEdit(t)}
                onDelete={() => onDelete(t)}
              />
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
