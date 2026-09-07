import type { Category } from "@/types";

/**
 * Curated palette for category colors — chosen to stay legible on the
 * app's dark theme and to be visually distinguishable from one another
 * (used in category chips, the analytics donut chart legend, etc.).
 * Order matters: it's also the order colors are offered/auto-picked in,
 * so more "core" categories keep the colors already shipped with the app.
 */
export const CATEGORY_COLOR_PALETTE: string[] = [
  "#E5B96F", // gold/tan
  "#77A6C5", // blue
  "#B76E79", // rose
  "#8F4F5A", // maroon
  "#9B7FD4", // purple
  "#E87878", // coral red
  "#6FB3E5", // sky blue
  "#C9828D", // dusty pink
  "#B08968", // brown
  "#5FBFA8", // teal
  "#D9A4AC", // light pink
  "#A49DA0", // gray
  "#77C58A", // green
  "#E0B33C", // amber
  "#3FB6C4", // cyan/teal
  "#7C83D9", // indigo
  "#9C97C4", // lavender-gray
  "#4FC3A1", // mint
  "#D98C4A", // rust/orange
  "#C97ED1", // orchid
  "#7FBF7F", // sage green
  "#E0708A", // watermelon
  "#5D9CDE", // cornflower blue
  "#BF9B5E", // sandy brown
  "#8C7BC7", // periwinkle
  "#D46A6A", // brick red
  "#78C2E0", // sky cyan
  "#B98ED6", // lilac
  "#9FBF5C", // olive/lime
  "#4FA0B5", // steel teal
];

function normalize(hex: string | undefined | null): string {
  return (hex ?? "").trim().toLowerCase();
}

/** Deterministic HSL -> hex conversion, used only as an overflow generator
 * once every curated palette color is already taken by another category. */
function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (n: number) =>
    Math.round(f(n) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
}

/**
 * Returns a color guaranteed not to be in `usedColors`. Walks the curated
 * palette first (starting at `preferredIndex`, wrapping around) so results
 * stay within the app's designed look; only falls back to generating a
 * fresh hue (golden-angle spaced, so it stays visually distinct even after
 * many fallbacks) once every palette color is already spoken for — e.g.
 * once someone has created more categories than the palette has colors.
 */
export function pickAvailableColor(usedColors: Iterable<string>, preferredIndex = 0): string {
  const used = new Set(Array.from(usedColors, normalize));

  for (let i = 0; i < CATEGORY_COLOR_PALETTE.length; i++) {
    const candidate = CATEGORY_COLOR_PALETTE[(preferredIndex + i) % CATEGORY_COLOR_PALETTE.length];
    if (!used.has(normalize(candidate))) return candidate;
  }

  let hue = (used.size * 137.508) % 360; // golden angle keeps successive hues well-spread
  let candidate = hslToHex(hue, 55, 60);
  let guard = 0;
  while (used.has(normalize(candidate)) && guard < 100) {
    hue = (hue + 137.508) % 360;
    candidate = hslToHex(hue, 55, 60);
    guard++;
  }
  return candidate;
}

/**
 * Self-healing migration: guarantees every category ends up with a color
 * no other category has. Walks categories in their existing order — the
 * first category to use a given color keeps it; any later category
 * sharing (or missing) a color gets bumped to the next available one from
 * the palette. Safe no-op when every category is already unique.
 */
export function dedupeCategoryColors(categories: Category[]): Category[] {
  const used = new Set<string>();
  let changed = false;

  const result = categories.map((c) => {
    const key = normalize(c.color);
    if (key && !used.has(key)) {
      used.add(key);
      return c;
    }
    const next = pickAvailableColor(used);
    used.add(normalize(next));
    changed = true;
    return { ...c, color: next };
  });

  return changed ? result : categories;
}
