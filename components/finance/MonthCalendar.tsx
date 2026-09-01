"use client";

import { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isToday,
  startOfMonth,
} from "date-fns";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/lib/categoryIcons";
import { WEEKDAY_LABELS_MON_FIRST } from "@/lib/period";
import type { Category, Transaction } from "@/types";

interface MonthCalendarProps {
  month: number; // 1-12
  year: number;
  transactions: Transaction[]; // all transactions for the visible month (transfers excluded upstream or handled here)
  categories: Category[];
  onSelectDay: (date: Date) => void;
}

export function MonthCalendar({ month, year, transactions, categories, onSelectDay }: MonthCalendarProps) {
  const monthAnchor = new Date(year, month - 1, 1);
  const start = startOfMonth(monthAnchor);
  const end = endOfMonth(monthAnchor);
  const days = useMemo(() => eachDayOfInterval({ start, end }), [start, end]);

  // Monday-first leading blanks: getDay() is 0=Sun..6=Sat, convert to 0=Mon..6=Sun.
  const leadingBlanks = (getDay(start) + 6) % 7;

  const byDay = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    transactions
      .filter((t) => t.type !== "transfer")
      .forEach((t) => {
        const key = format(new Date(t.date), "yyyy-MM-dd");
        const list = map.get(key) ?? [];
        list.push(t);
        map.set(key, list);
      });
    return map;
  }, [transactions]);

  return (
    <div>
      <div className="grid grid-cols-7 mb-1.5">
        {WEEKDAY_LABELS_MON_FIRST.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-text-muted py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((date) => {
          const key = format(date, "yyyy-MM-dd");
          const dayTx = byDay.get(key) ?? [];
          const expenseTotal = dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
          const iconCats = Array.from(new Set(dayTx.map((t) => t.categoryId).filter(Boolean))).slice(0, 2);
          const extraCount = Math.max(0, new Set(dayTx.map((t) => t.categoryId)).size - 2);
          const today = isToday(date);

          return (
            <button
              key={key}
              onClick={() => onSelectDay(date)}
              aria-label={`Ngày ${format(date, "dd/MM")}${dayTx.length > 0 ? `, ${dayTx.length} giao dịch` : ""}`}
              className={cn(
                "relative flex flex-col items-center justify-start gap-0.5 rounded-xl py-1.5 min-h-[44px] transition-colors",
                today ? "bg-accent/15 ring-1 ring-accent-soft" : "hover:bg-white/[0.05]"
              )}
            >
              <span className={cn("text-[12px] font-medium tabular-nums", today ? "text-accent-soft" : "text-text-primary")}>
                {format(date, "d")}
              </span>
              <div className="flex items-center gap-0.5 h-3.5">
                {iconCats.map((catId) => {
                  const cat = categories.find((c) => c.id === catId);
                  if (!cat) return null;
                  return (
                    <span key={catId} style={{ color: cat.color }}>
                      <CategoryIcon name={cat.icon} size={10} />
                    </span>
                  );
                })}
                {extraCount > 0 && <span className="text-[8px] text-text-muted">+{extraCount}</span>}
              </div>
              {expenseTotal > 0 && (
                <span className="text-[8px] text-danger tabular-nums leading-none">
                  {expenseTotal >= 1_000_000
                    ? `${(expenseTotal / 1_000_000).toFixed(1)}tr`
                    : `${Math.round(expenseTotal / 1000)}k`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
