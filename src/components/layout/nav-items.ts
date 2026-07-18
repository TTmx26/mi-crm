import { ListChecks, Users, TrendingUp, UserCog } from "lucide-react";
import type { UserRole } from "@/lib/mock-session";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof ListChecks;
  requiresRole?: UserRole;
}

export const navItems: NavItem[] = [
  { href: "/hoy", label: "Hoy", icon: ListChecks },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/ventas", label: "Ventas", icon: TrendingUp },
  { href: "/equipo", label: "Equipo", icon: UserCog, requiresRole: "propietaria" },
];

export function visibleNavItems(role: UserRole): NavItem[] {
  return navItems.filter((item) => !item.requiresRole || item.requiresRole === role);
}
