"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { CategoryIcon, CATEGORY_ICON_OPTIONS } from "@/lib/categoryIcons";
import { compressImageToDataUrl } from "@/lib/imageCompression";
import { cn, uid } from "@/lib/utils";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import type { Category, CategoryKind } from "@/types";

const COLOR_OPTIONS = [
  "#B76E79", "#8F4F5A", "#E5B96F", "#77C58A", "#E87878",
  "#6FB3E5", "#9B7FD4", "#5FBFA8", "#D9A4AC", "#B08968",
];

interface CategoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Default type for a brand-new category (ignored when editing — type is locked after creation, see below). */
  kind: CategoryKind;
  onSaved?: (category: Category) => void;
  /** Pass an existing category to edit it in place instead of creating a new one. */
  editingCategory?: Category | null;
}

export function CategoryFormDialog({ open, onClose, kind, onSaved, editingCategory }: CategoryFormDialogProps) {
  const { data, saveCategory } = useData();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(CATEGORY_ICON_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

  const isEditing = !!editingCategory;
  const effectiveType: CategoryKind = editingCategory?.type ?? kind;

  useEffect(() => {
    if (!open) return;
    if (editingCategory) {
      setName(editingCategory.name);
      setIcon(editingCategory.icon);
      setColor(editingCategory.color);
      setImageDataUrl(editingCategory.imageDataUrl);
    } else {
      setName("");
      setIcon(CATEGORY_ICON_OPTIONS[0]);
      setColor(COLOR_OPTIONS[0]);
      setImageDataUrl(undefined);
    }
    setError("");
    setSaving(false);
    setImageProcessing(false);
  }, [open, editingCategory]);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn một tệp ảnh.", "error");
      return;
    }
    setImageProcessing(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setImageDataUrl(dataUrl);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xử lý ảnh này.", "error");
    } finally {
      setImageProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Vui lòng nhập tên danh mục.");
      return;
    }
    const duplicate = (data?.categories ?? []).some(
      (c) =>
        c.id !== editingCategory?.id &&
        c.type === effectiveType &&
        c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setError("Danh mục này đã tồn tại.");
      return;
    }

    setSaving(true);
    const category: Category = {
      id: editingCategory?.id ?? uid("cat"),
      name: trimmed,
      icon,
      color,
      type: effectiveType,
      isDefault: editingCategory?.isDefault ?? false,
      imageDataUrl,
    };
    try {
      await saveCategory(category);
      showToast(isEditing ? "Đã cập nhật danh mục." : "Đã thêm danh mục mới.");
      onSaved?.(category);
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể lưu danh mục. Vui lòng thử lại.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={isEditing ? "Sửa danh mục" : "Thêm danh mục mới"} layer="nested">
      <div className="flex flex-col gap-5">
        <div>
          <Label htmlFor="new-cat-name">Tên danh mục</Label>
          <Input
            id="new-cat-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Ví dụ: Tiền nhà"
            autoFocus
          />
          {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>

        <div>
          <Label>Biểu tượng</Label>
          <div className="grid grid-cols-6 gap-2">
            {CATEGORY_ICON_OPTIONS.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => setIcon(iconName)}
                aria-label={`Chọn biểu tượng ${iconName}`}
                aria-pressed={icon === iconName}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors",
                  icon === iconName ? "border-accent bg-accent/15 text-accent-soft" : "border-white/[0.08] bg-white/[0.03] text-text-muted"
                )}
              >
                <CategoryIcon name={iconName} size={18} />
              </button>
            ))}
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Biểu tượng được dùng làm ảnh đại diện dự phòng khi danh mục không có ảnh riêng.
          </p>
        </div>

        <div>
          <Label>Màu sắc</Label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Chọn màu ${c}`}
                aria-pressed={color === c}
                className={cn(
                  "h-9 w-9 rounded-full border-2 transition-transform",
                  color === c ? "border-white scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <Label>Ảnh danh mục (tuỳ chọn)</Label>
          {imageDataUrl ? (
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageDataUrl} alt="Ảnh danh mục" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-accent-soft hover:underline text-left"
                >
                  Đổi ảnh khác
                </button>
                <button
                  type="button"
                  onClick={() => setImageDataUrl(undefined)}
                  className="flex items-center gap-1 text-xs font-medium text-danger hover:underline"
                >
                  <X size={13} /> Xoá ảnh, dùng biểu tượng
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageProcessing}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-4 text-sm text-text-muted hover:bg-white/[0.03] transition-colors min-h-[44px] disabled:opacity-60"
            >
              <ImagePlus size={18} />
              {imageProcessing ? "Đang xử lý ảnh…" : "Chọn ảnh từ thiết bị"}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
          <div
            className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{ backgroundColor: imageDataUrl ? undefined : `${color}22`, color }}
          >
            {imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageDataUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <CategoryIcon name={icon} size={18} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{name || "Tên danh mục"}</p>
            <p className="text-[11px] text-text-muted">{effectiveType === "income" ? "Thu nhập" : "Chi tiêu"}</p>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={saving || imageProcessing}>
          {saving ? "Đang lưu…" : isEditing ? "Lưu thay đổi" : "Thêm danh mục"}
        </Button>
      </div>
    </Sheet>
  );
}
