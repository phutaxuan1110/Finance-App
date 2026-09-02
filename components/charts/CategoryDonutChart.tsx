"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useCurrency } from "@/lib/currency-context";
import type { CategoryBreakdownItem } from "@/lib/calculations";

export function CategoryDonutChart({ items, total }: { items: CategoryBreakdownItem[]; total: number }) {
  const { formatMoney } = useCurrency();
  const chartData = items.map((item) => ({
    name: item.category.name,
    value: item.amount,
    color: item.category.color,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-text-muted">
        Chưa có dữ liệu chi tiêu để hiển thị.
      </div>
    );
  }

  return (
    <div className="relative h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
            animationDuration={500}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [formatMoney(Number(value)), String(name)]}
            contentStyle={{
              background: "#17171D",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 12,
              color: "#F4EFF0",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] text-text-muted">Tổng chi</span>
        <span className="text-lg font-semibold tabular-nums">{formatMoney(total)}</span>
      </div>
    </div>
  );
}
