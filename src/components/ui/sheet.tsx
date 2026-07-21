"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

// Overlay genérico (bottom sheet en móvil, modal centrado en escritorio) para
// cualquier formulario del proyecto — no hay nada específico de "cliente"
// aquí a propósito, así lo reutilizan los próximos formularios (Nueva tarea,
// Interacción, Venta).
//
// `<dialog>` nativo en vez de una librería: da gratis capa superior, scrim
// (`backdrop:`, variante confirmada en Tailwind v4), focus trap y cierre con
// Esc. El atributo `open` nunca se controla vía JSX (evitaría cualquier
// desajuste de hidratación) — se abre/cierra imperativamente por ref.
export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleClose() {
      onClose();
    }
    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleClose);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 m-0 max-h-none max-w-none border-0 bg-transparent p-0 backdrop:bg-[rgba(16,24,32,.45)]"
    >
      <div className="flex h-full items-end justify-center md:items-center">
        <div
          className={cn(
            "w-full rounded-t-2xl bg-surface shadow-lg md:w-[480px] md:rounded-xl",
            className,
          )}
          style={{ animation: "vibe-slide-up 200ms var(--ease-standard)" }}
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 id={titleId} className="text-lg font-semibold text-text">
              {title}
            </h2>
            <Button type="button" variant="ghost" size="icon-compact" onClick={onClose} aria-label="Cerrar">
              <X size={20} strokeWidth={1.5} aria-hidden />
            </Button>
          </div>
          <div className="max-h-[80vh] overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    </dialog>
  );
}
