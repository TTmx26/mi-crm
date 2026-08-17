import { Phone, Mail, Calendar, MessageCircle, User, type LucideIcon } from "lucide-react";

export type InteraccionTipo = "llamada" | "email" | "reunion" | "whatsapp" | "en_persona";

export const INTERACCION_TIPO_LABEL: Record<InteraccionTipo, string> = {
  llamada: "Llamada",
  email: "Email",
  reunion: "Reunión",
  whatsapp: "WhatsApp",
  en_persona: "En persona",
};

export const INTERACCION_TIPOS: InteraccionTipo[] = ["llamada", "email", "reunion", "whatsapp", "en_persona"];

export const INTERACCION_TIPO_ICON: Record<InteraccionTipo, LucideIcon> = {
  llamada: Phone,
  email: Mail,
  reunion: Calendar,
  whatsapp: MessageCircle,
  en_persona: User,
};
