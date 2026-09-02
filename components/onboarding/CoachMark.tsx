"use client";

import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

interface CoachMarkProps {
  targetRef: RefObject<HTMLElement | null>;
  title: string;
  description: string;
  /** Rendered only while true. Keeping this as a prop (rather than
   * mounting/unmounting the component) keeps the measurement effect
   * simple to reason about. */
  active: boolean;
  onSkip?: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 6;
const TOOLTIP_MAX_WIDTH = 300;
const VIEWPORT_MARGIN = 16;

/**
 * Dims the whole screen except a rectangle around `targetRef`, and shows a
 * small tooltip near it. The spotlight itself has no overlay element over
 * it — it's four separate bands (top/bottom/left/right) around the target
 * — so the real element underneath stays natively clickable without any
 * pointer-events masking tricks.
 *
 * Renders via a portal at document.body with a very high z-index (80) so it
 * sits above nested sheets (z-70) — but hides itself (via `active`, driven
 * by the caller) whenever a modal that would cover the target is open, and
 * whenever the target isn't currently visible/mounted (e.g. a
 * `md:hidden` / `hidden md:flex` responsive counterpart).
 */
export function CoachMark({ targetRef, title, description, active, onSkip }: CoachMarkProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");

  useEffect(() => {
    if (!active) {
      setRect(null);
      return;
    }
    const el = targetRef.current;
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    function measure() {
      // offsetParent is null for display:none elements — lets two
      // responsive variants of the same target (mobile/desktop) share one
      // CoachMark call site each without the hidden one drawing a
      // zero-sized spotlight.
      if (!el || el.offsetParent === null) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      setPlacement(r.top > window.innerHeight / 2 ? "top" : "bottom");
    }

    const raf = requestAnimationFrame(measure);
    // Covers the smooth-scroll animation and any layout shifts while this
    // step is active, without needing a ResizeObserver per ancestor.
    const interval = setInterval(measure, 200);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, targetRef]);

  if (!active || !rect || typeof window === "undefined") return null;

  const spot = {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const tooltipWidth = Math.min(TOOLTIP_MAX_WIDTH, viewportW - VIEWPORT_MARGIN * 2);
  const rawLeft = spot.left + spot.width / 2 - tooltipWidth / 2;
  const tooltipLeft = Math.max(VIEWPORT_MARGIN, Math.min(rawLeft, viewportW - tooltipWidth - VIEWPORT_MARGIN));
  const tooltipTop = placement === "bottom" ? spot.top + spot.height + 12 : undefined;
  const tooltipBottom = placement === "top" ? viewportH - spot.top + 12 : undefined;

  return createPortal(
    <div className="fixed inset-0 z-[80]" role="dialog" aria-live="polite">
      <div className="absolute bg-black/70" style={{ top: 0, left: 0, right: 0, height: Math.max(0, spot.top) }} />
      <div className="absolute bg-black/70" style={{ top: spot.top + spot.height, left: 0, right: 0, bottom: 0 }} />
      <div
        className="absolute bg-black/70"
        style={{ top: spot.top, left: 0, width: Math.max(0, spot.left), height: spot.height }}
      />
      <div
        className="absolute bg-black/70"
        style={{ top: spot.top, left: spot.left + spot.width, right: 0, height: spot.height }}
      />
      <div
        className="absolute rounded-2xl ring-2 ring-accent pointer-events-none"
        style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
      />

      <div
        className="absolute rounded-2xl bg-bg-elevated border border-white/10 p-4 shadow-xl"
        style={{ left: tooltipLeft, width: tooltipWidth, top: tooltipTop, bottom: tooltipBottom }}
      >
        <p className="text-sm font-semibold mb-1">{title}</p>
        <p className="text-xs text-text-muted leading-relaxed">{description}</p>
        {onSkip && (
          <button onClick={onSkip} className="mt-3 text-xs font-medium text-accent-soft hover:underline">
            Bỏ qua hướng dẫn
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
