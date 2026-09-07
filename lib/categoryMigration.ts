import type { Category, Transaction } from "@/types";

type MinimalTransaction = Pick<Transaction, "categoryId" | "type">;

/**
 * Guarantees every category has a valid `type`. Categories created by this
 * app have always had `type` set, so in practice this is a no-op — but it
 * protects against any malformed/pre-existing record (e.g. hand-edited
 * localStorage, a partially-restored JSON backup) without ever crashing or
 * dropping the category.
 *
 * Inference order when `type` is missing or invalid:
 *  1. Look at the category's own transaction history: if every transaction
 *     using it is one type (income or expense), use that.
 *  2. If it's genuinely mixed (used for both), default to "expense" — the
 *     category is kept as-is (not deleted, not silently duplicated) so no
 *     transaction ever loses its link. The user can re-file it via
 *     "Sửa danh mục" afterwards if the guess is wrong.
 *  3. If there's no transaction history to go on, default to "expense".
 */
export function ensureCategoryType(category: Category, transactions: MinimalTransaction[]): Category {
  if (category.type === "income" || category.type === "expense") return category;

  const usages = transactions.filter((t) => t.categoryId === category.id);
  const usedAsIncome = usages.some((t) => t.type === "income");
  const usedAsExpense = usages.some((t) => t.type === "expense");

  let inferredType: Category["type"] = "expense";
  if (usedAsIncome && !usedAsExpense) inferredType = "income";
  else if (usedAsExpense && !usedAsIncome) inferredType = "expense";

  return { ...category, type: inferredType };
}

export function ensureCategoryTypes(categories: Category[], transactions: MinimalTransaction[]): Category[] {
  return categories.map((c) => ensureCategoryType(c, transactions));
}

/**
 * A few icons (giặt ủi/laundry, mỹ phẩm/cosmetics, 5G·điện thoại/phone,
 * thời trang/fashion) didn't exist in the icon set yet when this app first
 * shipped, so any category created with one of those names had to fall
 * back to an unrelated icon (e.g. "TrendingUp" for "Giặt ủi"). Now that the
 * proper icons exist (see lib/categoryIcons.tsx), this upgrades any
 * category that still has EXACTLY the old placeholder icon for one of
 * these known names — never touching a category that already has a custom
 * image or an icon the user picked deliberately afterwards.
 */
const ICON_UPGRADES: Record<string, { from: string[]; to: string }> = {
  "Giặt ủi": { from: ["TrendingUp", "MoreHorizontal", "Sparkles"], to: "WashingMachine" },
  "Mỹ phẩm": { from: ["ShoppingBag", "MoreHorizontal", "Sparkles"], to: "SprayCan" },
  "5G": { from: ["Wallet", "Receipt", "MoreHorizontal"], to: "Smartphone" },
  "Điện thoại": { from: ["Wallet", "Receipt", "MoreHorizontal"], to: "Smartphone" },
  "Thời trang": { from: ["GraduationCap", "MoreHorizontal"], to: "Shirt" },
};

export function upgradeMismatchedCategoryIcon(category: Category): Category {
  if (category.imageDataUrl) return category; // user uploaded a custom image, never override
  const upgrade = ICON_UPGRADES[category.name.trim()];
  if (!upgrade || !upgrade.from.includes(category.icon)) return category;
  return { ...category, icon: upgrade.to };
}

export function upgradeMismatchedCategoryIcons(categories: Category[]): Category[] {
  return categories.map(upgradeMismatchedCategoryIcon);
}
