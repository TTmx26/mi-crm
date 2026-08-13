import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { CambioContrasenaGate } from "@/components/auth/cambio-contrasena-gate";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <CambioContrasenaGate>
      <AppShell>{children}</AppShell>
    </CambioContrasenaGate>
  );
}
