"use client";

import { useState, type FormEvent } from "react";
import { useAction, useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
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
  const desactivar = useAction(api.equipo.desactivarUsuario);
  const reactivar = useMutation(api.equipo.reactivarUsuario);
  const currentUser = useCurrentUser();

  const [name, setName] = useState(usuario.name);
  const [role, setRole] = useState<UserRole>(usuario.role);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDesactivar, setConfirmDesactivar] = useState(false);
  const [accessSubmitting, setAccessSubmitting] = useState(false);

  // No se ofrece "Desactivar" sobre uno mismo (el backend igual lo bloquea).
  const esUnoMismo = currentUser?._id === usuario._id;

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

  async function handleDesactivar() {
    setError(null);
    setAccessSubmitting(true);
    try {
      await desactivar({ id: usuario._id });
      onClose();
    } catch (err) {
      setError(
        err instanceof ConvexError
          ? String(err.data)
          : "No se pudo desactivar el acceso. Inténtalo de nuevo.",
      );
      setAccessSubmitting(false);
      setConfirmDesactivar(false);
    }
  }

  async function handleReactivar() {
    setError(null);
    setAccessSubmitting(true);
    try {
      await reactivar({ id: usuario._id });
      onClose();
    } catch (err) {
      setError(
        err instanceof ConvexError
          ? String(err.data)
          : "No se pudo reactivar el acceso. Inténtalo de nuevo.",
      );
      setAccessSubmitting(false);
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

      {/* Zona de acceso: separada del formulario de edición. No aparece sobre la
          propia cuenta (no auto-desactivarse). */}
      {!esUnoMismo && (
        <div className="mt-1 border-t border-border pt-4">
          {usuario.activo ? (
            confirmDesactivar ? (
              <div className="flex flex-col gap-2">
                <p className="text-[13px] text-text-muted">
                  Se cerrará su sesión y no podrá entrar hasta que lo reactives. Su historial se conserva.
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="destructive" onClick={handleDesactivar} loading={accessSubmitting}>
                    Sí, desactivar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setConfirmDesactivar(false)}
                    disabled={accessSubmitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDesactivar(true)}
                className="text-sm font-medium text-error-text hover:underline"
              >
                Desactivar acceso
              </button>
            )
          ) : (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleReactivar}
              loading={accessSubmitting}
            >
              Reactivar acceso
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
