import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";

// createAccount({shouldLinkViaEmail: true}) solo enlaza con un usuario ya
// existente si tiene emailVerificationTime definido (ver
// node_modules/@convex-dev/auth/src/server/implementation/users.ts,
// uniqueUserWithVerifiedEmail). Sin este paso, un usuario ya sembrado por
// seed.ts (sin ese campo) no se encontraría y se crearía una fila nueva con
// un _id distinto, huérfano de los seguimientos que ya apuntan al original.
export const markEmailVerified = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (existing && existing.emailVerificationTime === undefined) {
      await ctx.db.patch("users", existing._id, { emailVerificationTime: Date.now() });
    }
  },
});

// Corrige el email de una cuenta ya aprovisionada (HOP-68: la propietaria
// necesitaba que su cuenta usara el email real de su Google, no el
// original). Deliberadamente no expuesta en la UI (HOP-14: "el email no
// debe ser editable" desde el panel de usuarios) — es una herramienta
// administrativa de un solo uso, mismo criterio que provisionPasswordAccount.
// No toca la credencial de contraseña existente (la fila `authAccounts` del
// provider "password" sigue enlazada por el email original, así que seguir
// entrando con contraseña usando el email antiguo no se rompe) — solo
// actualiza `users.email`, que es el campo que createOrUpdateUser usa para
// enlazar un login de Google nuevo.
// Uso: npx convex run bootstrap:updateUserEmail \
//   '{"oldEmail":"...","newEmail":"..."}' [--prod]
export const updateUserEmail = internalMutation({
  args: { oldEmail: v.string(), newEmail: v.string() },
  handler: async (ctx, { oldEmail, newEmail }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", oldEmail))
      .unique();
    if (!existing) throw new Error(`No existe ningún usuario con email ${oldEmail}`);
    await ctx.db.patch(existing._id, { email: newEmail });
  },
});

// Aprovisiona una credencial de contraseña real. No hay registro público
// (HOP-14): esto sustituye a un formulario de alta hasta que exista un panel
// de administración. Uso (una vez por usuario y por deployment):
//   npx convex run bootstrap:provisionPasswordAccount \
//     '{"email":"...","password":"...","name":"...","role":"propietaria"}'
//   (repetir con --prod para producción)
export const provisionPasswordAccount = internalAction({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.union(v.literal("propietaria"), v.literal("comercial")),
  },
  handler: async (ctx, { email, password, name, role }) => {
    await ctx.runMutation(internal.bootstrap.markEmailVerified, { email });
    const { user } = await createAccount(ctx, {
      provider: "password",
      account: { id: email, secret: password },
      profile: { email, name, role },
      shouldLinkViaEmail: true,
    });
    return user._id;
  },
});
