"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// PUNTO DE INTEGRACIÓN: `signIn` llegará con el proveedor de autenticación
// real (p. ej. Convex Auth). Por ahora el formulario no envía nada.
export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

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

          <form className="mt-5 flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="tu@empresa.com"
            />
            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? "text" : "password"}
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

            <Button type="submit" className="w-full">
              Entrar
            </Button>

            <a href="#" className="text-center text-sm font-medium text-primary hover:text-primary-hover">
              ¿Olvidaste tu contraseña?
            </a>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
