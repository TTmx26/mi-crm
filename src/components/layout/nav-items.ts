import { ListChecks, Users, TrendingUp, UserCog } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

export type UserRole = Doc<"users">["role"];

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

// `role` es null/undefined mientras la sesión carga o si no hay usuario —
// en ambos casos, fail-closed: no se muestran los items restringidos.
export function visibleNavItems(role: UserRole | null | undefined): NavItem[] {
  return navItems.filter((item) => !item.requiresRole || item.requiresRole === role);
}
