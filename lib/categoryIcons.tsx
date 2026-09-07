import {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Receipt,
  Popcorn,
  HeartPulse,
  GraduationCap,
  Home,
  Coffee,
  Plane,
  Gift,
  MoreHorizontal,
  Wallet,
  Sparkles,
  Laptop,
  TrendingUp,
  WashingMachine,
  SprayCan,
  Smartphone,
  Shirt,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Receipt,
  Popcorn,
  HeartPulse,
  GraduationCap,
  Home,
  Coffee,
  Plane,
  Gift,
  MoreHorizontal,
  Wallet,
  Sparkles,
  Laptop,
  TrendingUp,
  // Added to cover previously-missing categories (giặt ủi, mỹ phẩm, điện
  // thoại/5G, thời trang) that used to fall back to a mismatched icon.
  WashingMachine,
  SprayCan,
  Smartphone,
  Shirt,
};

export function CategoryIcon({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? MoreHorizontal;
  return <Icon size={size} className={className} aria-hidden />;
}

export const CATEGORY_ICON_OPTIONS = Object.keys(ICON_MAP);
