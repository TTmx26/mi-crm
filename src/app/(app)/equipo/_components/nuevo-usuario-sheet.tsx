"use client";

import { useState, type FormEvent } from "react";
import { useAction } from "convex/react";
import { ConvexError } from "convex/values";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { USER_ROL_LABEL, type UserRole } from "@/lib/user-rol";
import { api } from "../../../../../convex/_generated/api";

export interface NuevoUsuarioSheetProps {
  open: boolean;
  onClose: () => void;
}

// Comercial primero: es el rol por defecto de un alta normal (la Dueña ya existe).
const ROLES: UserRole[] = ["comercial", "propietaria"];

export function NuevoUsuarioSheet({ open, onClose }: NuevoUsuarioSheetProps) {
  const crear = useAction(api.equipo.crearUsuario);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("comercial");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && password.length >= 8 && !submitting;

  function reset() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("comercial");
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await crear({ name, email, password, role });
      // Éxito: se limpia y se cierra. listarEquipo es reactiva y refresca la lista sola.
      reset();
      onClose();
    } catch (err) {
      // El backend lanza ConvexError con el mensaje visible (email duplicado o
      // inválido, contraseña corta). Cualquier otro error → genérico. No se
      // limpia el formulario al fallar.
      setError(
        err instanceof ConvexError
          ? String(err.data)
          : "No se pudo crear el usuario. Inténtalo de nuevo.",
      );
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Añadir usuario">
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
          placeholder="Carlos García"
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="carlos@empresa.com"
        />

        <div className="flex flex-col gap-1.5">
          <Input
            label="Contraseña temporal"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 8 caracteres"
          />
          <p className="text-[13px] text-text-muted">
            La persona podrá cambiarla luego desde «Olvidé mi contraseña».
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="rol-usuario" className="text-sm font-medium text-text">
            Rol
          </label>
          <select
            id="rol-usuario"
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
          Crear usuario
        </Button>
      </form>
    </Sheet>
  );
}
