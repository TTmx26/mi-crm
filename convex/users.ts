import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get("users", userId);
    if (!user) return null;
    return { _id: user._id, name: user.name, email: user.email, role: user.role };
  },
});

// Para el selector de "Asignado a" al programar un seguimiento — negocio
// pequeño, sin paginar. Solo id+nombre: no hace falta email/role aquí.
export const listar = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("No autenticado");
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({ _id: u._id, name: u.name }));
  },
});
