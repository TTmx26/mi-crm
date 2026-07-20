"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = EMAIL_RE.test(email) && password.length > 0 && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      router.push("/hoy");
    } catch {
      // Mensaje genérico a propósito: no revelar si falló el email o la
      // contraseña (evita que alguien use el login para comprobar qué
      // emails existen).
      setError("Email o contraseña incorrectos");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-center gap-2.5">
        <div className="flex size-[34px] items-center justify-center rounded-[9px] bg-primary text-on-primary font-semibold">
          V
        </div>
        <span className="text-[15px] font-semibold text-text">Vibe CRM</span>
      </div>

      <Card>
        <CardBody>
          <h1 className="text-xl font-semibold text-text">Inicia sesión</h1>
          <p className="mt-1 text-sm text-text-muted">Accede con tu email y contraseña.</p>

          <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && (
              <p role="alert" className="rounded-md bg-error-bg px-3.5 py-2.5 text-sm text-error-text">
                {error}
              </p>
            )}

            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoFocus
              placeholder="tu@empresa.com"
            />
            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-9 flex size-6 items-center justify-center text-text-subtle hover:text-text"
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.5} aria-hidden />
                ) : (
                  <Eye size={18} strokeWidth={1.5} aria-hidden />
                )}
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={!canSubmit} loading={submitting}>
              Entrar
            </Button>

            <Link
              href="/olvide-contrasena"
              className="text-center text-sm font-medium text-primary hover:text-primary-hover"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
