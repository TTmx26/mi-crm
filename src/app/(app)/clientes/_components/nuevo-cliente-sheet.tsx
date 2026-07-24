"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { Check } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CLIENTE_PRIORIDAD_LABEL, type ClientePrioridad } from "@/lib/cliente-prioridad";
import { CLIENTE_CANAL_LABEL, CLIENTE_CANALES, type ClienteCanalOrigen } from "@/lib/cliente-canal";
import { cn } from "@/lib/utils";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

const PRIORIDADES: ClientePrioridad[] = ["alta", "media", "baja"];

// Mismos tokens de color que Badge (error/warning/neutral) — visibles aunque
// la opción no esté seleccionada, para que "cada opción vaya acompañada de
// un color" (HOP-42) incluso antes de elegir.
const PRIORIDAD_CHIP_CLASSES: Record<ClientePrioridad, string> = {
  alta: "bg-error-bg text-error-text",
  media: "bg-warning-bg text-warning-text",
  baja: "bg-surface-2 text-text-muted",
};

export interface NuevoClienteSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: Id<"clientes">) => void;
}

export function NuevoClienteSheet({ open, onClose, onCreated }: NuevoClienteSheetProps) {
  const crear = useMutation(api.clientes.crear);

  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [canalOrigen, setCanalOrigen] = useState<ClienteCanalOrigen | null>(null);
  const [prioridad, setPrioridad] = useState<ClientePrioridad | null>(null);
  const [nota, setNota] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    nombre.trim().length > 0 && (telefono.trim().length > 0 || email.trim().length > 0) && !submitting;

  function reset() {
    setNombre("");
    setEmpresa("");
    setTelefono("");
    setEmail("");
    setCanalOrigen(null);
    setPrioridad(null);
    setNota("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const id = await crear({
        nombre,
        empresa: empresa || undefined,
        telefono: telefono || undefined,
        email: email || undefined,
        canalOrigen: canalOrigen ?? undefined,
        prioridad: prioridad ?? undefined,
        nota: nota || undefined,
      });
      reset();
      onCreated?.(id);
      onClose();
    } catch {
      // No se limpia el formulario al fallar — así lo pide HOP-16.
      setError("No se pudo guardar el cliente. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Nuevo cliente">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {error && (
          <p role="alert" className="rounded-md bg-error-bg px-3.5 py-2.5 text-sm text-error-text">
            {error}
          </p>
        )}

        <Input
          label="Nombre"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          autoFocus
          placeholder="Nombre del cliente"
        />

        <Input
          label="Empresa"
          value={empresa}
          onChange={(event) => setEmpresa(event.target.value)}
          placeholder="Opcional"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Teléfono"
            type="tel"
            value={telefono}
            onChange={(event) => setTelefono(event.target.value)}
            placeholder="600 000 000"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="cliente@empresa.com"
          />
        </div>
        <p className="-mt-2 text-[13px] text-text-muted">Al menos uno de los dos es obligatorio.</p>

        <div>
          <p className="mb-2 text-sm font-medium text-text">Canal de origen</p>
          <div className="flex flex-wrap gap-2">
            {CLIENTE_CANALES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCanalOrigen(canalOrigen === value ? null : value)}
                className={cn(
                  "min-h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-[150ms]",
                  canalOrigen === value
                    ? "border-primary bg-primary-subtle text-primary"
                    : "border-border-strong bg-surface text-text-muted hover:bg-surface-2",
                )}
              >
                {CLIENTE_CANAL_LABEL[value]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-text">Prioridad</p>
          <div className="flex flex-wrap gap-2">
            {PRIORIDADES.map((value) => {
              const active = prioridad === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPrioridad(active ? null : value)}
                  className={cn(
                    "flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-all duration-[150ms]",
                    PRIORIDAD_CHIP_CLASSES[value],
                    active ? "opacity-100 ring-2 ring-current" : "opacity-60 hover:opacity-80",
                  )}
                >
                  {active && <Check size={14} strokeWidth={2.5} aria-hidden />}
                  {CLIENTE_PRIORIDAD_LABEL[value]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nota-cliente" className="text-sm font-medium text-text">
            Nota
          </label>
          <textarea
            id="nota-cliente"
            value={nota}
            onChange={(event) => setNota(event.target.value)}
            placeholder="Opcional"
            rows={2}
            className="w-full rounded-md border border-border-strong bg-surface px-3.5 py-2.5 text-[15px] text-text placeholder:text-text-subtle transition-colors duration-[150ms] focus-visible:border-primary"
          />
        </div>

        <Button type="submit" className="w-full" disabled={!canSubmit} loading={submitting}>
          Guardar
        </Button>
      </form>
    </Sheet>
  );
}
