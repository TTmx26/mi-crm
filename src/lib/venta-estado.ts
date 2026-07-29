import type { BadgeVariant } from "@/components/ui/badge";

export type VentaEstado = "oportunidad_abierta" | "ganada" | "perdida";

export const VENTA_ESTADOS: VentaEstado[] = ["oportunidad_abierta", "ganada", "perdida"];

export const VENTA_ESTADO_LABEL: Record<VentaEstado, string> = {
  oportunidad_abierta: "Oportunidad abierta",
  ganada: "Venta ganada",
  perdida: "Venta perdida",
};

// "perdida" usa neutral (gris), no error: perder una venta es parte normal
// del negocio, no un fallo del sistema — mismo criterio que "inactivo" en
// cliente-estado.ts.
export const VENTA_ESTADO_BADGE_VARIANT: Record<VentaEstado, BadgeVariant> = {
  oportunidad_abierta: "info",
  ganada: "success",
  perdida: "neutral",
};
