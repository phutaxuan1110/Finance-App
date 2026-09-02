"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Info,
  ChevronRight,
  Tags,
  Cloud,
  CloudOff,
  LogOut,
  Pencil,
  Plus,
} from "lucide-react";
import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { useCurrency } from "@/lib/currency-context";
import { useToast } from "@/lib/toast-context";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SnakeMascot } from "@/components/mascot/SnakeMascot";
import { CategoryVisual } from "@/components/finance/CategoryVisual";
import { CategoryFormDialog } from "@/components/finance/CategoryFormDialog";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { CURRENCIES } from "@/lib/currency";
import { cn, formatVND, formatVNDInput, parseVNDInput } from "@/lib/utils";
import type { Category, CategoryKind, UserSettings } from "@/types";

export default function SettingsPage() {
  const { data, loading, isCloudSynced, saveSettings, resetDemoData, wipeAllData, exportJSON, importJSON } = useData();
  const { user, isCloudEnabled, signOut } = useAuth();
  const { currency, setCurrency, rates, ratesLoading, ratesError, refreshRates } = useCurrency();
  const { showToast } = useToast();
  const router = useRouter();

  const [name, setName] = useState(data?.settings.name ?? "");
  const [monthStartDay, setMonthStartDay] = useState(data?.settings.financialMonthStartDay ?? 1);
  const [defaultLimitDisplay, setDefaultLimitDisplay] = useState(
    data ? formatVNDInput(data.settings.defaultMonthlyLimit) : ""
  );
  const [defaultAccountId, setDefaultAccountId] = useState(data?.settings.defaultAccountId ?? "");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryDialogKind, setCategoryDialogKind] = useState<CategoryKind>("expense");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading || !data) {
    return <div className="py-20 text-center text-text-muted">Đang tải dữ liệu…</div>;
  }

  // Sync local state once data has loaded (first paint may be before load)
  if (name === "" && data.settings.name) {
    setName(data.settings.name);
  }

  async function handleSaveProfile() {
    const settings: UserSettings = {
      ...data!.settings,
      name: name.trim() || "Bạn",
      financialMonthStartDay: monthStartDay,
      defaultMonthlyLimit: parseVNDInput(defaultLimitDisplay),
      defaultAccountId: defaultAccountId || undefined,
    };
    await saveSettings(settings);
    showToast("Đã lưu thông tin cá nhân.");
  }

  async function handleCurrencyChange(next: UserSettings["currency"]) {
    try {
      await setCurrency(next);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể lưu đơn vị tiền tệ.", "error");
    }
  }

  async function handleExport() {
    const json = await exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snek-du-lieu-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã xuất dữ liệu JSON.");
  }

  async function handleExportCsv() {
    const transactions = data!.transactions;
    const header = "Ngày,Loại,Số tiền,Tài khoản,Danh mục,Người nhận,Ghi chú\n";
    const rows = transactions
      .map((t) => {
        const account = data!.accounts.find((a) => a.id === t.accountId)?.name ?? "";
        const category = data!.categories.find((c) => c.id === t.categoryId)?.name ?? "";
        const typeLabel = t.type === "income" ? "Thu" : t.type === "expense" ? "Chi" : "Chuyển tiền";
        const fields = [
          new Date(t.date).toLocaleString("vi-VN"),
          typeLabel,
          String(t.amount),
          account,
          category,
          t.merchant ?? "",
          (t.note ?? "").replace(/,/g, ";"),
        ];
        return fields.map((f) => `"${f}"`).join(",");
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snek-giao-dich-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã xuất giao dịch dưới dạng CSV.");
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importJSON(text);
      showToast("Đã khôi phục dữ liệu thành công.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể nhập tệp dữ liệu.", "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/dang-nhap");
  }

  function openAddCategory(k: CategoryKind) {
    setEditingCategory(null);
    setCategoryDialogKind(k);
    setCategoryDialogOpen(true);
  }

  function openEditCategory(c: Category) {
    setEditingCategory(c);
    setCategoryDialogKind(c.type);
    setCategoryDialogOpen(true);
  }

  const expenseCategories = data.categories.filter((c) => c.type === "expense");
  const incomeCategories = data.categories.filter((c) => c.type === "income");

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Cá nhân</h1>

      <Card className="flex items-center gap-4">
        <SnakeMascot expression="happy" size={56} />
        <div className="min-w-0">
          <p className="font-semibold truncate">{data.settings.name}</p>
          <p className="text-xs text-text-muted truncate">
            {APP_NAME} · {APP_TAGLINE}
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-1">
          {isCloudSynced ? (
            <Cloud size={18} className="text-success" />
          ) : (
            <CloudOff size={18} className="text-text-muted" />
          )}
          <CardTitle>{isCloudSynced ? "Đã đồng bộ trên đám mây" : "Chỉ lưu trên thiết bị này"}</CardTitle>
        </div>
        {isCloudSynced ? (
          <>
            <p className="text-sm text-text-muted mb-4">
              Dữ liệu của bạn được lưu vào tài khoản{" "}
              <span className="text-text-primary font-medium">{user?.email}</span> và có thể xem trên mọi thiết bị.
            </p>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut size={16} /> Đăng xuất
            </Button>
          </>
        ) : isCloudEnabled ? (
          <>
            <p className="text-sm text-text-muted mb-4">
              Đăng nhập để đồng bộ dữ liệu lên tài khoản và xem trên nhiều thiết bị.
            </p>
            <Button onClick={() => router.push("/dang-nhap")}>Đăng nhập / Đăng ký</Button>
          </>
        ) : (
          <p className="text-sm text-text-muted">
            Tính năng đăng nhập và đồng bộ đám mây chưa được cấu hình cho bản dựng này.
          </p>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-4">Thông tin cá nhân</CardTitle>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="settings-name">Tên hiển thị</Label>
            <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="settings-start-day">Ngày bắt đầu tháng tài chính</Label>
            <Select
              id="settings-start-day"
              value={monthStartDay}
              onChange={(e) => setMonthStartDay(Number(e.target.value))}
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Ngày {d}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="settings-default-account">Tài khoản mặc định</Label>
            <Select id="settings-default-account" value={defaultAccountId} onChange={(e) => setDefaultAccountId(e.target.value)}>
              <option value="">Không đặt</option>
              {data.accounts.filter((a) => !a.isArchived).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="settings-default-limit">Giới hạn chi tiêu mặc định hàng tháng</Label>
            <div className="relative">
              <Input
                id="settings-default-limit"
                inputMode="numeric"
                value={defaultLimitDisplay}
                onChange={(e) => setDefaultLimitDisplay(formatVNDInput(parseVNDInput(e.target.value)))}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">đ</span>
            </div>
          </div>
          <Button onClick={handleSaveProfile}>Lưu thay đổi</Button>
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-1">Đơn vị tiền tệ hiển thị</CardTitle>
        <p className="text-xs text-text-muted mb-4">
          Chỉ đổi cách hiển thị số tiền trên toàn app — dữ liệu gốc vẫn luôn được lưu bằng VNĐ.
        </p>
        <div className="flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/[0.08] p-1 w-fit">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => handleCurrencyChange(c.code)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px]",
                currency === c.code ? "bg-accent text-white" : "text-text-muted hover:text-text-primary"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {currency !== "VND" && (
          <div className="mt-3 text-xs text-text-muted">
            {ratesLoading && "Đang tải tỷ giá…"}
            {!ratesLoading && ratesError && <span className="text-danger">{ratesError}</span>}
            {!ratesLoading && !ratesError && rates && (
              <span>
                Tỷ giá: 1 {currency} ≈ {formatVND(Math.round(1 / rates[currency]))} · cập nhật{" "}
                {new Date(rates.fetchedAt).toLocaleString("vi-VN")}{" "}
                <button onClick={refreshRates} className="text-accent-soft hover:underline">
                  Làm mới
                </button>
              </span>
            )}
          </div>
        )}
      </Card>

      <Card>
        <button
          onClick={() => setCategoriesOpen((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Tags size={18} className="text-text-muted" />
            <CardTitle>Quản lý danh mục</CardTitle>
          </div>
          <ChevronRight size={16} className={`text-text-muted transition-transform ${categoriesOpen ? "rotate-90" : ""}`} />
        </button>
        {categoriesOpen && (
          <div className="flex flex-col gap-5 mt-4">
            <CategoryGroup
              title="Danh mục chi"
              categories={expenseCategories}
              onAdd={() => openAddCategory("expense")}
              onEdit={openEditCategory}
            />
            <CategoryGroup
              title="Danh mục thu"
              categories={incomeCategories}
              onAdd={() => openAddCategory("income")}
              onEdit={openEditCategory}
            />
          </div>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-4">Dữ liệu</CardTitle>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} /> Xuất toàn bộ dữ liệu (JSON)
          </Button>
          <Button variant="secondary" onClick={handleExportCsv}>
            <Download size={16} /> Xuất giao dịch (CSV)
          </Button>
          <Button variant="secondary" onClick={handleImportClick}>
            <Upload size={16} /> Nhập / khôi phục dữ liệu
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          <Button variant="outline" onClick={() => setResetConfirmOpen(true)}>
            <RotateCcw size={16} /> Đặt lại dữ liệu mẫu
          </Button>
          <Button variant="danger" onClick={() => setWipeConfirmOpen(true)}>
            Xoá toàn bộ dữ liệu
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={18} className="text-accent-soft" />
          <CardTitle>Quyền riêng tư</CardTitle>
        </div>
        <p className="text-sm text-text-muted leading-relaxed">
          {isCloudSynced
            ? "Dữ liệu của bạn được lưu trong tài khoản Supabase riêng của bạn, được bảo vệ bằng Row Level Security nên chỉ bạn mới đọc được. "
            : "Dữ liệu của bạn được lưu trên thiết bị này. "}
          Ứng dụng không yêu cầu thông tin đăng nhập ngân hàng, mã OTP, mã PIN thẻ hoặc số thẻ đầy đủ. SNEK không gửi
          dữ liệu tài chính của bạn ra bất kỳ máy chủ nào khác ngoài tài khoản của chính bạn.
        </p>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Info size={18} className="text-text-muted" />
          <CardTitle>Thông tin ứng dụng</CardTitle>
        </div>
        <p className="text-sm text-text-muted">
          {APP_NAME} · Phiên bản MVP · Dữ liệu mẫu tạo lúc {data.meta.seededAt ? new Date(data.meta.seededAt).toLocaleDateString("vi-VN") : "—"}
        </p>
      </Card>

      <ConfirmDialog
        open={resetConfirmOpen}
        title="Đặt lại dữ liệu mẫu?"
        description="Toàn bộ dữ liệu hiện tại sẽ được thay thế bằng dữ liệu mẫu minh hoạ."
        confirmLabel="Đặt lại"
        onCancel={() => setResetConfirmOpen(false)}
        onConfirm={async () => {
          await resetDemoData();
          showToast("Đã đặt lại dữ liệu mẫu.");
          setResetConfirmOpen(false);
        }}
      />
      <ConfirmDialog
        open={wipeConfirmOpen}
        title="Xoá toàn bộ dữ liệu?"
        description="Hành động này sẽ xoá vĩnh viễn tất cả tài khoản, giao dịch và cài đặt trên thiết bị này."
        confirmLabel="Xoá tất cả"
        onCancel={() => setWipeConfirmOpen(false)}
        onConfirm={async () => {
          await wipeAllData();
          showToast("Đã xoá toàn bộ dữ liệu.");
          setWipeConfirmOpen(false);
        }}
      />

      <CategoryFormDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        kind={categoryDialogKind}
        editingCategory={editingCategory}
      />
    </div>
  );
}

function CategoryGroup({
  title,
  categories,
  onAdd,
  onEdit,
}: {
  title: string;
  categories: Category[];
  onAdd: () => void;
  onEdit: (c: Category) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-text-muted">{title}</p>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-xs font-medium text-accent-soft hover:underline"
        >
          <Plus size={13} /> Thêm
        </button>
      </div>
      {categories.length === 0 ? (
        <p className="text-xs text-text-muted">Chưa có danh mục nào.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onEdit(c)}
              aria-label={`Sửa danh mục ${c.name}`}
              className="flex items-center gap-2 rounded-2xl bg-white/[0.03] px-3 py-2.5 text-left hover:bg-white/[0.06] transition-colors min-h-[44px]"
            >
              <div
                className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full"
                style={{ backgroundColor: c.imageDataUrl ? undefined : `${c.color}22`, color: c.color }}
              >
                <CategoryVisual category={c} size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{c.name}</p>
              </div>
              <Pencil size={13} className="text-text-muted shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
