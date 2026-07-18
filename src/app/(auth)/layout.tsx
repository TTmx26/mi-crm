import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  );
}
