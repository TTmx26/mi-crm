import { Password } from "@convex-dev/auth/providers/Password";
// No existe @convex-dev/auth/providers/Google (a diferencia de Password/
// Email/Phone) — el import correcto de un provider OAuth genérico es desde
// @auth/core directamente (ver node_modules/@auth/core/providers/google.js).
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

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
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    // Se ejecuta en cada sign-in por Google, y en cada createAccount de
    // password (solo bootstrap.ts) — nunca en un signIn("password") normal
    // (ver node_modules/@convex-dev/auth/dist/server/types.d.ts: para
    // providers "credentials" solo se llama desde createAccount; un
    // flow:"signIn" normal pasa por retrieveAccount, que no lo invoca).
    // Sustituye la vinculación automática por defecto, que por sí sola
    // crearía una cuenta nueva para cualquier email de Google (HOP-68 pide
    // justo lo contrario: Google solo enlaza con una cuenta ya existente).
    async createOrUpdateUser(genericCtx, { existingUserId, provider, profile }) {
      if (existingUserId !== null) return existingUserId; // cuenta ya enlazada antes

      const email = typeof profile.email === "string" ? profile.email : null;
      if (!email) throw new Error("El proveedor no devolvió un email");

      // El callback recibe un ctx genérico (GenericMutationCtx<AnyDataModel>,
      // ver node_modules/@convex-dev/auth/dist/server/types.d.ts) sin
      // conocer los índices de nuestro schema — cast a nuestro MutationCtx
      // real para poder usar withIndex("email", ...) en vez de un
      // collect()+filter sin índice.
      const ctx = genericCtx as unknown as MutationCtx;
      const existing = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .unique();

      if (provider.id === "google") {
        // No hay registro público (HOP-14): Google solo enlaza con una
        // cuenta ya aprovisionada por bootstrap.ts, nunca crea una nueva.
        if (existing === null) {
          throw new Error("No existe ninguna cuenta con este email de Google.");
        }
        return existing._id;
      }

      // provider.id === "password": solo alcanzable desde
      // bootstrap.ts:provisionPasswordAccount. Replica el comportamiento por
      // defecto (enlaza si ya existe, crea si no).
      if (existing !== null) return existing._id;
      return await ctx.db.insert("users", {
        email,
        name: profile.name as string,
        role: profile.role as Doc<"users">["role"],
      });
    },
  },
});
