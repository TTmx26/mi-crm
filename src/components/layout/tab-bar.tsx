"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { visibleNavItems } from "@/components/layout/nav-items";
import { useCurrentUser } from "@/hooks/use-current-user";

export function TabBar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const items = visibleNavItems(user?.role);

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface md:hidden"
      style={{ height: 64, paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-1",
              active ? "text-primary" : "text-text-subtle",
            )}
          >
            <Icon size={22} strokeWidth={1.5} aria-hidden />
            <span className={cn("text-[11px]", active ? "font-semibold" : "font-medium")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
