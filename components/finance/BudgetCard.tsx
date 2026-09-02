"use client";

import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SnakeMascot } from "@/components/mascot/SnakeMascot";
import type { BudgetStatus } from "@/lib/calculations";
import { useCurrency } from "@/lib/currency-context";
import type { MascotState } from "@/components/mascot/mascotLogic";

export function BudgetCard({
  status,
  mascot,
  onEditLimit,
}: {
  status: BudgetStatus;
  mascot: MascotState;
  onEditLimit: () => void;
}) {
  const { formatMoney } = useCurrency();

  if (status.limit <= 0) {
    return (
      <Card className="flex items-center gap-4">
        <SnakeMascot expression="neutral" size={64} />
        <div className="flex-1">
          <p className="font-medium mb-1">Bạn chưa đặt giới hạn chi tiêu tháng này</p>
          <p className="text-sm text-text-muted mb-3">
            Đặt hạn mức để SNEK giúp bạn theo dõi và cảnh báo kịp thời.
          </p>
          <button onClick={onEditLimit} className="text-sm font-medium text-accent-soft hover:underline">
            Đặt giới hạn ngay
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs text-text-muted mb-1">Ngân sách tháng này</p>
          <p className="text-3xl font-semibold tabular-nums">{formatMoney(status.limit)}</p>
        </div>
        <SnakeMascot expression={mascot.expression} size={64} />
      </div>

      <ProgressBar percent={status.percentUsed} level={status.statusLevel} label={status.statusLabel} />

      <div className="grid grid-cols-3 gap-3 mt-4">
        <Stat label="Đã chi" value={formatMoney(status.spent)} />
        <Stat label="Còn lại" value={formatMoney(Math.max(status.remaining, 0))} />
        <Stat label="Đã dùng" value={`${Math.round(status.percentUsed)}%`} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
        <div>
          <p className="text-[11px] text-text-muted">An toàn để chi hôm nay</p>
          <p className="text-base font-semibold tabular-nums text-accent-soft">
            {formatMoney(status.safeToSpendToday)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-text-muted">Dự báo cuối tháng</p>
          <p className="text-base font-semibold tabular-nums">{formatMoney(status.projectedSpending)}</p>
        </div>
      </div>

      <p className="text-xs text-text-muted mt-3">{mascot.message}</p>

      <div className="flex items-center justify-between mt-3">
        <span className="text-[11px] text-text-muted">Còn {status.daysRemaining} ngày trong tháng</span>
        <button onClick={onEditLimit} className="text-xs font-medium text-accent-soft hover:underline">
          Chỉnh sửa giới hạn
        </button>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] px-3 py-2.5">
      <p className="text-[10px] text-text-muted mb-0.5">{label}</p>
      <p className="text-sm font-semibold tabular-nums truncate">{value}</p>
    </div>
  );
}
