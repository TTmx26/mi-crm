import { action, internalQuery, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { modifyAccountCredentials } from "@convex-dev/auth/server";
import { requireActiveUserId } from "./authz";

// Email del llamante (= providerAccountId de su cuenta password). Interno, se
// invoca desde la action con la identidad propagada; requireActiveUserId rechaza
// sesión inválida o cuenta desactivada.
export const emailDelLlamante = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await requireActiveUserId(ctx);
    const user = await ctx.db.get("users", userId);
    if (!user) throw new ConvexError("No autenticado");
    return { email: user.email };
  },
});

// Limpia el flag de cambio forzado una vez fijada la nueva contraseña.
export const limpiarDebeCambiar = internalMutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireActiveUserId(ctx);
    await ctx.db.patch("users", userId, { debeCambiarContrasena: undefined });
  },
});

// Cambio de la propia contraseña (HOP-14 follow-up). Lo usa el interstitial que
// obliga a fijar una contraseña propia tras entrar con la temporal. No pide la
// contraseña actual: la sesión ya prueba identidad y es un cambio forzado. Es
// una action porque modifyAccountCredentials hashea el secreto.
export const cambiarMiContrasena = action({
  args: { newPassword: v.string() },
  handler: async (ctx, { newPassword }) => {
    if (newPassword.length < 8) {
      throw new ConvexError("La contraseña debe tener al menos 8 caracteres.");
    }
    const { email } = await ctx.runQuery(internal.cuenta.emailDelLlamante, {});
    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: email, secret: newPassword },
    });
    await ctx.runMutation(internal.cuenta.limpiarDebeCambiar, {});
  },
});
