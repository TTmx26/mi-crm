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
