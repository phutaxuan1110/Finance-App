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
 * transaction, primary account, etc). Three things this fixes vs. ad-hoc
 * inline switches:
 *  - The visual pill is a fixed 48x28px in both states — width never
 *    changes between ON/OFF, and it never stretches or shrinks based on
 *    sibling content (a long label next to it can't compress it).
 *  - The actual clickable button is 44x44px (meeting the minimum touch
 *    target size) even though the visible pill inside it is smaller,
 *    by centering the pill within a larger invisible hit area rather than
 *    enlarging the pill itself.
 *  - The track clips the thumb (`overflow-hidden`), so the thumb can never
 *    visually spill outside it — even if some future change to spacing,
 *    zoom level, or font-size ever throws the translate math off by a
 *    pixel or two, the worst case is the thumb sitting slightly off-center,
 *    never a thumb rendered outside the track's rounded edge.
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
        "inline-flex h-11 w-12 shrink-0 grow-0 items-center justify-center disabled:opacity-70",
        disabled ? "cursor-default" : "cursor-pointer"
      )}
    >
      {/* Track: fixed size, and clips its own contents. */}
      <span
        aria-hidden="true"
        className={cn(
          "relative block h-7 w-12 shrink-0 grow-0 overflow-hidden rounded-full transition-colors duration-200",
          checked ? "bg-accent" : "bg-white/15"
        )}
      >
        {/* Thumb: positioned relative to the track itself (top-1/2 +
            -translate-y-1/2 centers it regardless of exact track height),
            so there's no hardcoded top offset to fall out of sync with. */}
        <span
          className={cn(
            "absolute top-1/2 left-1 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}
