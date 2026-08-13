import { query } from "./_generated/server";
import { getActiveUser, requireActiveUserId } from "./authz";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    // getActiveUser devuelve null si no hay sesión O si la cuenta está
    // desactivada → el front trata ambos casos como "sin sesión".
    const user = await getActiveUser(ctx);
    if (!user) return null;
    return { _id: user._id, name: user.name, email: user.email, role: user.role };
  },
});

// Para el selector de "Asignado a" al programar un seguimiento — negocio
// pequeño, sin paginar. Solo id+nombre: no hace falta email/role aquí.
// Excluye desactivados: no se agenda trabajo nuevo a inactivos (el historial
// ya asignado los sigue resolviendo por id, la fila no se borra).
export const listar = query({
  args: {},
  handler: async (ctx) => {
    await requireActiveUserId(ctx);
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u) => u.desactivadoEn === undefined)
      .map((u) => ({ _id: u._id, name: u.name }));
  },
});
