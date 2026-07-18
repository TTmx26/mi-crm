import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  variant?: "primary" | "neutral";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function Avatar({ name, variant = "primary", className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        variant === "primary" ? "bg-primary-subtle text-primary" : "bg-surface-2 text-text-muted",
        className,
      )}
      aria-hidden
      {...props}
    >
      {getInitials(name)}
    </div>
  );
}
