"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { USER_ROL_LABEL, type UserRole } from "@/lib/user-rol";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

// La fila tal como la devuelve api.equipo.listarEquipo. Se comparte con la
// página (que la usa como estado "editando").
export interface EquipoMiembro {
  _id: Id<"users">;
  name: string;
  email: string;
  role: UserRole;
  activo: boolean;
}

const ROLES: UserRole[] = ["comercial", "propietaria"];

export interface EditarUsuarioSheetProps {
  open: boolean;
  onClose: () => void;
  usuario: EquipoMiembro | null;
}

export function EditarUsuarioSheet({ open, onClose, usuario }: EditarUsuarioSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Editar usuario">
      {/* Igual que otros sheets: el form solo se monta con `open`, así cada
          apertura arranca desde los valores del usuario elegido sin useEffect. */}
      {open && usuario && <EditarUsuarioForm usuario={usuario} onClose={onClose} />}
    </Sheet>
  );
}

function EditarUsuarioForm({ usuario, onClose }: { usuario: EquipoMiembro; onClose: () => void }) {
  const editar = useMutation(api.equipo.editarUsuario);

  const [name, setName] = useState(usuario.name);
  const [role, setRole] = useState<UserRole>(usuario.role);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo se habilita si hay algo que cambiar (y no vacío).
  const canSubmit =
    name.trim().length > 0 &&
    (name.trim() !== usuario.name || role !== usuario.role) &&
    !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await editar({ id: usuario._id, name, role });
      onClose();
    } catch (err) {
      // El backend lanza ConvexError con el mensaje visible (nombre vacío,
      // "última Dueña activa"). Cualquier otro error → genérico.
      setError(
        err instanceof ConvexError
          ? String(err.data)
          : "No se pudo guardar el usuario. Inténtalo de nuevo.",
      );
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
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
      />

      <Input
        label="Email"
        value={usuario.email}
        disabled
        helperText="El email no se puede cambiar."
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="rol-editar" className="text-sm font-medium text-text">
          Rol
        </label>
        <select
          id="rol-editar"
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          className="h-12 w-full rounded-md border border-border-strong bg-surface px-3.5 text-[15px] text-text focus-visible:border-primary"
        >
          {ROLES.map((value) => (
            <option key={value} value={value}>
              {USER_ROL_LABEL[value]}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" className="w-full" disabled={!canSubmit} loading={submitting}>
        Guardar
      </Button>
    </form>
  );
}
