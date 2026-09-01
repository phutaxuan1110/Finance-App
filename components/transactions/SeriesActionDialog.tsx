"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { EditScope } from "./AddTransactionSheet";

export function SeriesActionDialog({
  open,
  mode,
  onCancel,
  onChoose,
}: {
  open: boolean;
  mode: "edit" | "delete";
  onCancel: () => void;
  onChoose: (scope: EditScope) => void;
}) {
  if (typeof window === "undefined") return null;

  const title = mode === "edit" ? "Sửa giao dịch định kỳ" : "Xoá giao dịch định kỳ";
  const actionVerb = mode === "edit" ? "Sửa" : "Xoá";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-6">
          <motion.div
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative z-10 w-full max-w-sm rounded-3xl bg-bg-elevated border border-white/10 p-6"
          >
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-sm text-text-muted mb-5">
              Đây là một giao dịch thuộc chuỗi định kỳ. Bạn muốn áp dụng thay đổi cho phạm vi nào?
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => onChoose("only")}>
                {actionVerb} chỉ giao dịch này
              </Button>
              <Button variant="secondary" onClick={() => onChoose("future")}>
                {actionVerb} giao dịch này và các kỳ sau
              </Button>
              <Button variant={mode === "delete" ? "danger" : "primary"} onClick={() => onChoose("all")}>
                {actionVerb} toàn bộ chuỗi
              </Button>
              <button onClick={onCancel} className="mt-1 text-sm text-text-muted hover:text-text-primary py-2">
                Huỷ
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
