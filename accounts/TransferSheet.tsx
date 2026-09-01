"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Label, Select, Textarea } from "@/components/ui/Input";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import { formatVNDInput, parseVNDInput, uid } from "@/lib/utils";
import type { Transaction } from "@/types";

export function TransferSheet({
  open,
  onClose,
  editingTransaction,
}: {
  open: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}) {
  const { data, saveTransaction } = useData();
  const { showToast } = useToast();

  const accounts = (data?.accounts ?? []).filter((a) => !a.isArchived);

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingTransaction) {
      setFromId(editingTransaction.accountId);
      setToId(editingTransaction.destinationAccountId ?? "");
      setAmountDisplay(formatVNDInput(editingTransaction.amount));
      setNote(editingTransaction.note ?? "");
    } else {
      setFromId(accounts[0]?.id ?? "");
      setToId(accounts[1]?.id ?? "");
      setAmountDisplay("");
      setNote("");
    }
    setErrors({});
    setSaving(false);
  }, [open, editingTransaction]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit() {
    if (saving) return;
    const amount = parseVNDInput(amountDisplay);
    const newErrors: Record<string, string> = {};
    if (!amount || amount <= 0) newErrors.amount = "Vui lòng nhập số tiền hợp lệ.";
    if (!fromId) newErrors.fromId = "Chọn tài khoản gửi.";
    if (!toId) newErrors.toId = "Chọn tài khoản nhận.";
    if (fromId && toId && fromId === toId) newErrors.toId = "Tài khoản nhận phải khác tài khoản gửi.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    const now = new Date().toISOString();
    const transaction: Transaction = {
      id: editingTransaction?.id ?? uid("txn"),
      type: "transfer",
      amount,
      accountId: fromId,
      destinationAccountId: toId,
      note: note || undefined,
      date: editingTransaction?.date ?? now,
      isRecurring: false,
      createdAt: editingTransaction?.createdAt ?? now,
      updatedAt: now,
    };
    try {
      await saveTransaction(transaction, editingTransaction ?? undefined);
      showToast(editingTransaction ? "Đã cập nhật giao dịch chuyển tiền." : "Đã chuyển tiền thành công.");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể lưu giao dịch. Vui lòng thử lại.";
      setErrors({ amount: message });
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={editingTransaction ? "Sửa giao dịch chuyển tiền" : "Chuyển tiền giữa các tài khoản"}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center py-2">
          <span className="text-xs text-text-muted mb-1">Số tiền chuyển</span>
          <div className="flex items-baseline gap-1">
            <input
              autoFocus
              inputMode="numeric"
              value={amountDisplay}
              onChange={(e) => setAmountDisplay(formatVNDInput(parseVNDInput(e.target.value)))}
              placeholder="0"
              aria-label="Số tiền chuyển"
              className="bg-transparent text-center outline-none text-4xl font-semibold tabular-nums text-accent-soft w-full max-w-[240px]"
            />
            <span className="text-2xl font-semibold text-text-muted">đ</span>
          </div>
          {errors.amount && <p className="text-xs text-danger mt-2">{errors.amount}</p>}
        </div>

        <div>
          <Label htmlFor="transfer-from">Từ tài khoản</Label>
          <Select id="transfer-from" value={fromId} onChange={(e) => setFromId(e.target.value)}>
            <option value="">Chọn tài khoản</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          {errors.fromId && <p className="text-xs text-danger mt-1">{errors.fromId}</p>}
        </div>

        <div>
          <Label htmlFor="transfer-to">Đến tài khoản</Label>
          <Select id="transfer-to" value={toId} onChange={(e) => setToId(e.target.value)}>
            <option value="">Chọn tài khoản</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          {errors.toId && <p className="text-xs text-danger mt-1">{errors.toId}</p>}
        </div>

        <div>
          <Label htmlFor="transfer-note">Ghi chú</Label>
          <Textarea id="transfer-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Không bắt buộc" />
        </div>

        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Đang lưu…" : editingTransaction ? "Lưu thay đổi" : "Chuyển tiền"}
        </Button>
      </div>
    </Sheet>
  );
}
