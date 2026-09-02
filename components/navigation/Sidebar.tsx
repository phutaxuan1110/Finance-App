"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./navItems";
import { SnakeMascot } from "@/components/mascot/SnakeMascot";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";

export const Sidebar = forwardRef<HTMLButtonElement, { onAddClick: () => void }>(function Sidebar(
  { onAddClick },
  addButtonRef
) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:h-screen md:sticky md:top-0 border-r border-white/[0.06] px-5 py-6">
      <div className="flex items-center gap-3 mb-8 px-1">
        <SnakeMascot size={40} expression="happy" />
        <div>
          <p className="font-semibold leading-tight">{APP_NAME}</p>
          <p className="text-[11px] text-text-muted leading-tight">{APP_TAGLINE}</p>
        </div>
      </div>

      <button
        ref={addButtonRef}
        onClick={onAddClick}
        className="mb-6 flex items-center justify-center gap-2 h-11 rounded-2xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
      >
        <Plus size={18} /> Thêm giao dịch
      </button>

      <nav className="flex flex-col gap-1" aria-label="Điều hướng chính">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
                active ? "bg-accent/15 text-accent-soft" : "text-text-muted hover:bg-white/[0.05] hover:text-text-primary"
              )}
            >
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 text-[11px] text-text-muted px-1">
        Dữ liệu được lưu trên thiết bị này.
      </div>
    </aside>
  );
});
