import type { BadgeVariant } from "@/components/ui/badge";

export type ClientePrioridad = "alta" | "media" | "baja";

export const CLIENTE_PRIORIDAD_LABEL: Record<ClientePrioridad, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const CLIENTE_PRIORIDAD_BADGE_VARIANT: Record<ClientePrioridad, BadgeVariant> = {
  alta: "error",
  media: "warning",
  baja: "neutral",
};
