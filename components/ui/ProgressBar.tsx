"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, TrendingUp, XCircle } from "lucide-react";
import { cn, clamp } from "@/lib/utils";

interface ProgressBarProps {
  percent: number;
  level: "good" | "steady" | "near" | "at" | "over";
  label: string;
  className?: string;
}

const levelColor: Record<ProgressBarProps["level"], string> = {
  good: "bg-success",
  steady: "bg-accent-soft",
  near: "bg-warning",
  at: "bg-warning",
  over: "bg-danger",
};

const levelIcon: Record<ProgressBarProps["level"], ReactNode> = {
  good: <CheckCircle2 size={16} className="text-success" aria-hidden />,
  steady: <TrendingUp size={16} className="text-accent-soft" aria-hidden />,
  near: <AlertTriangle size={16} className="text-warning" aria-hidden />,
  at: <AlertTriangle size={16} className="text-warning" aria-hidden />,
  over: <XCircle size={16} className="text-danger" aria-hidden />,
};

export function ProgressBar({ percent, level, label, className }: ProgressBarProps) {
  const width = clamp(percent, 0, 100);
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-1.5 mb-2 text-sm font-medium">
        {levelIcon[level]}
        <span>{label}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2.5 w-full rounded-full bg-white/[0.08] overflow-hidden"
      >
        <motion.div
          className={cn("h-full rounded-full", levelColor[level])}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
