"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCurrency } from "@/lib/currency-context";
import { convertFromVND } from "@/lib/currency";

export interface ComparisonPoint {
  label: string;
  income: number;
  expense: number;
}

export function IncomeExpenseBarChart({ data }: { data: ComparisonPoint[] }) {
  const { currency, rates, formatMoney } = useCurrency();

  // The Y-axis needs a compact tick format too, not just the tooltip — the
  // old "Xtr" (triệu/millions) shorthand only makes sense for VND amounts,
  // so once converted to USD/AUD (much smaller numbers) it switches to a
  // standard compact currency format instead (e.g. "$1.2K").
  function formatAxisTick(vndValue: number) {
    if (currency === "VND") return `${Math.round(vndValue / 1_000_000)}tr`;
    const converted = convertFromVND(vndValue, currency, rates);
    return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-AU", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(converted);
  }

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
            tickFormatter={formatAxisTick}
            width={currency === "VND" ? 38 : 52}
          />
          <Tooltip
            formatter={(value, key) => [formatMoney(Number(value)), key === "income" ? "Thu nhập" : "Chi tiêu"]}
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
