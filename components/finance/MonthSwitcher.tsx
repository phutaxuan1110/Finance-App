"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { VIETNAMESE_MONTHS } from "@/lib/utils";

interface MonthSwitcherProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthSwitcher({ month, year, onChange }: MonthSwitcherProps) {
  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    onChange(m, y);
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/[0.08] px-1.5 py-1">
      <button
        onClick={() => shift(-1)}
        aria-label="Tháng trước"
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-medium px-2 min-w-[92px] text-center">
        {VIETNAMESE_MONTHS[month - 1]}, {year}
      </span>
      <button
        onClick={() => shift(1)}
        aria-label="Tháng sau"
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
