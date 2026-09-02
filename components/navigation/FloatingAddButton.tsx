"use client";

import { forwardRef } from "react";
import { Plus } from "lucide-react";

/**
 * The "+" action, extracted from the bottom nav bar into its own floating
 * button. Positioned using the shared --bottom-nav-height / --bottom-nav-gap
 * CSS variables (see globals.css) so it always sits a fixed 20px above the
 * nav bar regardless of device safe-area inset — never hard-coded per
 * iPhone model.
 *
 * Mobile-only (md:hidden): on desktop the equivalent action lives in the
 * Sidebar's own "Thêm giao dịch" button.
 *
 * forwardRef so the onboarding walkthrough (see components/onboarding/CoachMark.tsx)
 * can spotlight this exact DOM node.
 */
export const FloatingAddButton = forwardRef<HTMLButtonElement, { onClick: () => void }>(function FloatingAddButton(
  { onClick },
  ref
) {
  return (
    <button
      ref={ref}
      onClick={onClick}
      aria-label="Thêm giao dịch"
      className="fixed z-50 flex items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/40 transition-transform duration-200 active:scale-95 hover:bg-accent-hover md:hidden"
      style={{
        right: "calc(env(safe-area-inset-right) + 20px)",
        bottom: "calc(env(safe-area-inset-bottom) + var(--bottom-nav-height) + var(--bottom-nav-gap) + 20px)",
        width: "60px",
        height: "60px",
      }}
    >
      <Plus size={26} />
    </button>
  );
});
