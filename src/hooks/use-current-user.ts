"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// undefined = cargando, null = sin sesión, objeto = sesión cargada.
export function useCurrentUser() {
  return useQuery(api.users.viewer);
}
