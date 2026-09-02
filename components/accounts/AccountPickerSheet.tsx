"use client";

import { Check, Landmark, PiggyBank, Plus, Wallet } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { useCurrency } from "@/lib/currency-context";
import type { Account } from "@/types";

const TYPE_ICON = { bank: Landmark, cash: Wallet, savings: PiggyBank };

export function AccountPickerSheet({
  open,
  onClose,
  title,
  accounts,
  selectedId,
  onSelect,
  onAddNew,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  accounts: Account[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}) {
  const { formatMoney } = useCurrency();

  return (
    <Sheet open={open} onClose={onClose} title={title} layer="nested">
      <div className="flex flex-col gap-2">
        {accounts.map((a) => {
          const Icon = TYPE_ICON[a.type];
          const selected = a.id === selectedId;
          return (
            <button
              key={a.id}
              onClick={() => {
                onSelect(a.id);
                onClose();
              }}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition-colors min-h-[44px]"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${a.color}22`, color: a.color }}
              >
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {a.name} {a.isPrimary ? "· Chính" : ""}
                </p>
                <p className="text-xs text-text-muted truncate">{formatMoney(a.balance)}</p>
              </div>
              {selected && <Check size={18} className="text-accent-soft shrink-0" />}
            </button>
          );
        })}

        <button
          onClick={onAddNew}
          className="flex items-center gap-3 rounded-2xl border border-dashed border-white/15 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors min-h-[44px] text-accent-soft"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15">
            <Plus size={18} />
          </div>
          <span className="text-sm font-medium">Thêm tài khoản hoặc ví mới</span>
        </button>
      </div>
    </Sheet>
  );
}
