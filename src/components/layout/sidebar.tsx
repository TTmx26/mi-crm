"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { visibleNavItems } from "@/components/layout/nav-items";
import { getCurrentUser } from "@/lib/mock-session";
import { Avatar } from "@/components/ui/avatar";

export function Sidebar() {
  const pathname = usePathname();
  const user = getCurrentUser();
  const items = visibleNavItems(user.role);

  return (
    <aside
      aria-label="Navegación principal"
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface md:flex"
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-[34px] items-center justify-center rounded-[9px] bg-primary text-on-primary font-semibold">
          V
        </div>
        <span className="text-[15px] font-semibold text-text">Vibe CRM</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-[15px] font-medium transition-colors duration-[150ms]",
                active ? "bg-primary-subtle text-primary" : "text-text-muted hover:bg-surface-2",
              )}
            >
              <Icon size={20} strokeWidth={1.5} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/cuenta"
        className="mx-3 mb-4 flex items-center gap-3 rounded-md p-2 text-left hover:bg-surface-2"
      >
        <Avatar name={user.name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text">{user.name}</p>
          <p className="truncate text-[13px] text-text-muted">
            {user.role === "propietaria" ? "Dueña" : "Atiende y vende"}
          </p>
        </div>
      </Link>
    </aside>
  );
}
