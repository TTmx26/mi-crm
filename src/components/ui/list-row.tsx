import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

export interface ListRowProps {
  name: string;
  subtitle?: string;
  amount?: string;
  badge?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ListRow({ name, subtitle, amount, badge, selected, onClick, className }: ListRowProps) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      onClick={onClick}
      type={onClick ? "button" : undefined}
      className={cn(
        "flex w-full items-center gap-3 border-b border-border px-[18px] py-3.5 text-left last:border-b-0",
        onClick && "transition-colors duration-[150ms] hover:bg-surface-2",
        selected && "bg-surface-2",
        className,
      )}
    >
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-text">{name}</p>
        {subtitle && <p className="truncate text-[13px] text-text-muted">{subtitle}</p>}
      </div>
      {badge}
      {amount && <span data-mono className="shrink-0 text-[15px] text-text">{amount}</span>}
    </Comp>
  );
}
