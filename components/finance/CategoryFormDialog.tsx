"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { CategoryIcon, CATEGORY_ICON_OPTIONS } from "@/lib/categoryIcons";
import { cn, uid } from "@/lib/utils";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import type { Category, CategoryKind } from "@/types";

const COLOR_OPTIONS = [
  "#B76E79", "#8F4F5A", "#E5B96F", "#77C58A", "#E87878",
  "#6FB3E5", "#9B7FD4", "#5FBFA8", "#D9A4AC", "#B08968",
];

export function CategoryFormDialog({
  open,
  onClose,
  kind,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  kind: CategoryKind;
  onCreated: (category: Category) => void;
}) {
  const { data, saveCategory } = useData();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(CATEGORY_ICON_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setIcon(CATEGORY_ICON_OPTIONS[0]);
    setColor(COLOR_OPTIONS[0]);
    setError("");
    setSaving(false);
  }, [open]);

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Vui lòng nhập tên danh mục.");
      return;
    }
    const duplicate = (data?.categories ?? []).some(
      (c) => c.type === kind && c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setError("Danh mục này đã tồn tại.");
      return;
    }

    setSaving(true);
    const category: Category = {
      id: uid("cat"),
      name: trimmed,
      icon,
      color,
      type: kind,
      isDefault: false,
    };
    await saveCategory(category);
    setSaving(false);
    showToast("Đã thêm danh mục mới.");
    onCreated(category);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Thêm danh mục mới" layer="nested">
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

        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}22`, color }}
          >
            <CategoryIcon name={icon} size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{name || "Tên danh mục"}</p>
            <p className="text-[11px] text-text-muted">{kind === "income" ? "Thu nhập" : "Chi tiêu"}</p>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Đang lưu…" : "Thêm danh mục"}
        </Button>
      </div>
    </Sheet>
  );
}
