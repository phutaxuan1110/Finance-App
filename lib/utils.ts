import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an integer VND amount like "12.500.000đ" */
export function formatVND(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  const formatted = Math.abs(rounded).toLocaleString("vi-VN");
  return `${sign}${formatted}đ`;
}

/** Format with an explicit +/- sign, useful for transaction rows */
export function formatSignedVND(amount: number, type: "income" | "expense" | "transfer") {
  if (type === "income") return `+${formatVND(amount)}`;
  if (type === "expense") return `-${formatVND(amount)}`;
  return formatVND(amount);
}

/** Parse a user-typed VND string like "1.250.000" or "1250000" into a number */
export function parseVNDInput(value: string): number {
  const digitsOnly = value.replace(/[^\d]/g, "");
  if (!digitsOnly) return 0;
  return parseInt(digitsOnly, 10);
}

export function formatVNDInput(value: number): string {
  if (!value && value !== 0) return "";
  return value.toLocaleString("vi-VN");
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export const VIETNAMESE_WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export const VIETNAMESE_MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];
