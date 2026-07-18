import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, icon, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-text-subtle">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={cn(
              "h-12 w-full rounded-md border bg-surface px-3.5 text-[15px] text-text placeholder:text-text-subtle",
              "transition-colors duration-[150ms] ease-[var(--ease-standard)]",
              "focus-visible:border-primary disabled:bg-surface-2 disabled:text-text-subtle",
              icon && "pl-10",
              error ? "border-error" : "border-border-strong",
              className,
            )}
            {...props}
          />
        </div>
        {error ? (
          <p id={`${inputId}-error`} role="alert" className="text-[13px] text-error-text">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-[13px] text-text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
