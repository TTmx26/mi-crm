import { Phone, Mail, MessageCircle, User, type LucideIcon } from "lucide-react";

export type InteraccionTipo = "llamada" | "email" | "whatsapp" | "en_persona";

export const INTERACCION_TIPO_LABEL: Record<InteraccionTipo, string> = {
  llamada: "Llamada",
  email: "Email",
  whatsapp: "WhatsApp",
  en_persona: "En persona",
};

export const INTERACCION_TIPOS: InteraccionTipo[] = ["llamada", "email", "whatsapp", "en_persona"];

export const INTERACCION_TIPO_ICON: Record<InteraccionTipo, LucideIcon> = {
  llamada: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  en_persona: User,
};
