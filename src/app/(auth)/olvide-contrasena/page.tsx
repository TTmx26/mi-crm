"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OlvideContrasenaPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [step, setStep] = useState<"pedir" | "verificar">("pedir");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleRequestCode(event: FormEvent) {
    event.preventDefault();
    if (!EMAIL_RE.test(email) || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn("password", { email, flow: "reset" });
    } catch {
      // Se ignora a propósito: no revelar si el email existe o no.
    } finally {
      setSubmitting(false);
      setInfo("Si existe una cuenta con ese email, te hemos enviado un código.");
      setStep("verificar");
    }
  }

  async function handleVerifyAndReset(event: FormEvent) {
    event.preventDefault();
    if (code.length === 0 || newPassword.length < 8 || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn("password", { email, code, newPassword, flow: "reset-verification" });
      router.push("/login");
    } catch {
      setError("Código incorrecto o caducado.");
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
          {step === "pedir" ? (
            <>
              <h1 className="text-xl font-semibold text-text">Recuperar contraseña</h1>
              <p className="mt-1 text-sm text-text-muted">
                Te enviamos un código de un solo uso a tu email.
              </p>
              <form className="mt-5 flex flex-col gap-4" onSubmit={handleRequestCode}>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  autoFocus
                  placeholder="tu@empresa.com"
                />
                <Button type="submit" className="w-full" disabled={!EMAIL_RE.test(email)} loading={submitting}>
                  Enviar código
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-text">Introduce el código</h1>
              {info && <p className="mt-1 text-sm text-text-muted">{info}</p>}
              <form className="mt-5 flex flex-col gap-4" onSubmit={handleVerifyAndReset}>
                {error && (
                  <p role="alert" className="rounded-md bg-error-bg px-3.5 py-2.5 text-sm text-error-text">
                    {error}
                  </p>
                )}
                <Input
                  label="Código"
                  inputMode="numeric"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="12345678"
                />
                <Input
                  label="Contraseña nueva"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  helperText="Mínimo 8 caracteres."
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={code.length === 0 || newPassword.length < 8}
                  loading={submitting}
                >
                  Cambiar contraseña
                </Button>
              </form>
            </>
          )}

          <Link
            href="/login"
            className="mt-4 block text-center text-sm font-medium text-primary hover:text-primary-hover"
          >
            Volver a iniciar sesión
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
