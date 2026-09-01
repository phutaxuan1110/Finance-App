"use client";

import { ArrowLeftRight, MoreVertical, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { CategoryVisual } from "@/components/finance/CategoryVisual";
import { cn, formatSignedVND } from "@/lib/utils";
import type { Account, Category, Transaction } from "@/types";

interface TransactionRowProps {
  transaction: Transaction;
  category?: Category;
  account?: Account;
  destinationAccount?: Account;
  onEdit: () => void;
  onDelete: () => void;
}

export function TransactionRow({
  transaction,
  category,
  account,
  destinationAccount,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 py-3 px-1 group relative">
      <div
        className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{ backgroundColor: category?.imageDataUrl ? undefined : `${category?.color ?? "#A49DA0"}22`, color: category?.color ?? "#A49DA0" }}
      >
        {transaction.type === "transfer" ? (
          <ArrowLeftRight size={19} />
        ) : (
          <CategoryVisual category={category ?? { icon: "MoreHorizontal" }} size={19} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {transaction.type === "transfer"
            ? `Chuyển tiền: ${account?.name ?? ""} → ${destinationAccount?.name ?? ""}`
            : transaction.merchant || category?.name || "Giao dịch"}
        </p>
        <p className="text-xs text-text-muted truncate">
          {account?.name} · {format(new Date(transaction.date), "HH:mm")}
          {transaction.note ? ` · ${transaction.note}` : ""}
        </p>
      </div>

      <div className="text-right">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            transaction.type === "income" && "text-success",
            transaction.type === "expense" && "text-danger",
            transaction.type === "transfer" && "text-accent-soft"
          )}
        >
          {formatSignedVND(transaction.amount, transaction.type)}
        </p>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Tuỳ chọn giao dịch"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/[0.06] text-text-muted"
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-10 z-20 w-36 rounded-2xl bg-bg-elevated border border-white/10 shadow-xl overflow-hidden">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-white/[0.06]"
              >
                <Pencil size={15} /> Sửa
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm text-danger hover:bg-white/[0.06]"
              >
                <Trash2 size={15} /> Xoá
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
