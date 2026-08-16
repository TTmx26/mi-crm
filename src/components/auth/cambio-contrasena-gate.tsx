"use client";

import type { ReactNode } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { CambiarContrasenaInterstitial } from "./cambiar-contrasena-interstitial";

// Barrera del primer login: si el usuario debe cambiar su contraseña temporal,
// se muestra el interstitial en lugar de la app (sin sidebar/tabbar). No es la
// barrera de seguridad —cada función de Convex verifica la sesión por su cuenta—
// sino el empujón de UX para que fije su contraseña antes de trabajar.
export function CambioContrasenaGate({ children }: { children: ReactNode }) {
  const user = useCurrentUser();

  // Cargando: no parpadear la app antes de saber si hay que forzar el cambio.
  // (El middleware ya garantizó que hay sesión para las rutas de /(app).)
  if (user === undefined) return null;
  if (user?.debeCambiarContrasena) return <CambiarContrasenaInterstitial />;
  return <>{children}</>;
}
