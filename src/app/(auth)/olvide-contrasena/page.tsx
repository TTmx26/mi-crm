"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "../../../../convex/_generated/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Igualado al intervalo mínimo del servidor (throttleResetRequest) para que la
// UI no invite a un reenvío que el server rechazaría en silencio. Es solo UX:
// la protección real es la acción requestReset, no este contador.
const RESEND_COOLDOWN_S = 60;

export default function OlvideContrasenaPage() {
  const requestReset = useAction(api.passwordReset.requestReset);
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [step, setStep] = useState<"pedir" | "verificar" | "listo">("pedir");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Cuenta atrás del cooldown de reenvío. El setState va dentro del callback del
  // interval (no en el cuerpo del effect) para no chocar con la regla
  // react-hooks/set-state-in-effect.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Envía (o reenvía) el código. Tratamiento neutro idéntico en ambos casos: no
  // revela si la cuenta existe ni si el envío falló.
  async function enviarCodigo() {
    try {
      await requestReset({ email });
    } catch {
      // Se ignora a propósito (anti-enumeración).
    } finally {
      setInfo("Si existe una cuenta con ese email, te hemos enviado un código.");
      setCooldown(RESEND_COOLDOWN_S);
    }
  }

  async function handleRequestCode(event: FormEvent) {
    event.preventDefault();
    if (!EMAIL_RE.test(email) || submitting) return;
    setError(null);
    setSubmitting(true);
    await enviarCodigo();
    setSubmitting(false);
    setStep("verificar");
  }

  async function handleResend() {
    if (cooldown > 0 || submitting) return;
    setError(null);
    await enviarCodigo();
  }

  async function handleVerifyAndReset(event: FormEvent) {
    event.preventDefault();
    if (code.length === 0 || newPassword.length < 8 || submitting) return;
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn("password", { email, code, newPassword, flow: "reset-verification" });
      // reset-verification deja la sesión iniciada; se muestra un paso de éxito
      // explícito en vez de redirigir en silencio.
      setStep("listo");
    } catch {
      setError("Código incorrecto o caducado.");
      setSubmitting(false);
    }
  }

  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

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
          ) : step === "verificar" ? (
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
                <div className="relative">
                  <Input
                    label="Contraseña nueva"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    helperText="Mínimo 8 caracteres."
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
                <div className="relative">
                  <Input
                    label="Confirmar contraseña nueva"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    error={passwordsMismatch ? "Las contraseñas no coinciden." : undefined}
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={code.length === 0 || newPassword.length < 8 || passwordsMismatch}
                  loading={submitting}
                >
                  Cambiar contraseña
                </Button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || submitting}
                  className="text-center text-sm font-medium text-primary hover:text-primary-hover disabled:text-text-subtle disabled:hover:text-text-subtle"
                >
                  {cooldown > 0 ? `Reenviar código en ${cooldown}s` : "Reenviar código"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-text">Contraseña cambiada</h1>
              <p className="mt-1 text-sm text-text-muted">
                Tu contraseña se actualizó correctamente y ya has iniciado sesión.
              </p>
              <Button className="mt-5 w-full" onClick={() => router.push("/hoy")}>
                Ir a Hoy
              </Button>
            </>
          )}

          {step !== "listo" && (
            <Link
              href="/login"
              className="mt-4 block text-center text-sm font-medium text-primary hover:text-primary-hover"
            >
              Volver a iniciar sesión
            </Link>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
