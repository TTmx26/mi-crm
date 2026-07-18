import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  helperText?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, helperText, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className)}>
      <div className="flex size-12 items-center justify-center rounded-lg bg-surface-2 text-text-subtle">
        {icon}
      </div>
      <p className="text-[15px] font-semibold text-text">{title}</p>
      {helperText && <p className="text-[13px] text-text-muted">{helperText}</p>}
      {action}
    </div>
  );
}
