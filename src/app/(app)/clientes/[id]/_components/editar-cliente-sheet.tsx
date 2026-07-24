"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CLIENTE_CANAL_LABEL, CLIENTE_CANALES, type ClienteCanalOrigen } from "@/lib/cliente-canal";
import { cn } from "@/lib/utils";
import { api } from "../../../../../../convex/_generated/api";
import type { Doc } from "../../../../../../convex/_generated/dataModel";

export interface EditarClienteSheetProps {
  open: boolean;
  onClose: () => void;
  cliente: Doc<"clientes">;
}

export function EditarClienteSheet({ open, onClose, cliente }: EditarClienteSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Editar cliente">
      {/* El Sheet permanece montado entre aperturas; el formulario solo se
          monta mientras `open` es true, así que cada apertura arranca desde
          cero con los valores actuales de `cliente` (sin useEffect ni
          setState en el cuerpo de un efecto). */}
      {open && <EditarClienteForm cliente={cliente} onClose={onClose} />}
    </Sheet>
  );
}

interface EditarClienteFormProps {
  cliente: Doc<"clientes">;
  onClose: () => void;
}

function EditarClienteForm({ cliente, onClose }: EditarClienteFormProps) {
  const editar = useMutation(api.clientes.editar);

  const [nombre, setNombre] = useState(cliente.nombre);
  const [empresa, setEmpresa] = useState(cliente.empresa ?? "");
  const [telefono, setTelefono] = useState(cliente.telefono ?? "");
  const [email, setEmail] = useState(cliente.email ?? "");
  const [canalOrigen, setCanalOrigen] = useState<ClienteCanalOrigen | null>(cliente.canalOrigen ?? null);
  const [nota, setNota] = useState(cliente.nota ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    nombre.trim().length > 0 && (telefono.trim().length > 0 || email.trim().length > 0) && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await editar({
        id: cliente._id,
        nombre,
        empresa: empresa || undefined,
        telefono: telefono || undefined,
        email: email || undefined,
        canalOrigen: canalOrigen ?? undefined,
        nota: nota || undefined,
      });
      setSubmitting(false);
      onClose();
    } catch {
      // No se limpia el formulario al fallar — mismo criterio que en el alta (HOP-16).
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nota-editar-cliente" className="text-sm font-medium text-text">
          Nota
        </label>
        <textarea
          id="nota-editar-cliente"
          value={nota}
          onChange={(event) => setNota(event.target.value)}
          placeholder="Opcional"
          rows={2}
          className="w-full rounded-md border border-border-strong bg-surface px-3.5 py-2.5 text-[15px] text-text placeholder:text-text-subtle transition-colors duration-[150ms] focus-visible:border-primary"
        />
      </div>

      <Button type="submit" className="w-full" disabled={!canSubmit} loading={submitting}>
        Guardar cambios
      </Button>
    </form>
  );
}
