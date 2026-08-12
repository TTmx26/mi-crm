import type { BadgeVariant } from "@/components/ui/badge";
import type { Doc } from "../../convex/_generated/dataModel";

export type UserRole = Doc<"users">["role"];

// Etiquetas visibles de los roles. Coinciden con las ya usadas en la barra
// lateral (sidebar.tsx) y en /cuenta para no mostrar dos nombres distintos del
// mismo rol. (Reusarlas también en esas dos vistas queda como limpieza aparte.)
export const USER_ROL_LABEL: Record<UserRole, string> = {
  propietaria: "Dueña",
  comercial: "Atiende y vende",
};

export const USER_ROL_BADGE_VARIANT: Record<UserRole, BadgeVariant> = {
  propietaria: "primary",
  comercial: "neutral",
};
