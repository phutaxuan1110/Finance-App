"use client";

import { useState } from "react";
import { CloudUpload } from "lucide-react";
import { useData } from "@/lib/data-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";

export function MigrationBanner() {
  const { migrationAvailable, runMigration, dismissMigration } = useData();
  const { showToast } = useToast();
  const [syncing, setSyncing] = useState(false);

  if (!migrationAvailable) return null;

  async function handleSync() {
    setSyncing(true);
    try {
      await runMigration();
      showToast("Đã đồng bộ dữ liệu cũ lên tài khoản của bạn.");
    } catch {
      showToast("Đồng bộ thất bại, vui lòng thử lại.", "error");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-accent/10 border border-accent/20 px-4 py-3 mb-4">
      <CloudUpload size={18} className="text-accent-soft shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-text-primary font-medium mb-0.5">Phát hiện dữ liệu cũ trên thiết bị này</p>
        <p className="text-xs text-text-muted mb-3">
          Bạn có tài khoản, ví và giao dịch đã nhập trước đây trên trình duyệt này. Đồng bộ lên tài khoản để không bị
          mất và có thể xem trên mọi thiết bị.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSync} disabled={syncing}>
            {syncing ? "Đang đồng bộ…" : "Đồng bộ ngay"}
          </Button>
          <Button size="sm" variant="ghost" onClick={dismissMigration} disabled={syncing}>
            Bỏ qua
          </Button>
        </div>
      </div>
    </div>
  );
}
