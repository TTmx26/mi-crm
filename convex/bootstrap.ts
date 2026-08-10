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

// Migra la credencial de un provider de un email a otro (HOP-71). Complementa
// a updateUserEmail: aquel solo cambia `users.email`, pero la credencial de
// contraseña sigue enlazada por `authAccounts.providerAccountId` con el email
// original, así que la recuperación/login por contraseña con el email nuevo no
// encuentran la cuenta. Esto parchea `providerAccountId` conservando el
// `secret` (hash de la contraseña, no se toca). No expuesta en la UI.
// Uso: npx convex run bootstrap:updateAccountEmail \
//   '{"provider":"password","oldEmail":"...","newEmail":"..."}' [--prod]
export const updateAccountEmail = internalMutation({
  args: { provider: v.string(), oldEmail: v.string(), newEmail: v.string() },
  handler: async (ctx, { provider, oldEmail, newEmail }) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", provider).eq("providerAccountId", oldEmail),
      )
      .unique();
    if (!account) {
      throw new Error(`No existe cuenta ${provider} con providerAccountId ${oldEmail}`);
    }
    // El índice providerAndAccountId es único: aborta si ya hay una cuenta con
    // el email nuevo, en vez de crear un duplicado inconsistente.
    const clash = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", provider).eq("providerAccountId", newEmail),
      )
      .unique();
    if (clash) {
      throw new Error(`Ya existe una cuenta ${provider} con providerAccountId ${newEmail}`);
    }
    await ctx.db.patch(account._id, { providerAccountId: newEmail });
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
