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

// `id` llega como string crudo de la URL (puede ser basura o el id de otra
// tabla) — `normalizeId` devuelve `null` en vez de lanzar, así que un id
// malformado se trata exactamente igual que "no encontrado" en vez de
// reventar por validación de argumentos antes de entrar al handler.
export const obtener = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("No autenticado");

    const normalizedId = ctx.db.normalizeId("clientes", id);
    if (!normalizedId) return null;
    return await ctx.db.get("clientes", normalizedId);
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

// No toca `estado` ni `prioridad`: HOP-18 solo cubre datos de contacto. Los
// campos aquí siempre llegan de un `_id` ya devuelto por `obtener` (nunca
// tecleado a mano), así que sí se puede exigir `v.id` en vez del `v.string()`
// + `normalizeId` que usa `obtener`.
export const editar = mutation({
  args: {
    id: v.id("clientes"),
    nombre: v.string(),
    empresa: v.optional(v.string()),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    canalOrigen: v.optional(
      v.union(v.literal("web"), v.literal("redes"), v.literal("email"), v.literal("whatsapp")),
    ),
    nota: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("No autenticado");

    const existing = await ctx.db.get("clientes", args.id);
    if (!existing) throw new Error("Cliente no encontrado");

    const nombre = args.nombre.trim();
    if (!nombre) throw new Error("El nombre es obligatorio");
    const telefono = args.telefono?.trim() || undefined;
    const email = args.email?.trim() || undefined;
    if (!telefono && !email) throw new Error("Se requiere teléfono o email");

    await ctx.db.patch("clientes", args.id, {
      nombre,
      empresa: args.empresa?.trim() || undefined,
      telefono,
      email,
      canalOrigen: args.canalOrigen,
      nota: args.nota?.trim() || undefined,
    });
  },
});
