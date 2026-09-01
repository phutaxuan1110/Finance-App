"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Use a higher stacking layer when this sheet can open on top of another sheet. */
  layer?: "base" | "nested";
  /**
   * Optional action row (e.g. a Huỷ/Lưu CTA), rendered outside the
   * scrollable body and pinned to the bottom of the sheet regardless of
   * how long the body is or how far it's scrolled — content never has to
   * be scrolled past to reach it. Handles the iPhone safe-area (Home
   * Indicator) itself. When omitted, Sheet renders exactly as it always
   * has (a single scrollable region below the header), so every existing
   * caller that doesn't pass this prop is completely unaffected.
   */
  footer?: React.ReactNode;
}

export function Sheet({ open, onClose, title, children, className, layer = "base", footer }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn("fixed inset-0 flex items-end sm:items-center sm:justify-center", layer === "nested" ? "z-[70]" : "z-50")}>
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              // flex-col + overflow-hidden here (instead of the whole card
              // scrolling) is what lets the header stay put and the footer
              // stay pinned below, with only the middle body scrolling.
              "relative z-10 flex w-full sm:max-w-lg max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-bg-elevated border border-white/10",
              // Only needed when there's no footer: with a footer, the
              // safe-area inset is applied to the footer itself instead
              // (see below), since that's the true bottom-most content.
              !footer && "safe-bottom",
              className
            )}
          >
            <div className="shrink-0 flex items-center justify-between px-5 py-4 bg-bg-elevated/95 backdrop-blur border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold">{title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Đóng">
                <X size={20} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {footer && (
              <div
                className="shrink-0 border-t border-white/[0.06] bg-bg-elevated/95 backdrop-blur px-5 pt-3"
                style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
