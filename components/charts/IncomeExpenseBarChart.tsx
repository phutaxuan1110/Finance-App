"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatVND } from "@/lib/utils";

export interface ComparisonPoint {
  label: string;
  income: number;
  expense: number;
}

export function IncomeExpenseBarChart({ data }: { data: ComparisonPoint[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#A49DA0", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "#A49DA0", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`}
            width={38}
          />
          <Tooltip
            formatter={(value, key) => [formatVND(Number(value)), key === "income" ? "Thu nhập" : "Chi tiêu"]}
            contentStyle={{
              background: "#17171D",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 12,
              color: "#F4EFF0",
            }}
          />
          <Bar dataKey="income" fill="#77C58A" radius={[6, 6, 0, 0]} maxBarSize={18} />
          <Bar dataKey="expense" fill="#E87878" radius={[6, 6, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
