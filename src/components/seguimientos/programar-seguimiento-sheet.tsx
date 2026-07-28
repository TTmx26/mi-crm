"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hoyNegocioISO } from "@/lib/date";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export interface ProgramarSeguimientoSheetProps {
  open: boolean;
  onClose: () => void;
  // Si se pasa (ficha), el cliente es implícito y se muestra el selector de
  // "Asignado a". Si se omite (Hoy / "Nueva tarea"), hace falta elegir
  // cliente y el responsable es siempre el usuario actual.
  clienteId?: Id<"clientes">;
}

export function ProgramarSeguimientoSheet({ open, onClose, clienteId }: ProgramarSeguimientoSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Programar seguimiento">
      {/* Igual que los sheets anteriores: el formulario solo se monta
          mientras `open` es true, así cada apertura arranca en blanco
          (incluida la fecha mínima recalculada) sin useEffect + setState. */}
      {open && <ProgramarSeguimientoForm onClose={onClose} clienteId={clienteId} />}
    </Sheet>
  );
}

interface ProgramarSeguimientoFormProps {
  onClose: () => void;
  clienteId?: Id<"clientes">;
}

function ProgramarSeguimientoForm({ onClose, clienteId }: ProgramarSeguimientoFormProps) {
  const isFichaContext = clienteId !== undefined;
  const crear = useMutation(api.seguimientos.crear);
  const clientes = useQuery(api.clientes.listar, isFichaContext ? "skip" : {});
  const usuarios = useQuery(api.users.listar, isFichaContext ? {} : "skip");
  const currentUser = useCurrentUser();

  // hoyNegocioISO() coincide con lo que valida el servidor (Europe/Madrid),
  // a diferencia de todayISO(). Se calcula una sola vez al montar (mismo
  // criterio que el resto de inicializadores perezosos de este proyecto).
  const [minVence] = useState(() => hoyNegocioISO());

  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [accion, setAccion] = useState("");
  const [vence, setVence] = useState(minVence);
  const [responsableId, setResponsableId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedClienteId = clienteId ?? (selectedClienteId || undefined);
  // Mientras el usuario no elija a nadie, cae al usuario en sesión en cuanto
  // carga — sin useEffect ni sincronizar estado.
  const effectiveResponsableId = responsableId || currentUser?._id || "";

  const canSubmit =
    accion.trim().length > 0 &&
    vence.length > 0 &&
    Boolean(resolvedClienteId) &&
    (!isFichaContext || effectiveResponsableId.length > 0) &&
    !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || !resolvedClienteId) return;
    setError(null);
    setSubmitting(true);
    try {
      await crear({
        clienteId: resolvedClienteId as Id<"clientes">,
        accion: accion.trim(),
        vence,
        responsableId: isFichaContext ? (effectiveResponsableId as Id<"users">) : undefined,
      });
      setSubmitting(false);
      onClose();
    } catch {
      // No se limpia el formulario al fallar — mismo criterio que en el resto.
      setError("No se pudo programar el seguimiento. Inténtalo de nuevo.");
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

      {!isFichaContext && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cliente-seguimiento" className="text-sm font-medium text-text">
            Cliente
          </label>
          <select
            id="cliente-seguimiento"
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
        label="Qué hay que hacer"
        value={accion}
        onChange={(event) => setAccion(event.target.value)}
        autoFocus
        placeholder="Llamar para cerrar la propuesta"
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fecha-seguimiento" className="text-sm font-medium text-text">
          Fecha
        </label>
        <input
          id="fecha-seguimiento"
          type="date"
          required
          min={minVence}
          value={vence}
          onChange={(event) => setVence(event.target.value)}
          className="h-12 w-full rounded-md border border-border-strong bg-surface px-3.5 text-[15px] text-text focus-visible:border-primary"
        />
      </div>

      {isFichaContext && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="asignado-seguimiento" className="text-sm font-medium text-text">
            Asignado a
          </label>
          <select
            id="asignado-seguimiento"
            required
            value={effectiveResponsableId}
            onChange={(event) => setResponsableId(event.target.value)}
            className="h-12 w-full rounded-md border border-border-strong bg-surface px-3.5 text-[15px] text-text focus-visible:border-primary"
          >
            <option value="" disabled>
              {usuarios === undefined ? "Cargando…" : "Selecciona un usuario"}
            </option>
            {usuarios?.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={!canSubmit} loading={submitting}>
        Guardar
      </Button>
    </form>
  );
}
