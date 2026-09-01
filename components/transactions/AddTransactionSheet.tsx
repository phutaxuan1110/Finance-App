"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowDownCircle, ArrowUpCircle, Camera, ChevronDown, Plus, Repeat, X } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { CategoryVisual } from "@/components/finance/CategoryVisual";
import { cn, formatVNDInput, getErrorMessage, parseVNDInput, uid } from "@/lib/utils";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import type { Transaction, TransactionType } from "@/types";
import { buildDateRangeSeries, computeDateRangeDays, countDateRangeDays, MAX_DATE_RANGE_DAYS } from "@/lib/recurrence";
import { CategoryFormDialog } from "@/components/finance/CategoryFormDialog";
import { AccountPickerSheet } from "@/components/accounts/AccountPickerSheet";
import { AccountFormSheet } from "@/components/accounts/AccountFormSheet";
import type { Account } from "@/types";

export type EditScope = "only" | "future" | "all";

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
  /** For a recurring transaction, which occurrences an edit should apply to. Ignored for non-recurring edits. */
  editScope?: EditScope;
  /** Preset the transaction date (e.g. tapped from a specific day on the calendar). Ignored when editing. */
  prefillDate?: Date;
}

const TYPE_OPTIONS: { type: Extract<TransactionType, "expense" | "income">; label: string; icon: typeof ArrowDownCircle }[] = [
  { type: "expense", label: "Chi", icon: ArrowDownCircle },
  { type: "income", label: "Thu", icon: ArrowUpCircle },
];

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function nowLocalInputValue(date?: string) {
  return toLocalInputValue(date ? new Date(date) : new Date());
}

/** "YYYY-MM-DD" for a Date, for use as an `<input type="date">` value. */
function toDateOnlyInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses a "YYYY-MM-DD" `<input type="date">` value as a LOCAL calendar
 * date at midnight — never via `new Date(str)` alone / `toISOString()`,
 * which would risk a UTC/timezone shift landing on the wrong day. */
