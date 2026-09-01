"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./navItems";

/**
 * Pure tab bar — no longer renders the "+" action. That action is now a
 * separate FloatingAddButton positioned above this bar (see
 * FloatingAddButton.tsx), so this component only needs to know about
 * navigation destinations.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-bottom safe-left safe-right"
      aria-label="Điều hướng chính"
    >
      <div className="relative mx-auto max-w-md">
        <div className="mx-3 mb-2 rounded-[24px] bg-bg-elevated/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl">
          <div
            className="grid items-center px-1"
            style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, 1fr)`, height: "var(--bottom-nav-height)" }}
          >
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  item,
  active,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px]"
      aria-current={active ? "page" : undefined}
    >
      <Icon size={20} className={cn("transition-colors", active ? "text-accent" : "text-text-muted")} />
      <span className={cn("text-[10px] font-medium transition-colors", active ? "text-accent" : "text-text-muted")}>
        {item.label}
      </span>
    </Link>
  );
}
