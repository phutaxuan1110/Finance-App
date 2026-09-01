"use client";

import { Landmark, PiggyBank, Wallet, Star, Archive, Pencil } from "lucide-react";
import { formatVND } from "@/lib/utils";
import type { Account } from "@/types";

const TYPE_ICON = { bank: Landmark, cash: Wallet, savings: PiggyBank };

export function AccountCard({
  account,
  onEdit,
  onArchive,
}: {
  account: Account;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const Icon = TYPE_ICON[account.type];

  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${account.color}22`, color: account.color }}
      >
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{account.name}</p>
          {account.isPrimary && <Star size={12} className="text-warning fill-warning shrink-0" />}
        </div>
        <p className="text-xs text-text-muted truncate">
          {account.institution}
          {account.lastFourDigits ? ` •••• ${account.lastFourDigits}` : ""}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">{formatVND(account.balance)}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label={`Sửa ${account.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/[0.06] text-text-muted"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          aria-label={`Lưu trữ ${account.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/[0.06] text-text-muted"
        >
          <Archive size={15} />
        </button>
      </div>
    </div>
  );
}
