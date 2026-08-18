"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme, type ThemePref } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

const OPCIONES: { value: ThemePref; label: string; Icon: typeof Moon }[] = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
];

// Icono de luna (arriba a la derecha) que despliega el selector de tema
// Claro / Oscuro / Sistema. Vive en la franja superior del AppShell, así que
// aparece en todas las pantallas sin pisar la acción de cada PageHeader.
export function ThemeMenu() {
  const { preference, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Tema"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-10 items-center justify-center rounded-full border border-border-strong bg-surface text-text-muted shadow-sm transition-colors duration-[150ms] hover:bg-surface-2 hover:text-text"
      >
        <Moon size={18} strokeWidth={1.5} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Tema"
          className="absolute right-0 top-12 z-50 w-44 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
        >
          {OPCIONES.map(({ value, label, Icon }) => {
            const active = preference === value;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setPreference(value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-[150ms]",
                  active ? "font-medium text-primary" : "text-text hover:bg-surface-2",
                )}
              >
                <Icon size={16} strokeWidth={1.5} aria-hidden />
                <span className="flex-1 text-left">{label}</span>
                {active && <Check size={16} strokeWidth={2} aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
