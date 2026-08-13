"use client";

import { useState, type FormEvent } from "react";
import { useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "../../../convex/_generated/api";

// Pantalla que se muestra en lugar de la app cuando el usuario debe cambiar su
// contraseña temporal (ver CambioContrasenaGate). Al fijarla, el backend limpia
// el flag y `viewer` reactivo hace que el gate renderice la app.
export function CambiarContrasenaInterstitial() {
  const cambiar = useAction(api.cuenta.cambiarMiContrasena);
  const { signOut } = useAuthActions();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = password.length >= 8 && password === confirm && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await cambiar({ newPassword: password });
      // No se resetea nada: al limpiarse el flag, el gate desmonta este componente.
    } catch (err) {
      setError(
        err instanceof ConvexError
          ? String(err.data)
          : "No se pudo cambiar la contraseña. Inténtalo de nuevo.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[400px]">
        <Card>
          <CardBody>
            <h1 className="text-xl font-semibold text-text">Crea tu contraseña</h1>
            <p className="mt-1 text-sm text-text-muted">
              Estás usando una contraseña temporal. Elige una nueva para continuar.
            </p>

            {error && (
              <p role="alert" className="mt-4 rounded-md bg-error-bg px-3.5 py-2.5 text-sm text-error-text">
                {error}
              </p>
            )}

            <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
              <Input
                label="Nueva contraseña"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
              />
              <Input
                label="Repetir contraseña"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                error={confirm.length > 0 && confirm !== password ? "No coinciden" : undefined}
              />
              <Button type="submit" className="w-full" disabled={!canSubmit} loading={submitting}>
                Guardar y continuar
              </Button>
            </form>

            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-4 w-full text-center text-sm font-medium text-text-muted hover:text-text"
            >
              Cerrar sesión
            </button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
