import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TabBar } from "@/components/layout/tab-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[860px] flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
          {children}
        </main>
      </div>
      <TabBar />
    </div>
  );
}
