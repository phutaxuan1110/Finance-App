import { CategoryIcon } from "@/lib/categoryIcons";

interface CategoryVisualProps {
  category: { icon: string; imageDataUrl?: string };
  size?: number;
  className?: string;
}

/**
 * A category has exactly one visual: its uploaded image if present,
 * otherwise its icon. Used everywhere a category is shown (selector,
 * transaction rows, breakdown lists, category management) so all of them
 * stay in sync automatically — callers don't need an if/else.
 *
 * When `category.imageDataUrl` is set, this renders an <img> that fills
 * 100% of its parent container (so the parent must already be a
 * fixed-size, `relative overflow-hidden` box — every call site below
 * already wraps this in exactly that kind of box).
 */
export function CategoryVisual({ category, size = 18, className }: CategoryVisualProps) {
  if (category.imageDataUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={category.imageDataUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />;
  }
  return <CategoryIcon name={category.icon} size={size} className={className} />;
}
