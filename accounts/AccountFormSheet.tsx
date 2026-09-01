"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import { cn, formatVNDInput, parseVNDInput, uid } from "@/lib/utils";
import type { Account, AccountType } from "@/types";

const COLOR_OPTIONS = ["#B76E79", "#8F4F5A", "#5FBFA8", "#6FB3E5", "#9B7FD4", "#E5B96F", "#77C58A", "#E87878"];

const TYPE_LABEL: Record<AccountType, string> = {
  bank: "Tài khoản ngân hàng",
  cash: "Ví tiền mặt",
  savings: "Tài khoản tiết kiệm",
};

export function AccountFormSheet({
  open,
  onClose,
  editingAccount,
  onCreated,
  layer = "base",
}: {
  open: boolean;
  onClose: () => void;
  editingAccount?: Account | null;
  /** Called with the newly created account right after it's persisted (create mode only). */
  onCreated?: (account: Account) => void;
  /** Pass "nested" when opening this sheet on top of another already-open sheet. */
  layer?: "base" | "nested";
}) {
  const { data, saveAccount } = useData();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [lastFour, setLastFour] = useState("");
  const [balanceDisplay, setBalanceDisplay] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isFirstAccount = (data?.accounts ?? []).length === 0;

  useEffect(() => {
    if (!open) return;
    if (editingAccount) {
      setName(editingAccount.name);
      setInstitution(editingAccount.institution);
      setType(editingAccount.type);
      setLastFour(editingAccount.lastFourDigits ?? "");
      setBalanceDisplay(formatVNDInput(editingAccount.balance));
      setColor(editingAccount.color);
      setIsPrimary(editingAccount.isPrimary);
    } else {
      setName("");
      setInstitution("");
      setType("bank");
      setLastFour("");
      setBalanceDisplay("");
      setColor(COLOR_OPTIONS[0]);
      setIsPrimary(isFirstAccount);
    }
    setError("");
    setSaving(false);
  }, [open, editingAccount]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Vui lòng nhập tên tài khoản.");
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    const account: Account = {
      id: editingAccount?.id ?? uid("acc"),
      name: name.trim(),
      institution: institution.trim() || name.trim(),
      type,
      lastFourDigits: lastFour.trim() || undefined,
      balance: parseVNDInput(balanceDisplay),
      color,
      isPrimary: isFirstAccount ? true : isPrimary,
      isArchived: editingAccount?.isArchived ?? false,
      createdAt: editingAccount?.createdAt ?? now,
      updatedAt: now,
    };
    try {
      await saveAccount(account);
      showToast(editingAccount ? "Đã cập nhật tài khoản." : "Đã thêm tài khoản mới.");
      if (!editingAccount) onCreated?.(account);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu tài khoản. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={editingAccount ? "Sửa tài khoản" : "Thêm tài khoản"} layer={layer}>
      <div className="flex flex-col gap-5">
        <div>
          <Label htmlFor="acc-type">Loại tài khoản</Label>
          <Select id="acc-type" value={type} onChange={(e) => setType(e.target.value as AccountType)}>
            {(Object.keys(TYPE_LABEL) as AccountType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="acc-name">Tên tài khoản</Label>
          <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Vietcombank" />
          {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>

        <div>
          <Label htmlFor="acc-institution">Ngân hàng / nơi lưu trữ</Label>
          <Input
            id="acc-institution"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="Ví dụ: Vietcombank"
          />
        </div>

        {type !== "cash" && (
          <div>
            <Label htmlFor="acc-lastfour">4 số cuối (tuỳ chọn)</Label>
            <Input
              id="acc-lastfour"
              value={lastFour}
              maxLength={4}
              onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))}
              placeholder="1234"
            />
          </div>
        )}

        <div>
          <Label htmlFor="acc-balance">Số dư hiện tại</Label>
          <div className="relative">
            <Input
              id="acc-balance"
              inputMode="numeric"
              value={balanceDisplay}
              onChange={(e) => setBalanceDisplay(formatVNDInput(parseVNDInput(e.target.value)))}
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">đ</span>
          </div>
        </div>

        <div>
          <Label>Màu sắc</Label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Chọn màu ${c}`}
                className={cn(
                  "h-9 w-9 rounded-full border-2 transition-transform",
                  color === c ? "border-white scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <div className="min-w-0 flex-1">
            <span className="text-sm">Đặt làm tài khoản chính</span>
            {isFirstAccount && (
              <p className="text-[11px] text-text-muted mt-0.5">Tài khoản đầu tiên sẽ tự động là tài khoản chính.</p>
            )}
          </div>
          <Switch
            checked={isFirstAccount || isPrimary}
            onChange={setIsPrimary}
            disabled={isFirstAccount}
            aria-label="Đặt làm tài khoản chính"
          />
        </div>

        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Đang lưu…" : editingAccount ? "Lưu thay đổi" : "Thêm tài khoản"}
        </Button>
      </div>
    </Sheet>
  );
}
