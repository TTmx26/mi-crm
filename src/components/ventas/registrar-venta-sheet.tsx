"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VENTA_ESTADO_LABEL, VENTA_ESTADOS, type VentaEstado } from "@/lib/venta-estado";
import { todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export interface RegistrarVentaSheetProps {
  open: boolean;
  onClose: () => void;
  // Si se pasa (ficha), el cliente es implícito. Si se omite (Hoy), hace
  // falta elegirlo — mismo patrón que AnotarInteraccionSheet/ProgramarSeguimientoSheet.
  clienteId?: Id<"clientes">;
}

export function RegistrarVentaSheet({ open, onClose, clienteId }: RegistrarVentaSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Registrar venta">
      {/* Igual que los sheets anteriores: el formulario solo se monta
          mientras `open` es true, así cada apertura arranca en blanco sin
          useEffect + setState. */}
      {open && <RegistrarVentaForm onClose={onClose} clienteId={clienteId} />}
    </Sheet>
  );
}

interface RegistrarVentaFormProps {
  onClose: () => void;
  clienteId?: Id<"clientes">;
}

function RegistrarVentaForm({ onClose, clienteId }: RegistrarVentaFormProps) {
  const crear = useMutation(api.ventas.crear);
  const clientes = useQuery(api.clientes.listar, clienteId === undefined ? {} : "skip");

  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [concepto, setConcepto] = useState("");
  const [importe, setImporte] = useState("");
  // "Oportunidad abierta" preseleccionada: es el caso más común al registrar
  // (a diferencia del canal de interacción, que arranca sin selección).
  const [estado, setEstado] = useState<VentaEstado>("oportunidad_abierta");
  const [fecha, setFecha] = useState(() => todayISO());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedClienteId = clienteId ?? (selectedClienteId || undefined);
  const importeNum = Number(importe);
  const canSubmit =
    Boolean(resolvedClienteId) &&
    concepto.trim().length > 0 &&
    importe.trim().length > 0 &&
    Number.isFinite(importeNum) &&
    importeNum > 0 &&
    fecha.length > 0 &&
    !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || !resolvedClienteId) return;
    setError(null);
    setSubmitting(true);
    try {
      await crear({
        clienteId: resolvedClienteId as Id<"clientes">,
        concepto: concepto.trim(),
        importe: importeNum,
        estado,
        fecha,
      });
      setSubmitting(false);
      onClose();
    } catch {
      // No se limpia el formulario al fallar — mismo criterio que en el resto.
      setError("No se pudo registrar la venta. Inténtalo de nuevo.");
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
          <label htmlFor="cliente-venta" className="text-sm font-medium text-text">
            Cliente
          </label>
          <select
            id="cliente-venta"
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

      <Input
        label="Descripción"
        value={concepto}
        onChange={(event) => setConcepto(event.target.value)}
        autoFocus
        placeholder="Consultoría mensual, pack de plantillas…"
      />

      <Input
        label="Importe ($)"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0.01"
        value={importe}
        onChange={(event) => setImporte(event.target.value)}
        placeholder="0,00"
      />

      <div>
        <p className="mb-2 text-sm font-medium text-text">Estado</p>
        <div className="flex flex-wrap gap-2">
          {VENTA_ESTADOS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setEstado(value)}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-[150ms]",
                estado === value
                  ? "border-primary bg-primary-subtle text-primary"
                  : "border-border-strong bg-surface text-text-muted hover:bg-surface-2",
              )}
            >
              {VENTA_ESTADO_LABEL[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fecha-venta" className="text-sm font-medium text-text">
          Fecha
        </label>
        <input
          id="fecha-venta"
          type="date"
          required
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          className="h-12 w-full rounded-md border border-border-strong bg-surface px-3.5 text-[15px] text-text focus-visible:border-primary"
        />
      </div>

      <Button type="submit" className="w-full" disabled={!canSubmit} loading={submitting}>
        Guardar
      </Button>
    </form>
  );
}
