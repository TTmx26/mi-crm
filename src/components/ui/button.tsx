import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "default" | "compact" | "icon" | "icon-compact";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active disabled:bg-surface-2 disabled:text-text-subtle disabled:border disabled:border-border",
  secondary:
    "bg-surface border border-border-strong text-text hover:bg-surface-2 disabled:bg-surface-2 disabled:text-text-subtle",
  ghost: "bg-transparent text-text-muted hover:bg-surface-2 disabled:text-text-subtle",
  destructive: "bg-error text-white hover:brightness-90 disabled:bg-surface-2 disabled:text-text-subtle",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-12 px-5 text-[15px] font-semibold rounded-md gap-2",
  compact: "h-11 px-4 text-sm font-semibold rounded-md gap-2",
  icon: "h-12 w-12 rounded-md",
  "icon-compact": "h-11 w-11 rounded-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap transition-colors",
          "disabled:cursor-not-allowed disabled:shadow-none",
          "duration-[150ms] ease-[var(--ease-standard)]",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : children}
      </button>
    );
  },
);
Button.displayName = "Button";
