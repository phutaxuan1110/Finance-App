"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Label, Select, Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { computeRecurrenceDates, FREQUENCY_LABEL, type RecurrenceInput } from "@/lib/recurrence";
import type { RecurrenceFrequency } from "@/types";

interface RecurrencePickerProps {
  startDate: Date;
  frequency: RecurrenceFrequency;
  onFrequencyChange: (f: RecurrenceFrequency) => void;
  endMode: "count" | "date";
  onEndModeChange: (m: "count" | "date") => void;
  count: number;
  onCountChange: (n: number) => void;
  endDate: string; // yyyy-mm-dd
  onEndDateChange: (v: string) => void;
}

export function RecurrencePicker({
  startDate,
  frequency,
  onFrequencyChange,
  endMode,
  onEndModeChange,
  count,
  onCountChange,
  endDate,
  onEndDateChange,
}: RecurrencePickerProps) {
  const input: RecurrenceInput = {
    frequency,
    startDate,
    endMode,
    count: endMode === "count" ? count : undefined,
    endDate: endMode === "date" && endDate ? new Date(`${endDate}T23:59:59`) : undefined,
  };
  const dates = computeRecurrenceDates(input);

  return (
    // No horizontal padding/border here (unlike before): those fields must
    // sit at the exact same left/right edge as every other field in the
    // form above and below this section, not indented inside a nested card.
    <div className="flex flex-col gap-4">
      <div>
        <Label htmlFor="recur-frequency">Chu kỳ</Label>
        <Select
          id="recur-frequency"
          value={frequency}
          onChange={(e) => onFrequencyChange(e.target.value as RecurrenceFrequency)}
        >
          {(Object.keys(FREQUENCY_LABEL) as RecurrenceFrequency[]).map((f) => (
            <option key={f} value={f}>
              {FREQUENCY_LABEL[f]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Ngày bắt đầu</Label>
        <p className="text-sm text-text-primary rounded-2xl bg-white/[0.05] px-4 py-3">
          {format(startDate, "dd/MM/yyyy", { locale: vi })}
        </p>
      </div>

      <div>
        <Label>Kết thúc</Label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => onEndModeChange("count")}
            className={cn(
              "flex-1 rounded-2xl px-3 py-2.5 text-sm font-medium border transition-colors min-h-[44px]",
              endMode === "count" ? "border-accent bg-accent/15 text-accent-soft" : "border-white/[0.08] text-text-muted"
            )}
          >
            Sau một số lần
          </button>
          <button
            type="button"
            onClick={() => onEndModeChange("date")}
            className={cn(
              "flex-1 rounded-2xl px-3 py-2.5 text-sm font-medium border transition-colors min-h-[44px]",
              endMode === "date" ? "border-accent bg-accent/15 text-accent-soft" : "border-white/[0.08] text-text-muted"
            )}
          >
            Vào một ngày
          </button>
        </div>

        {endMode === "count" ? (
          <Input
            type="number"
            min={1}
            max={60}
            value={count}
            onChange={(e) => onCountChange(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
            aria-label="Số lần lặp lại"
          />
        ) : (
          <Input
            type="date"
            value={endDate}
            min={format(startDate, "yyyy-MM-dd")}
            onChange={(e) => onEndDateChange(e.target.value)}
            aria-label="Ngày kết thúc"
          />
        )}
      </div>

      <div>
        <p className="text-xs text-text-muted mb-2">
          Sẽ tạo <span className="text-text-primary font-medium">{dates.length}</span> giao dịch
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {dates.slice(0, 12).map((d, i) => (
            <span key={i} className="text-[11px] rounded-full bg-white/[0.06] px-2.5 py-1 tabular-nums">
              {format(d, "dd/MM/yyyy")}
            </span>
          ))}
          {dates.length > 12 && (
            <span className="text-[11px] rounded-full bg-white/[0.06] px-2.5 py-1">+{dates.length - 12} kỳ khác</span>
          )}
        </div>
      </div>
    </div>
  );
}
