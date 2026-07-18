import type { BadgeVariant } from "@/components/ui/badge";

export type ClienteEstado = "nuevo_lead" | "en_negociacion" | "activo" | "inactivo";

export const CLIENTE_ESTADO_LABEL: Record<ClienteEstado, string> = {
  nuevo_lead: "Nuevo lead",
  en_negociacion: "En negociación",
  activo: "Activo",
  inactivo: "Inactivo",
};

export const CLIENTE_ESTADO_BADGE_VARIANT: Record<ClienteEstado, BadgeVariant> = {
  nuevo_lead: "info",
  en_negociacion: "primary",
  activo: "success",
  inactivo: "neutral",
};
