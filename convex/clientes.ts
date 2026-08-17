import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireActiveUserId } from "./authz";

// `clientes` no está scopeada por usuario (todo el equipo ve todos los
// clientes), pero igual se exige sesión — misma defensa en profundidad que
// seguimientos.ts, ya que src/proxy.ts es solo la conveniencia de UX, no la
// barrera real.
// Tope defensivo: los clientes se acumulan sin límite con el tiempo (a
// diferencia de otras listas, nunca "salen" de este filtro). Mismo criterio que
// MAX_VENTAS_GLOBAL/MAX_INTERACCIONES. Holgado para el tamaño de negocio del MVP;
// si hiciera falta más, tocaría paginar (fuera de alcance).
const MAX_CLIENTES = 1000;

export const listar = query({
  args: {},
  handler: async (ctx) => {
    await requireActiveUserId(ctx);
    return await ctx.db.query("clientes").order("desc").take(MAX_CLIENTES);
  },
});

// `id` llega como string crudo de la URL (puede ser basura o el id de otra
// tabla) — `normalizeId` devuelve `null` en vez de lanzar, así que un id
// malformado se trata exactamente igual que "no encontrado" en vez de
// reventar por validación de argumentos antes de entrar al handler.
export const obtener = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireActiveUserId(ctx);

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
    await requireActiveUserId(ctx);

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

// Además de los datos de contacto, permite mover el cliente por el embudo
// (`estado`) y cambiar su `prioridad` — antes ninguno de los dos se podía editar
// tras el alta. Los campos aquí siempre llegan de un `_id` ya devuelto por
// `obtener` (nunca tecleado a mano), así que sí se puede exigir `v.id` en vez del
// `v.string()` + `normalizeId` que usa `obtener`.
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
    estado: v.optional(
      v.union(
        v.literal("nuevo_lead"),
        v.literal("en_negociacion"),
        v.literal("activo"),
        v.literal("inactivo"),
      ),
    ),
    prioridad: v.optional(v.union(v.literal("alta"), v.literal("media"), v.literal("baja"))),
    nota: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireActiveUserId(ctx);

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
      estado: args.estado,
      prioridad: args.prioridad,
      nota: args.nota?.trim() || undefined,
    });
  },
});
