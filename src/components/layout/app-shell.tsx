import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TabBar } from "@/components/layout/tab-bar";
import { ThemeMenu } from "@/components/ui/theme-menu";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Franja superior propia para el selector de tema (arriba a la derecha).
            Va encima del contenido de cada pantalla, así el icono no pisa la
            acción del PageHeader ni la barra de pestañas. */}
        <header className="sticky top-0 z-30 flex justify-end bg-bg px-4 pt-3 pb-1 md:px-8">
          <ThemeMenu />
        </header>
        <main className="mx-auto w-full max-w-[860px] flex-1 px-4 pb-24 pt-3 md:px-8 md:pb-10 md:pt-4">
          {children}
        </main>
      </div>
      <TabBar />
    </div>
  );
}
