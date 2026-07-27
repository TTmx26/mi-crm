"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { INTERACCION_TIPO_LABEL, INTERACCION_TIPOS, type InteraccionTipo } from "@/lib/interaccion-tipo";
import { todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export interface AnotarInteraccionSheetProps {
  open: boolean;
  onClose: () => void;
  // Si se pasa (ficha de cliente), el cliente es implícito y no se muestra
  // selector. Si se omite (Hoy), hace falta elegirlo (HOP-57).
  clienteId?: Id<"clientes">;
}

export function AnotarInteraccionSheet({ open, onClose, clienteId }: AnotarInteraccionSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Anotar interacción">
      {/* Igual que EditarClienteSheet (HOP-18): el formulario solo se monta
          mientras `open` es true, así cada apertura arranca en blanco
          (incluida la fecha de hoy recalculada) sin useEffect + setState. */}
      {open && <AnotarInteraccionForm onClose={onClose} clienteId={clienteId} />}
    </Sheet>
  );
}

interface AnotarInteraccionFormProps {
  onClose: () => void;
  clienteId?: Id<"clientes">;
}

function AnotarInteraccionForm({ onClose, clienteId }: AnotarInteraccionFormProps) {
  const crear = useMutation(api.interacciones.crear);
  const clientes = useQuery(api.clientes.listar, clienteId === undefined ? {} : "skip");

  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [tipo, setTipo] = useState<InteraccionTipo | null>(null);
  const [fecha, setFecha] = useState(() => todayISO());
  const [texto, setTexto] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedClienteId = clienteId ?? (selectedClienteId || undefined);
  const canSubmit =
    Boolean(resolvedClienteId) &&
    tipo !== null &&
    fecha.length > 0 &&
    texto.trim().length > 0 &&
    !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || !resolvedClienteId || !tipo) return;
    setError(null);
    setSubmitting(true);
    try {
      await crear({ clienteId: resolvedClienteId as Id<"clientes">, tipo, texto, fecha });
      setSubmitting(false);
      onClose();
    } catch {
      // No se limpia el formulario al fallar — mismo criterio que en clientes.
      setError("No se pudo guardar la interacción. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {error && (
        <p role="alert" className="rounded-md bg-error-bg px-3.5 py-2.5 text-sm text-error-text">
          {error}
        </p>
      )}

      {clienteId === undefined && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cliente-interaccion" className="text-sm font-medium text-text">
            Cliente
          </label>
          <select
            id="cliente-interaccion"
            required
            value={selectedClienteId}
            onChange={(event) => setSelectedClienteId(event.target.value)}
            className="h-12 w-full rounded-md border border-border-strong bg-surface px-3.5 text-[15px] text-text focus-visible:border-primary"
          >
            <option value="" disabled>
              {clientes === undefined ? "Cargando…" : "Selecciona un cliente"}
            </option>
            {clientes?.map((c) => (
              <option key={c._id} value={c._id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-text">Canal</p>
        <div className="flex flex-wrap gap-2">
          {INTERACCION_TIPOS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTipo(tipo === value ? null : value)}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-[150ms]",
                tipo === value
                  ? "border-primary bg-primary-subtle text-primary"
                  : "border-border-strong bg-surface text-text-muted hover:bg-surface-2",
              )}
            >
              {INTERACCION_TIPO_LABEL[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fecha-interaccion" className="text-sm font-medium text-text">
          Fecha
        </label>
        <input
          id="fecha-interaccion"
          type="date"
          required
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          className="h-12 w-full rounded-md border border-border-strong bg-surface px-3.5 text-[15px] text-text focus-visible:border-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="texto-interaccion" className="text-sm font-medium text-text">
          Qué se habló
        </label>
        <textarea
          id="texto-interaccion"
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          placeholder="Resumen de la conversación"
          rows={4}
          autoFocus={clienteId !== undefined}
          className="w-full rounded-md border border-border-strong bg-surface px-3.5 py-2.5 text-[15px] text-text placeholder:text-text-subtle transition-colors duration-[150ms] focus-visible:border-primary"
        />
      </div>

      <Button type="submit" className="w-full" disabled={!canSubmit} loading={submitting}>
        Guardar
      </Button>
    </form>
  );
}
