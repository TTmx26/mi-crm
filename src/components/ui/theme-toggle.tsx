"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type ThemePref } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

const OPCIONES: { value: ThemePref; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
];

// Control segmentado del tema (mismo patrón que el filtro de /ventas). El estado
// activo sale de useTheme; en SSR/primer render la preferencia es "system"
// (coincide con el fallback del provider), luego se reconcilia con lo guardado.
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Tema"
      className="flex gap-1 rounded-md border border-border bg-surface p-1"
    >
      {OPCIONES.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => setPreference(value)}
            className={cn(
              "flex h-10 flex-1 items-center justify-center gap-2 rounded-sm text-sm font-medium transition-colors duration-[150ms]",
              active ? "bg-primary-subtle text-primary" : "text-text-muted hover:bg-surface-2",
            )}
          >
            <Icon size={16} strokeWidth={1.5} aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
