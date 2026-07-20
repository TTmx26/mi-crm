import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";
import type { Doc } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: ResendOTPPasswordReset,
      // `profile` se llama en TODOS los flows (signUp, signIn, reset,
      // reset-verification), no solo al registrarse — solo se bloquea
      // "signUp" aquí. No hay registro público (HOP-14): las cuentas las
      // aprovisiona un script (ver convex/bootstrap.ts), no un formulario.
      profile(params) {
        if (params.flow === "signUp") {
          throw new Error("Registro público deshabilitado. Solo la propietaria puede crear cuentas.");
        }
        return {
          email: params.email as string,
          name: params.name as string,
          role: params.role as Doc<"users">["role"],
        };
      },
    }),
  ],
});
