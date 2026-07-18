import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vibe CRM",
    short_name: "Vibe CRM",
    description: "CRM para pequeños negocios de venta digital.",
    start_url: "/hoy",
    display: "standalone",
    background_color: "#F7F8F9",
    theme_color: "#16A34A",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
