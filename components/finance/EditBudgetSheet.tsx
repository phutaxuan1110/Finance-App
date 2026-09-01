"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import { formatVNDInput, parseVNDInput, uid } from "@/lib/utils";
import type { MonthlyBudget } from "@/types";

interface EditBudgetSheetProps {
  open: boolean;
  onClose: () => void;
  month: number;
  year: number;
}

export function EditBudgetSheet({ open, onClose, month, year }: EditBudgetSheetProps) {
  const { data, saveBudget, getBudgetFor } = useData();
  const { showToast } = useToast();
  const [amountDisplay, setAmountDisplay] = useState("");
  const [error, setError] = useState("");

  const existing = getBudgetFor(month, year);

  useEffect(() => {
    if (!open) return;
    setAmountDisplay(existing ? formatVNDInput(existing.limit) : "");
    setError("");
  }, [open, existing]);

  function copyPreviousMonth() {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prev = data?.budgets.find((b) => b.month === prevMonth && b.year === prevYear);
    if (prev) {
      setAmountDisplay(formatVNDInput(prev.limit));
    } else {
      showToast("Chưa có giới hạn của tháng trước.", "error");
    }
  }

  async function handleSave() {
    const amount = parseVNDInput(amountDisplay);
    if (!amount || amount <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    const now = new Date().toISOString();
    const budget: MonthlyBudget = {
      id: existing?.id ?? uid("budget"),
      month,
      year,
      limit: amount,
      categoryLimits: existing?.categoryLimits ?? [],
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await saveBudget(budget);
    showToast("Đã cập nhật giới hạn chi tiêu.");
    onClose();
  }

  async function handleRemove() {
    if (!existing) {
      onClose();
      return;
    }
    const now = new Date().toISOString();
    await saveBudget({ ...existing, limit: 0, updatedAt: now });
    showToast("Đã xoá giới hạn chi tiêu.");
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Giới hạn chi tiêu tháng">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center py-4">
          <span className="text-xs text-text-muted mb-1">Hạn mức chi tiêu</span>
          <div className="flex items-baseline gap-1">
            <input
              autoFocus
              inputMode="numeric"
              value={amountDisplay}
              onChange={(e) => setAmountDisplay(formatVNDInput(parseVNDInput(e.target.value)))}
              placeholder="0"
              aria-label="Hạn mức chi tiêu"
              className="bg-transparent text-center outline-none text-4xl font-semibold tabular-nums w-full max-w-[240px]"
            />
            <span className="text-2xl font-semibold text-text-muted">đ</span>
          </div>
          {error && <p className="text-xs text-danger mt-2">{error}</p>}
        </div>

        <button onClick={copyPreviousMonth} className="text-sm font-medium text-accent-soft hover:underline self-center">
          Sao chép hạn mức tháng trước
        </button>

        <div className="flex gap-3">
          {existing && existing.limit > 0 && (
            <Button variant="danger" className="flex-1" onClick={handleRemove}>
              Xoá giới hạn
            </Button>
          )}
          <Button className="flex-1" onClick={handleSave}>
            Lưu
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
