import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// `clientes` no está scopeada por usuario (todo el equipo ve todos los
// clientes), pero igual se exige sesión — misma defensa en profundidad que
// seguimientos.ts, ya que src/proxy.ts es solo la conveniencia de UX, no la
// barrera real.
export const listar = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("No autenticado");
    return await ctx.db.query("clientes").order("desc").collect();
  },
});

export const crear = mutation({
  args: {
    nombre: v.string(),
    empresa: v.optional(v.string()),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    canalOrigen: v.optional(
      v.union(v.literal("web"), v.literal("redes"), v.literal("email"), v.literal("whatsapp")),
    ),
    prioridad: v.optional(v.union(v.literal("alta"), v.literal("media"), v.literal("baja"))),
    nota: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("No autenticado");

    const nombre = args.nombre.trim();
    if (!nombre) throw new Error("El nombre es obligatorio");
    const telefono = args.telefono?.trim() || undefined;
    const email = args.email?.trim() || undefined;
    if (!telefono && !email) throw new Error("Se requiere teléfono o email");

    return await ctx.db.insert("clientes", {
      nombre,
      empresa: args.empresa?.trim() || undefined,
      telefono,
      email,
      canalOrigen: args.canalOrigen,
      prioridad: args.prioridad,
      nota: args.nota?.trim() || undefined,
      estado: "nuevo_lead",
    });
  },
});
