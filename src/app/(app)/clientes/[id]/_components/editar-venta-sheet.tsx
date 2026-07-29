"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VENTA_ESTADO_LABEL, VENTA_ESTADOS, type VentaEstado } from "@/lib/venta-estado";
import { cn } from "@/lib/utils";
import { api } from "../../../../../../convex/_generated/api";
import type { Doc } from "../../../../../../convex/_generated/dataModel";

export interface EditarVentaSheetProps {
  venta: Doc<"ventas">;
  onClose: () => void;
}

export function EditarVentaSheet({ venta, onClose }: EditarVentaSheetProps) {
  return (
    <Sheet open onClose={onClose} title="Editar venta">
      {/* A diferencia de los otros sheets (open booleano fijo), este se monta
          y desmonta entero según haya o no una venta seleccionada para editar
          — mismo efecto (arranca limpio con los valores de `venta` cada vez),
          sin necesitar un `open` aparte. */}
      <EditarVentaForm venta={venta} onClose={onClose} />
    </Sheet>
  );
}

interface EditarVentaFormProps {
  venta: Doc<"ventas">;
  onClose: () => void;
}

function EditarVentaForm({ venta, onClose }: EditarVentaFormProps) {
  const editar = useMutation(api.ventas.editar);

  const [concepto, setConcepto] = useState(venta.concepto);
  const [importe, setImporte] = useState(String(venta.importe));
  const [estado, setEstado] = useState<VentaEstado>(venta.estado);
  const [fecha, setFecha] = useState(venta.fecha);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importeNum = Number(importe);
  const canSubmit =
    concepto.trim().length > 0 &&
    importe.trim().length > 0 &&
    Number.isFinite(importeNum) &&
    importeNum > 0 &&
    fecha.length > 0 &&
    !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await editar({
        id: venta._id,
        concepto: concepto.trim(),
        importe: importeNum,
        estado,
        fecha,
      });
      setSubmitting(false);
      onClose();
    } catch {
      setError("No se pudieron guardar los cambios. Inténtalo de nuevo.");
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

      <Input
        label="Descripción"
        value={concepto}
        onChange={(event) => setConcepto(event.target.value)}
        autoFocus
        placeholder="Consultoría mensual, pack de plantillas…"
      />

      <Input
        label="Importe (€)"
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
        <label htmlFor="fecha-editar-venta" className="text-sm font-medium text-text">
          Fecha
        </label>
        <input
          id="fecha-editar-venta"
          type="date"
          required
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          className="h-12 w-full rounded-md border border-border-strong bg-surface px-3.5 text-[15px] text-text focus-visible:border-primary"
        />
      </div>

      <Button type="submit" className="w-full" disabled={!canSubmit} loading={submitting}>
        Guardar cambios
      </Button>
    </form>
  );
}
