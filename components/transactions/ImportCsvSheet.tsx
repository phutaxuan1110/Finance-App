"use client";

import { useState } from "react";
import { Upload, ShieldCheck, AlertTriangle, Check } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Input";
import { useData } from "@/lib/data-context";
import { useCurrency } from "@/lib/currency-context";
import { useToast } from "@/lib/toast-context";
import { uid } from "@/lib/utils";
import type { Transaction } from "@/types";

interface CsvRow {
  raw: string[];
  date?: string;
  description?: string;
  amount?: number;
  type?: "income" | "expense";
  isDuplicate?: boolean;
  skip?: boolean;
}

type Step = "upload" | "map" | "review";

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
}

function tryParseDate(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

export function ImportCsvSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, saveTransaction } = useData();
  const { formatMoney } = useCurrency();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [dateCol, setDateCol] = useState("0");
  const [descCol, setDescCol] = useState("1");
  const [amountCol, setAmountCol] = useState("2");
  const [typeCol, setTypeCol] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState(data?.settings.defaultAccountId ?? "");
  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState("");

  const accounts = (data?.accounts ?? []).filter((a) => !a.isArchived);

  function reset() {
    setStep("upload");
    setHeaders([]);
    setRows([]);
    setParsedRows([]);
    setFileName("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const table = parseCsv(text);
      if (table.length === 0) {
        showToast("Tệp CSV trống hoặc không hợp lệ.", "error");
        return;
      }
      setHeaders(table[0]);
      setRows(table.slice(1));
      setStep("map");
    };
    reader.readAsText(file);
  }

  function buildPreview() {
    const existingTx = data?.transactions ?? [];
    const dateIdx = Number(dateCol);
    const descIdx = Number(descCol);
    const amountIdx = Number(amountCol);
    const typeIdx = typeCol ? Number(typeCol) : -1;

    const preview: CsvRow[] = rows.map((raw) => {
      const dateStr = raw[dateIdx] ?? "";
      const description = raw[descIdx] ?? "";
      const amountRaw = (raw[amountIdx] ?? "0").replace(/[^\d.-]/g, "");
      let amount = parseFloat(amountRaw) || 0;
      let type: "income" | "expense" = amount < 0 ? "expense" : "income";
      if (typeIdx >= 0) {
        const t = (raw[typeIdx] ?? "").toLowerCase();
        if (t.includes("chi") || t.includes("debit") || t.includes("expense")) type = "expense";
        else if (t.includes("thu") || t.includes("credit") || t.includes("income")) type = "income";
      }
      amount = Math.abs(Math.round(amount));
      const isoDate = tryParseDate(dateStr) ?? new Date().toISOString();

      const isDuplicate = existingTx.some(
        (t) =>
          t.amount === amount &&
          Math.abs(new Date(t.date).getTime() - new Date(isoDate).getTime()) < 1000 * 60 * 60 * 24 &&
          (t.merchant ?? "").toLowerCase() === description.toLowerCase()
      );

      return { raw, date: isoDate, description, amount, type, isDuplicate, skip: isDuplicate };
    });

    setParsedRows(preview);
    setStep("review");
  }

  function toggleSkip(index: number) {
    setParsedRows((prev) => prev.map((r, i) => (i === index ? { ...r, skip: !r.skip } : r)));
  }

  async function handleConfirm() {
    if (!destinationAccountId) {
      showToast("Vui lòng chọn tài khoản đích.", "error");
      return;
    }
    const now = new Date().toISOString();
    let imported = 0;
    for (const row of parsedRows) {
      if (row.skip) continue;
      const transaction: Transaction = {
        id: uid("txn"),
        type: row.type ?? "expense",
        amount: row.amount ?? 0,
        accountId: destinationAccountId,
        merchant: row.description,
        date: row.date ?? now,
        isRecurring: false,
        createdAt: now,
        updatedAt: now,
      };
      await saveTransaction(transaction);
      imported++;
    }
    showToast(`Đã nhập ${imported} giao dịch từ sao kê.`);
    handleClose();
  }

  const columnOptions = headers.map((h, i) => ({ label: h || `Cột ${i + 1}`, value: String(i) }));
  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;

  return (
    <Sheet open={open} onClose={handleClose} title="Nhập sao kê ngân hàng (CSV)">
      <div className="rounded-2xl bg-accent/10 border border-accent/20 px-4 py-3 flex gap-2.5 mb-5">
        <ShieldCheck size={18} className="text-accent-soft shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted">
          Dữ liệu của bạn được lưu trên thiết bị này. Ứng dụng không yêu cầu thông tin đăng nhập ngân hàng.
        </p>
      </div>

      {step === "upload" && (
        <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 py-12 text-sm text-text-muted cursor-pointer hover:bg-white/[0.03]">
          <Upload size={28} />
          <span>Chọn tệp CSV sao kê để tải lên</span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        </label>
      )}

      {step === "map" && (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-text-muted">
            Đã tải <span className="text-text-primary font-medium">{fileName}</span> · {rows.length} dòng dữ liệu.
          </p>

          <div>
            <Label htmlFor="col-date">Cột ngày giao dịch</Label>
            <Select id="col-date" value={dateCol} onChange={(e) => setDateCol(e.target.value)}>
              {columnOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="col-desc">Cột mô tả / nội dung</Label>
            <Select id="col-desc" value={descCol} onChange={(e) => setDescCol(e.target.value)}>
              {columnOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="col-amount">Cột số tiền</Label>
            <Select id="col-amount" value={amountCol} onChange={(e) => setAmountCol(e.target.value)}>
              {columnOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="col-type">Cột loại giao dịch (tuỳ chọn)</Label>
            <Select id="col-type" value={typeCol} onChange={(e) => setTypeCol(e.target.value)}>
              <option value="">Tự suy luận từ dấu số tiền</option>
              {columnOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="col-account">Tài khoản đích</Label>
            <Select id="col-account" value={destinationAccountId} onChange={(e) => setDestinationAccountId(e.target.value)}>
              <option value="">Chọn tài khoản</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>

          <Button onClick={buildPreview}>Xem trước dữ liệu</Button>
        </div>
      )}

      {step === "review" && (
        <div className="flex flex-col gap-4">
          {duplicateCount > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-warning/10 border border-warning/20 px-4 py-3 text-xs text-warning">
              <AlertTriangle size={16} />
              Phát hiện {duplicateCount} giao dịch có thể trùng lặp — đã được bỏ chọn tự động.
            </div>
          )}
          <div className="max-h-80 overflow-y-auto flex flex-col divide-y divide-white/[0.06]">
            {parsedRows.map((row, i) => (
              <button key={i} onClick={() => toggleSkip(i)} className="flex items-center gap-3 py-3 text-left">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    row.skip ? "border-white/20 bg-transparent" : "border-accent bg-accent"
                  }`}
                >
                  {!row.skip && <Check size={13} className="text-white" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{row.description || "(không có mô tả)"}</p>
                  <p className="text-[11px] text-text-muted">
                    {row.date ? new Date(row.date).toLocaleDateString("vi-VN") : ""}
                    {row.isDuplicate ? " · Có thể trùng" : ""}
                  </p>
                </div>
                <span className={`text-sm font-medium tabular-nums ${row.type === "income" ? "text-success" : "text-danger"}`}>
                  {row.type === "income" ? "+" : "-"}
                  {formatMoney(row.amount ?? 0)}
                </span>
              </button>
            ))}
          </div>
          <Button onClick={handleConfirm}>Nhập {parsedRows.filter((r) => !r.skip).length} giao dịch</Button>
        </div>
      )}
    </Sheet>
  );
}
