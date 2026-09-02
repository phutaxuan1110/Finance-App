"use client";

import { useMemo, useState } from "react";
import { Plus, ArrowLeftRight } from "lucide-react";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import { useTransactionActions } from "@/lib/useTransactionActions";
import { useCurrency } from "@/lib/currency-context";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/finance/EmptyState";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AccountFormSheet } from "@/components/accounts/AccountFormSheet";
import { TransferSheet } from "@/components/accounts/TransferSheet";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { totalBalance } from "@/lib/calculations";
import type { Account } from "@/types";

export default function AccountsPage() {
  const { data, loading, saveAccount } = useData();
  const { showToast } = useToast();
  const actions = useTransactionActions();
  const { formatMoney } = useCurrency();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [historyAccountId, setHistoryAccountId] = useState<string | null>(null);

  const accounts = data?.accounts ?? [];
  const active = accounts.filter((a) => !a.isArchived);
  const banks = active.filter((a) => a.type === "bank");
  const wallets = active.filter((a) => a.type === "cash");
  const savings = active.filter((a) => a.type === "savings");

  const transferTx = useMemo(
    () => (data?.transactions ?? []).filter((t) => t.type === "transfer").sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [data]
  );

  const historyTx = useMemo(
    () =>
      historyAccountId
        ? (data?.transactions ?? [])
            .filter((t) => t.accountId === historyAccountId || t.destinationAccountId === historyAccountId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [],
    [data, historyAccountId]
  );

  function accountById(id?: string) {
    return accounts.find((a) => a.id === id);
  }

  if (loading || !data) {
    return <div className="py-20 text-center text-text-muted">Đang tải dữ liệu…</div>;
  }

  const historyAccount = historyAccountId ? accountById(historyAccountId) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Tài khoản</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
            <ArrowLeftRight size={15} /> Chuyển tiền
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingAccount(null);
              setFormOpen(true);
            }}
          >
            <Plus size={15} /> Thêm
          </Button>
        </div>
      </div>

      <Card className="text-center">
        <p className="text-xs text-text-muted mb-1">Tổng số dư tất cả tài khoản</p>
        <p className="text-3xl font-semibold tabular-nums">{formatMoney(totalBalance(accounts))}</p>
      </Card>

      {historyAccountId ? (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <CardTitle>Lịch sử: {historyAccount?.name}</CardTitle>
            <button onClick={() => setHistoryAccountId(null)} className="text-xs font-medium text-accent-soft hover:underline">
              Đóng
            </button>
          </div>
          {historyTx.length === 0 ? (
            <EmptyState title="Chưa có giao dịch" description="Tài khoản này chưa có lịch sử giao dịch." expression="neutral" />
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {historyTx.slice(0, 20).map((t) => (
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
        </Card>
      ) : (
        <>
          <Section
            title="Tài khoản ngân hàng"
            accounts={banks}
            onEdit={(a) => {
              setEditingAccount(a);
              setFormOpen(true);
            }}
            onArchive={setArchivingId}
            onSelect={setHistoryAccountId}
          />
          <Section
            title="Ví tiền mặt"
            accounts={wallets}
            onEdit={(a) => {
              setEditingAccount(a);
              setFormOpen(true);
            }}
            onArchive={setArchivingId}
            onSelect={setHistoryAccountId}
          />
          <Section
            title="Tài khoản tiết kiệm"
            accounts={savings}
            onEdit={(a) => {
              setEditingAccount(a);
              setFormOpen(true);
            }}
            onArchive={setArchivingId}
            onSelect={setHistoryAccountId}
          />

          <Card>
            <CardTitle className="mb-2">Lịch sử chuyển khoản</CardTitle>
            {transferTx.length === 0 ? (
              <p className="text-sm text-text-muted">Chưa có giao dịch chuyển tiền nào.</p>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {transferTx.slice(0, 10).map((t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    account={accountById(t.accountId)}
                    destinationAccount={accountById(t.destinationAccountId)}
                    onEdit={() => actions.requestEdit(t)}
                    onDelete={() => actions.requestDelete(t)}
                  />
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      <AccountFormSheet open={formOpen} onClose={() => setFormOpen(false)} editingAccount={editingAccount} />
      <TransferSheet open={transferOpen} onClose={() => setTransferOpen(false)} />
      <ConfirmDialog
        open={!!archivingId}
        title="Lưu trữ tài khoản?"
        description="Tài khoản sẽ được ẩn khỏi danh sách chính nhưng lịch sử giao dịch vẫn được giữ lại."
        confirmLabel="Lưu trữ"
        onCancel={() => setArchivingId(null)}
        onConfirm={async () => {
          const acc = accountById(archivingId ?? undefined);
          if (acc) {
            await saveAccount({ ...acc, isArchived: true, updatedAt: new Date().toISOString() });
            showToast("Đã lưu trữ tài khoản.");
          }
          setArchivingId(null);
        }}
      />

      {actions.dialogs}
    </div>
  );
}

function Section({
  title,
  accounts,
  onEdit,
  onArchive,
  onSelect,
}: {
  title: string;
  accounts: Account[];
  onEdit: (a: Account) => void;
  onArchive: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  if (accounts.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-semibold text-text-muted mb-2 px-1">{title}</p>
      <div className="flex flex-col gap-2">
        {accounts.map((a) => (
          <div key={a.id} onClick={() => onSelect(a.id)} className="cursor-pointer">
            <AccountCard
              account={a}
              onEdit={() => onEdit(a)}
              onArchive={() => onArchive(a.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
