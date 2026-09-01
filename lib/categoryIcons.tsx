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
