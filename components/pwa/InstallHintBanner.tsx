"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";
import { useIsIOSSafari, useIsStandalone } from "@/lib/useStandalone";

const DISMISS_KEY = "snek:install-hint-dismissed";

export function InstallHintBanner() {
  const isStandalone = useIsStandalone();
  const isIOSSafari = useIsIOSSafari();
  const [dismissed, setDismissed] = useState(true); // default hidden until we know

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  // Never show the hint once the app is already running standalone —
  // there's nothing to suggest at that point.
  if (isStandalone || !isIOSSafari || dismissed) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-accent/10 border border-accent/20 px-4 py-3 mb-4">
      <Share size={18} className="text-accent-soft shrink-0 mt-0.5" />
      <p className="text-xs text-text-muted flex-1">
        Để sử dụng toàn màn hình: nhấn <span className="text-text-primary font-medium">Chia sẻ</span> →{" "}
        <span className="text-text-primary font-medium">Thêm vào Màn hình chính</span>, sau đó mở SNEK từ biểu tượng
        trên màn hình chính.
      </p>
      <button
        onClick={dismiss}
        aria-label="Đóng gợi ý"
        className="shrink-0 rounded-full p-1 text-text-muted hover:bg-white/[0.08]"
      >
        <X size={16} />
      </button>
    </div>
  );
}
