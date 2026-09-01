"use client";

import { useState } from "react";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import { AddTransactionSheet, type EditScope } from "@/components/transactions/AddTransactionSheet";
import { TransferSheet } from "@/components/accounts/TransferSheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SeriesActionDialog } from "@/components/transactions/SeriesActionDialog";
import type { Transaction } from "@/types";

/**
 * Centralizes what happens when a person taps "Sửa" / "Xoá" on any
 * transaction row, anywhere in the app (dashboard, transactions list,
 * accounts screen, calendar day sheet):
 *  - transfers are routed to the dedicated TransferSheet instead of the
 *    expense/income sheet
 *  - recurring-series transactions prompt for a scope (this / this+future /
 *    all) before editing or deleting
 *  - plain transactions behave exactly as before
 */
export function useTransactionActions() {
  const { data, deleteTransaction, deleteTransactionsBatch } = useData();
  const { showToast } = useToast();

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editScope, setEditScope] = useState<EditScope>("only");
  const [editingTransfer, setEditingTransfer] = useState<Transaction | null>(null);

  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [seriesDialog, setSeriesDialog] = useState<{ mode: "edit" | "delete"; tx: Transaction } | null>(null);
  const [prefillDate, setPrefillDate] = useState<Date | undefined>(undefined);
  const [addOpenForDate, setAddOpenForDate] = useState(false);

  function requestEdit(tx: Transaction) {
    if (tx.type === "transfer") {
      setEditingTransfer(tx);
      return;
    }
    if (tx.recurringSeriesId) {
      setSeriesDialog({ mode: "edit", tx });
      return;
    }
    setEditScope("only");
    setEditingTx(tx);
  }

  function requestDelete(tx: Transaction) {
    if (tx.recurringSeriesId) {
      setSeriesDialog({ mode: "delete", tx });
      return;
    }
    setPendingDelete(tx);
  }

  function requestAddForDate(date: Date) {
    setPrefillDate(date);
    setAddOpenForDate(true);
  }

  async function handleSeriesChoice(scope: EditScope) {
    if (!seriesDialog) return;
    const { mode, tx } = seriesDialog;
    setSeriesDialog(null);

    if (mode === "edit") {
      setEditScope(scope);
      setEditingTx(tx);
      return;
    }

    // delete
    const seriesId = tx.recurringSeriesId!;
    const anchorIndex = tx.recurrenceIndex ?? 0;
    const all = data?.transactions ?? [];
    let ids: string[];
    if (scope === "only") ids = [tx.id];
    else if (scope === "future")
      ids = all.filter((t) => t.recurringSeriesId === seriesId && (t.recurrenceIndex ?? 0) >= anchorIndex).map((t) => t.id);
    else ids = all.filter((t) => t.recurringSeriesId === seriesId).map((t) => t.id);

    await deleteTransactionsBatch(ids);
    showToast(`Đã xoá ${ids.length} giao dịch.`);
  }

  const dialogs = (
    <>
      <AddTransactionSheet
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
        editingTransaction={editingTx}
        editScope={editScope}
      />
      <AddTransactionSheet
        open={addOpenForDate}
        onClose={() => setAddOpenForDate(false)}
        prefillDate={prefillDate}
      />
      <TransferSheet
        open={!!editingTransfer}
        onClose={() => setEditingTransfer(null)}
        editingTransaction={editingTransfer}
      />
      <SeriesActionDialog
        open={!!seriesDialog}
        mode={seriesDialog?.mode ?? "edit"}
        onCancel={() => setSeriesDialog(null)}
        onChoose={handleSeriesChoice}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        title="Xoá giao dịch?"
        description="Hành động này không thể hoàn tác. Số dư tài khoản sẽ được cập nhật lại."
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) {
            await deleteTransaction(pendingDelete.id);
            showToast("Đã xoá giao dịch.");
          }
          setPendingDelete(null);
        }}
      />
    </>
  );

  return { requestEdit, requestDelete, requestAddForDate, dialogs };
}
