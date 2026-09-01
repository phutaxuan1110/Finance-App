"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

/**
 * Standardized on/off switch used by every toggle in the app (recurring
 * transaction, primary account, etc). Two things this fixes vs. ad-hoc
 * inline switches:
 *  - The visual pill is a fixed 48x28px in both states — width never
 *    changes between ON/OFF, and it never stretches or shrinks based on
 *    sibling content (a long label next to it can't compress it).
 *  - The actual clickable button is 44x44px (meeting the minimum touch
 *    target size) even though the visible pill inside it is smaller,
 *    by centering the pill within a larger invisible hit area rather than
 *    enlarging the pill itself.
 */
export function Switch({ checked, onChange, disabled, "aria-label": ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex h-11 w-12 shrink-0 grow-0 items-center justify-center disabled:opacity-70",
        disabled ? "cursor-default" : "cursor-pointer"
      )}
    >
      <span
        className={cn(
          "relative block h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-white/15"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </span>
    </button>
  );
}