function parseDateOnlyInputValue(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function AddTransactionSheet({ open, onClose, editingTransaction, editScope = "only", prefillDate }: AddTransactionSheetProps) {
  const { data, saveTransaction, addTransactionsBatch, replaceTransactionsBatch } = useData();
  const { showToast } = useToast();

  const [step, setStep] = useState<"type" | "form">("type");
  const [type, setType] = useState<TransactionType>("expense");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [dateValue, setDateValue] = useState(nowLocalInputValue());
  const [isRecurring, setIsRecurring] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Recurrence config (only relevant when creating a brand-new recurring
  // transaction): a plain inclusive calendar-day range, not a
  // frequency/count-based rule — see lib/recurrence.ts for why.
  const [rangeStartStr, setRangeStartStr] = useState("");
  const [rangeEndStr, setRangeEndStr] = useState("");

  // Inline category / account creation
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [accountFormOpen, setAccountFormOpen] = useState(false);

  const accounts = useMemo(() => (data?.accounts ?? []).filter((a) => !a.isArchived), [data]);
  const categories = useMemo(
    () => (data?.categories ?? []).filter((c) => c.type === (type === "income" ? "income" : "expense")),
    [data, type]
  );
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const isBulkScopeEdit = !!editingTransaction?.recurringSeriesId && editScope !== "only";

  // Real-time required-field state, independent of whether the user has
  // attempted to submit yet — the CTA's disabled state and the account /
  // category supporting text both need to reflect this live, not only
  // after a failed Save attempt.
  const amountValue = parseVNDInput(amountDisplay);
  const accountMissing = !accountId;
  const categoryMissing = !categoryId;

  const isNewRecurring = !editingTransaction && isRecurring;
  const rangeStart = parseDateOnlyInputValue(rangeStartStr);
  const rangeEnd = parseDateOnlyInputValue(rangeEndStr);
  const rangeMissing = isNewRecurring && (!rangeStart || !rangeEnd);
  const rangeReversed = isNewRecurring && !!rangeStart && !!rangeEnd && rangeEnd.getTime() < rangeStart.getTime();
  // Same-day range (rangeStart === rangeEnd) is valid and yields exactly 1
  // occurrence — only a genuinely reversed range is an error.
  const rangeDayCount = isNewRecurring ? countDateRangeDays(rangeStart, rangeEnd) : 0;
  const rangeTooLong = isNewRecurring && rangeDayCount > MAX_DATE_RANGE_DAYS;
  const recurringRangeInvalid = rangeMissing || rangeReversed || rangeTooLong;

  const canSave =
    amountValue > 0 && !accountMissing && !categoryMissing && Boolean(dateValue) && !recurringRangeInvalid;

  useEffect(() => {
    if (!open) return;

    // Safety net: this sheet no longer knows how to edit transfers. The
    // caller (transaction row / calendar day sheet) is responsible for
    // routing transfer edits to the Transfer sheet instead, but we guard
    // here too so the app can never crash if that contract is violated.
    if (editingTransaction && editingTransaction.type === "transfer") {
      onClose();
      return;
    }

    if (editingTransaction) {
      setStep("form");
      setType(editingTransaction.type);
      setAmountDisplay(formatVNDInput(editingTransaction.amount));
      setAccountId(editingTransaction.accountId);
      setCategoryId(editingTransaction.categoryId ?? "");
      setMerchant(editingTransaction.merchant ?? "");
      setNote(editingTransaction.note ?? "");
      setDateValue(nowLocalInputValue(editingTransaction.date));
      setIsRecurring(editingTransaction.isRecurring);
      setReceiptPreview(editingTransaction.receiptUrl);
    } else {
      const initialDate = prefillDate ?? new Date();
      setStep("type");
      setType("expense");
      setAmountDisplay("");
      setAccountId(data?.settings.defaultAccountId || data?.meta.lastRecentAccountId || accounts[0]?.id || "");
      setCategoryId(data?.meta.lastRecentCategoryId || "");
      setMerchant("");
      setNote("");
      setDateValue(toLocalInputValue(initialDate));
      setIsRecurring(false);
      setReceiptPreview(undefined);
      // Default both ends of the range to the same day as the transaction
      // date, so simply flipping the switch on (without touching anything
      // else) starts from a valid, non-error state — a single-day series.
      const initialRangeStr = toDateOnlyInputValue(initialDate);
      setRangeStartStr(initialRangeStr);
      setRangeEndStr(initialRangeStr);
    }
    setErrors({});
    setSaving(false);
  }, [open, editingTransaction, prefillDate]); // eslint-disable-line react-hooks/exhaustive-deps

  function pickType(t: TransactionType) {
    setType(t);
    const defaultCat = (data?.categories ?? []).find((c) => c.type === (t === "income" ? "income" : "expense"));
    setCategoryId(defaultCat?.id ?? "");
    setStep("form");
  }

  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3_000_000) {
      showToast("Ảnh quá lớn, vui lòng chọn ảnh dưới 3MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleCategoryCreated(category: { id: string }) {
    setCategoryId(category.id);
    setCategoryDialogOpen(false);
  }

  function handleAccountCreated(account: Account) {
    setAccountId(account.id);
    setAccountFormOpen(false);
    setAccountPickerOpen(false);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const amount = parseVNDInput(amountDisplay);
    if (!amount || amount <= 0) newErrors.amount = "Vui lòng nhập số tiền hợp lệ.";
    if (!accountId) newErrors.accountId = "Vui lòng chọn tài khoản hoặc ví.";
    if (!categoryId) newErrors.categoryId = "Vui lòng chọn danh mục.";
    if (!dateValue) newErrors.dateValue = "Vui lòng chọn ngày giờ.";
    if (isNewRecurring) {
      if (rangeMissing) newErrors.recurrence = "Vui lòng chọn từ ngày và đến ngày.";
      else if (rangeReversed) newErrors.recurrence = "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.";
      else if (rangeTooLong) newErrors.recurrence = `Khoảng ngày quá dài (tối đa ${MAX_DATE_RANGE_DAYS} ngày).`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (saving) return; // guard against double-click creating duplicate series
    if (!canSave) return; // CTA should already be disabled in this case, but never trust that alone
    if (!validate()) return;
    setSaving(true);

    try {
      const amount = parseVNDInput(amountDisplay);
      const now = new Date().toISOString();

      // --- Editing multiple occurrences of a recurring series at once ---
      if (editingTransaction && isBulkScopeEdit) {
        const seriesId = editingTransaction.recurringSeriesId!;
        const anchorIndex = editingTransaction.recurrenceIndex ?? 0;
        const scopeTx = (data?.transactions ?? []).filter(
          (t) =>
            t.recurringSeriesId === seriesId &&
            (editScope === "all" || (t.recurrenceIndex ?? 0) >= anchorIndex)
        );
        const pairs = scopeTx.map((t) => ({
          previous: t,
          transaction: {
            ...t,
            amount,
            accountId,
            categoryId,
            merchant: merchant || undefined,
            note: note || undefined,
            updatedAt: now,
          } as Transaction,
        }));
        await replaceTransactionsBatch(pairs);
        showToast(`Đã cập nhật ${pairs.length} giao dịch trong chuỗi.`);
        onClose();
        return;
      }

      // --- Creating a brand-new recurring series: one transaction per
      // calendar day in [rangeStart, rangeEnd], inclusive. Generated and
      // inserted immediately (as one batch) — never a stored "rule" waiting
      // on some future job to expand it. ---
      if (isNewRecurring && rangeStart && rangeEnd) {
        const timeOfDay = new Date(dateValue);
        const series = buildDateRangeSeries(
          { type, amount, accountId, categoryId, merchant: merchant || undefined, note: note || undefined },
          rangeStart,
          rangeEnd,
          timeOfDay
        );
        if (series.length === 0) {
          // canSave already guards against this, but never trust that alone.
          showToast("Khoảng ngày không hợp lệ.", "error");
          return;
        }
        await addTransactionsBatch(series);
        showToast(`Đã tạo ${series.length} giao dịch.`);
        onClose();
        return;
      }

      // --- Normal single create / single edit ---
      const iso = new Date(dateValue).toISOString();
      const transaction: Transaction = {
        id: editingTransaction?.id ?? uid("txn"),
        type,
        amount,
        accountId,
        categoryId,
        merchant: merchant || undefined,
        note: note || undefined,
        date: iso,
        receiptUrl: receiptPreview,
        isRecurring: editingTransaction?.isRecurring ?? false,
        recurringSeriesId: editingTransaction?.recurringSeriesId,
        recurrenceIndex: editingTransaction?.recurrenceIndex,
        recurrenceFrequency: editingTransaction?.recurrenceFrequency,
        recurrenceInterval: editingTransaction?.recurrenceInterval,
        recurrenceStartDate: editingTransaction?.recurrenceStartDate,
        recurrenceEndDate: editingTransaction?.recurrenceEndDate,
        recurrenceCount: editingTransaction?.recurrenceCount,
        createdAt: editingTransaction?.createdAt ?? now,
        updatedAt: now,
      };

      await saveTransaction(transaction, editingTransaction ?? undefined);
      showToast(editingTransaction ? "Đã cập nhật giao dịch." : "Đã lưu giao dịch.");
      onClose();
    } catch (err) {
      // A multi-day batch can fail partway through the underlying store;
      // never let the dialog look like it succeeded when it didn't. Data
      // already entered stays intact so the user can just hit Lưu again.
      showToast(getErrorMessage(err, "Không thể lưu giao dịch. Vui lòng thử lại."), "error");
    } finally {
      setSaving(false);
    }
  }

  const title =
    step === "type"
      ? "Thêm giao dịch"
      : editingTransaction
        ? isBulkScopeEdit
          ? editScope === "all"
            ? "Sửa toàn bộ chuỗi"
            : "Sửa kỳ này trở đi"
          : "Sửa giao dịch"
        : type === "expense"
          ? "Thêm khoản chi"
          : "Thêm khoản thu";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        step === "form" ? (
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
              Huỷ
            </Button>
            <Button type="submit" form="txn-form" className="flex-1" disabled={saving || !canSave}>
              {saving ? "Đang lưu…" : "Lưu"}
            </Button>
          </div>
        ) : undefined
      }
    >
      {step === "type" && (
        <div className="grid grid-cols-2 gap-3">
          {TYPE_OPTIONS.map(({ type: t, label, icon: Icon }) => (
            <button
              key={t}
              onClick={() => pickType(t)}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] py-8 hover:bg-white/[0.08] transition-colors min-h-[44px]"
            >
              <Icon size={28} className={cn(t === "expense" && "text-danger", t === "income" && "text-success")} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      )}

      {step === "form" && (
        <form
          id="txn-form"
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {/* Amount - visual focus */}
          <div className="flex flex-col items-center py-4">
            <span className="text-xs text-text-muted mb-1">Số tiền</span>
            <div className="flex items-baseline gap-1">
              <input
                autoFocus
                inputMode="numeric"
                value={amountDisplay}
                onChange={(e) => setAmountDisplay(formatVNDInput(parseVNDInput(e.target.value)))}
                placeholder="0"
                aria-label="Số tiền"
                className={cn(
                  "bg-transparent text-center outline-none text-4xl font-semibold tabular-nums w-full max-w-[240px]",
                  type === "expense" && "text-danger",
                  type === "income" && "text-success"
                )}
              />
              <span className="text-2xl font-semibold text-text-muted">đ</span>
            </div>
            {errors.amount && <p className="text-xs text-danger mt-2">{errors.amount}</p>}
          </div>

          <div>
            <Label htmlFor="accountField">Tài khoản / ví</Label>
            <button
              type="button"
              id="accountField"
              onClick={() => setAccountPickerOpen(true)}
              className="flex h-12 w-full items-center justify-between rounded-2xl bg-white/[0.06] border border-white/[0.08] px-4 text-sm text-left outline-none transition-colors focus:border-accent-soft"
            >
              <span className={selectedAccount ? "text-text-primary" : "text-text-muted"}>
                {selectedAccount ? `${selectedAccount.name}${selectedAccount.isPrimary ? " · Chính" : ""}` : "Chọn tài khoản"}
              </span>
              <ChevronDown size={16} className="text-text-muted shrink-0" />
            </button>
            {accountMissing && <p className="text-xs text-danger mt-1">Vui lòng chọn tài khoản hoặc ví.</p>}
          </div>

          <div>
            <Label>Danh mục</Label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-[11px] transition-colors min-h-[44px]",
                    categoryId === c.id
                      ? "border-accent bg-accent/15 text-accent-soft"
                      : "border-white/[0.08] bg-white/[0.03] text-text-muted hover:bg-white/[0.06]"
                  )}
                >
                  <span className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full">
                    <CategoryVisual category={c} size={18} />
                  </span>
                  <span className="text-center leading-tight">{c.name}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCategoryDialogOpen(true)}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-white/15 py-3 text-[11px] text-accent-soft hover:bg-white/[0.03] transition-colors min-h-[44px]"
              >
                <Plus size={18} />
                <span className="text-center leading-tight">Thêm mới</span>
              </button>
            </div>
            {categoryMissing && <p className="text-xs text-danger mt-1">Vui lòng chọn danh mục.</p>}
          </div>

          <div>
            <Label htmlFor="dateValue">Ngày và giờ</Label>
            <Input
              id="dateValue"
              type="datetime-local"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              disabled={isBulkScopeEdit}
            />
            {isBulkScopeEdit && (
              <p className="text-[11px] text-text-muted mt-1">Ngày của từng giao dịch trong chuỗi được giữ nguyên.</p>
            )}
          </div>

          <div>
            <Label htmlFor="merchant">Người nhận / cửa hàng</Label>
            <Input
              id="merchant"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Ví dụ: Highlands Coffee"
            />
          </div>

          <div>
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Thêm ghi chú (không bắt buộc)" />
          </div>

          {!editingTransaction && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Repeat size={18} className="text-text-muted shrink-0" />
                  <span className="text-sm">Giao dịch định kỳ</span>
                </div>
                <Switch checked={isRecurring} onChange={setIsRecurring} aria-label="Giao dịch định kỳ" />
              </div>

              {isRecurring && (
                <div className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="rangeStart">Từ ngày</Label>
                    <Input
                      id="rangeStart"
                      type="date"
                      value={rangeStartStr}
                      onChange={(e) => setRangeStartStr(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="rangeEnd">Đến ngày</Label>
                    <Input
                      id="rangeEnd"
                      type="date"
                      value={rangeEndStr}
                      min={rangeStartStr || undefined}
                      onChange={(e) => setRangeEndStr(e.target.value)}
                    />
                  </div>

                  {rangeReversed && (
                    <p className="text-xs text-danger -mt-2">Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.</p>
                  )}
                  {!rangeReversed && rangeTooLong && (
                    <p className="text-xs text-danger -mt-2">
                      Khoảng ngày quá dài (tối đa {MAX_DATE_RANGE_DAYS} ngày).
                    </p>
                  )}

                  {!rangeReversed && !rangeTooLong && rangeDayCount > 0 && (
                    <div>
                      <p className="text-xs text-text-muted mb-2">
                        Sẽ tạo <span className="text-text-primary font-medium">{rangeDayCount}</span> giao dịch
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {computeDateRangeDays(rangeStart!, rangeEnd!)
                          .slice(0, 12)
                          .map((d, i) => (
                            <span key={i} className="text-[11px] rounded-full bg-white/[0.06] px-2.5 py-1 tabular-nums">
                              {format(d, "dd/MM/yyyy")}
                            </span>
                          ))}
                        {rangeDayCount > 12 && (
                          <span className="text-[11px] rounded-full bg-white/[0.06] px-2.5 py-1">
                            +{rangeDayCount - 12} ngày khác
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {errors.recurrence && <p className="text-xs text-danger">{errors.recurrence}</p>}
            </div>
          )}

          <div>
            <Label>Ảnh hóa đơn (tuỳ chọn)</Label>
            {receiptPreview ? (
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={receiptPreview} alt="Xem trước hóa đơn" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setReceiptPreview(undefined)}
                  aria-label="Xoá ảnh hóa đơn"
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-6 text-sm text-text-muted cursor-pointer hover:bg-white/[0.03] min-h-[44px]">
                <Camera size={18} />
                Chọn ảnh
                <input type="file" accept="image/*" className="hidden" onChange={handleReceiptChange} />
              </label>
            )}
            <p className="text-[11px] text-text-muted mt-1">
              Ảnh chỉ được lưu tạm trên trình duyệt này để xem trước, có thể không tồn tại lâu dài do giới hạn lưu trữ cục bộ.
            </p>
          </div>
        </form>
      )}

      <CategoryFormDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        kind={type === "income" ? "income" : "expense"}
        onSaved={handleCategoryCreated}
      />
      <AccountPickerSheet
        open={accountPickerOpen}
        onClose={() => setAccountPickerOpen(false)}
        title="Chọn tài khoản / ví"
        accounts={accounts}
        selectedId={accountId}
        onSelect={setAccountId}
        onAddNew={() => {
          setAccountPickerOpen(false);
          setAccountFormOpen(true);
        }}
      />
      <AccountFormSheet
        open={accountFormOpen}
        onClose={() => setAccountFormOpen(false)}
        onCreated={handleAccountCreated}
        layer="nested"
      />
    </Sheet>
  );
}
