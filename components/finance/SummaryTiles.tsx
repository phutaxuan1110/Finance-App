import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatVND } from "@/lib/utils";

export function SummaryTiles({ income, expense }: { income: number; expense: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="!p-4">
        <div className="flex items-center gap-2 mb-2 text-success">
          <ArrowUpCircle size={18} />
          <span className="text-xs font-medium text-text-muted">Thu nhập</span>
        </div>
        <p className="text-xl font-semibold tabular-nums">{formatVND(income)}</p>
      </Card>
      <Card className="!p-4">
        <div className="flex items-center gap-2 mb-2 text-danger">
          <ArrowDownCircle size={18} />
          <span className="text-xs font-medium text-text-muted">Chi tiêu</span>
        </div>
        <p className="text-xl font-semibold tabular-nums">{formatVND(expense)}</p>
      </Card>
    </div>
  );
}
