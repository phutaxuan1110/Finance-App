"use client";

import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useData } from "@/lib/data-context";
import { useTransactionActions } from "@/lib/useTransactionActions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/finance/EmptyState";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { TransactionFilters, type TransactionFilterState } from "@/components/transactions/TransactionFilters";
import { ImportCsvSheet } from "@/components/transactions/ImportCsvSheet";
import { formatVND } from "@/lib/utils";
import type { Transaction } from "@/types";

const EMPTY_FILTERS: TransactionFilterState = {
  search: "",
  accountId: "",
  categoryId: "",
  type: "",
  dateFrom: "",
  dateTo: "",
};

export default function TransactionsPage() {
  const { data, loading } = useData();
  const actions = useTransactionActions();

  const [filters, setFilters] = useState<TransactionFilterState>(EMPTY_FILTERS);
  const [importOpen, setImportOpen] = useState(false);

  const accounts = data?.accounts ?? [];
  const categories = data?.categories ?? [];

  const filtered = useMemo(() => {
    return (data?.transactions ?? [])
      .filter((t) => {
        if (filters.type && t.type !== filters.type) return false;
        if (filters.accountId && t.accountId !== filters.accountId && t.destinationAccountId !== filters.accountId)
          return false;
        if (filters.categoryId && t.categoryId !== filters.categoryId) return false;
        if (filters.dateFrom && new Date(t.date) < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && new Date(t.date) > new Date(`${filters.dateTo}T23:59:59`)) return false;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const haystack = `${t.note ?? ""} ${t.merchant ?? ""}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, filters]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filtered.forEach((t) => {
      const key = format(new Date(t.date), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  function accountById(id?: string) {
    return accounts.find((a) => a.id === id);
  }

  function dailyTotal(txs: Transaction[]) {
    return txs.reduce((sum, t) => {
      if (t.type === "income") return sum + t.amount;
      if (t.type === "expense") return sum - t.amount;
      return sum;
    }, 0);
  }

  if (loading || !data) {
    return <div className="py-20 text-center text-text-muted">Đang tải dữ liệu…</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Giao dịch</h1>
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
          <Upload size={15} /> Nhập CSV
        </Button>
      </div>

      <TransactionFilters filters={filters} onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))} accounts={accounts} categories={categories} />

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            title="Không tìm thấy giao dịch"
            description="Thử thay đổi bộ lọc hoặc thêm một giao dịch mới."
            expression="neutral"
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(([dateKey, txs]) => (
            <Card key={dateKey} className="!p-4">
              <div className="flex items-center justify-between mb-1 px-1">
                <p className="text-xs font-medium text-text-muted">
                  {format(new Date(dateKey), "dd/MM/yyyy")}
                  {isSameDay(new Date(dateKey), new Date()) ? " · Hôm nay" : ""}
                </p>
                <p className="text-xs font-medium tabular-nums text-text-muted">
                  {dailyTotal(txs) >= 0 ? "+" : ""}
                  {formatVND(dailyTotal(txs))}
                </p>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {txs.map((t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    category={categories.find((c) => c.id === t.categoryId)}
                    account={accountById(t.accountId)}
                    destinationAccount={accountById(t.destinationAccountId)}
                    onEdit={() => actions.requestEdit(t)}
                    onDelete={() => actions.requestDelete(t)}
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ImportCsvSheet open={importOpen} onClose={() => setImportOpen(false)} />
      {actions.dialogs}
    </div>
  );
}
