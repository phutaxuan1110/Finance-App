"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./navItems";

export function BottomNav({ onAddClick }: { onAddClick: () => void }) {
  const pathname = usePathname();
  const leftItems = NAV_ITEMS.slice(0, 2);
  const rightItems = NAV_ITEMS.slice(2);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-bottom safe-left safe-right"
      aria-label="Điều hướng chính"
    >
      <div className="relative mx-auto max-w-md">
        <div className="mx-3 mb-3 rounded-[28px] bg-bg-elevated/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl">
          <div className="grid grid-cols-5 items-center h-16 px-1">
            {leftItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} />
            ))}
            <div className="flex items-center justify-center">
              <button
                onClick={onAddClick}
                aria-label="Thêm giao dịch"
                className="relative -top-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/40 transition-transform duration-200 active:scale-95 hover:bg-accent-hover"
              >
                <Plus size={26} />
              </button>
            </div>
            {rightItems.map((item) => (
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
      className="flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px]"
      aria-current={active ? "page" : undefined}
    >
      <Icon size={22} className={cn("transition-colors", active ? "text-accent" : "text-text-muted")} />
      <span className={cn("text-[10px] font-medium transition-colors", active ? "text-accent" : "text-text-muted")}>
        {item.label}
      </span>
    </Link>
  );
}
