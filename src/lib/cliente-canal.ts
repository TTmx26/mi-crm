export type ClienteCanalOrigen = "web" | "redes" | "email" | "whatsapp";

export const CLIENTE_CANAL_LABEL: Record<ClienteCanalOrigen, string> = {
  web: "Web",
  redes: "Redes",
  email: "Email",
  whatsapp: "WhatsApp",
};

export const CLIENTE_CANALES: ClienteCanalOrigen[] = ["web", "redes", "email", "whatsapp"];
