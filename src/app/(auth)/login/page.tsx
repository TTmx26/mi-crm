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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

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

  async function handleGoogle() {
    setError(null);
    try {
      // redirectTo explícito (igual que el router.push tras el login por
      // contraseña) en vez de depender del destino por defecto de la
      // librería. Si el email de Google no tiene cuenta, convex-dev/auth
      // atrapa el error en su propio router HTTP y redirige en silencio de
      // vuelta a /login sin exponer ningún mensaje — de ahí el texto de
      // ayuda fijo bajo el botón en vez de un error dinámico.
      await signIn("google", { redirectTo: "/hoy" });
    } catch {
      setError("No se pudo iniciar el acceso con Google");
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
          <p className="mt-1 text-sm text-text-muted">Accede con tu email y contraseña, o con Google.</p>

          {error && (
            <p role="alert" className="mt-4 rounded-md bg-error-bg px-3.5 py-2.5 text-sm text-error-text">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2">
            <Button type="button" variant="secondary" className="w-full" onClick={handleGoogle}>
              <GoogleIcon />
              Continuar con Google
            </Button>
            <p className="text-center text-xs text-text-subtle">
              Solo funciona si tu email de Google ya tiene una cuenta creada en Vibe CRM.
            </p>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-text-subtle">o</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
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
