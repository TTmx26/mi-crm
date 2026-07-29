import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { esFechaValida } from "./validation";

// Tope defensivo, mismo criterio que MAX_INTERACCIONES en interacciones.ts.
const MAX_VENTAS_CLIENTE = 200;

export const porCliente = query({
  args: { clienteId: v.id("clientes") },
  handler: async (ctx, { clienteId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("No autenticado");

    // El índice compuesto ordena por fecha en la propia base de datos, así
    // `take` acota de verdad (no un `.collect()` seguido de sort en memoria).
    const ventas = await ctx.db
      .query("ventas")
      .withIndex("by_cliente_fecha", (q) => q.eq("clienteId", clienteId))
      .order("desc")
      .take(MAX_VENTAS_CLIENTE);

    // Desempate explícito por _creationTime desc dentro del conjunto ya
    // acotado (barato, ≤200 filas) — mismo criterio que interacciones.
    ventas.sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
      return b._creationTime - a._creationTime;
    });

    const autorIds = [...new Set(ventas.map((v) => v.autorId))];
    const autores = await Promise.all(autorIds.map((id) => ctx.db.get("users", id)));
    const nombrePorAutor = new Map(autorIds.map((id, i) => [id, autores[i]?.name ?? "Usuario eliminado"]));

    return ventas.map((v) => ({ ...v, autorNombre: nombrePorAutor.get(v.autorId)! }));
  },
});

// Compartida por crear/editar: mismas reglas en ambas, evita que diverjan.
// Number.isFinite descarta Infinity/NaN, que `importe > 0` por sí solo no
// filtra (Infinity > 0 es true).
function validarCamposVenta(concepto: string, importe: number, fecha: string) {
  const conceptoLimpio = concepto.trim();
  if (!conceptoLimpio) throw new Error("La descripción es obligatoria");
  if (!Number.isFinite(importe) || !(importe > 0)) throw new Error("El importe debe ser mayor que 0");
  if (!esFechaValida(fecha)) throw new Error("La fecha no es válida");
  return conceptoLimpio;
}

export const crear = mutation({
  args: {
    clienteId: v.id("clientes"),
    concepto: v.string(),
    importe: v.number(),
    estado: v.union(v.literal("oportunidad_abierta"), v.literal("ganada"), v.literal("perdida")),
    fecha: v.string(),
  },
  handler: async (ctx, args) => {
    const autorId = await getAuthUserId(ctx);
    if (autorId === null) throw new Error("No autenticado");

    const cliente = await ctx.db.get("clientes", args.clienteId);
    if (!cliente) throw new Error("Cliente no encontrado");

    const concepto = validarCamposVenta(args.concepto, args.importe, args.fecha);

    return await ctx.db.insert("ventas", {
      clienteId: args.clienteId,
      concepto,
      importe: args.importe,
      estado: args.estado,
      fecha: args.fecha,
      autorId,
    });
  },
});

// Corrección manual completa (HOP-26): a diferencia de `cambiarEstado`, aquí
// `estado` se acepta libremente entre los 3 valores — incluye reabrir una
// venta ya cerrada o corregir un estado mal puesto por error. No toca
// `clienteId` ni `autorId` (la venta sigue siendo del mismo cliente y
// conserva quién la registró originalmente).
export const editar = mutation({
  args: {
    id: v.id("ventas"),
    concepto: v.string(),
    importe: v.number(),
    estado: v.union(v.literal("oportunidad_abierta"), v.literal("ganada"), v.literal("perdida")),
    fecha: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("No autenticado");

    const existing = await ctx.db.get("ventas", args.id);
    if (!existing) throw new Error("Venta no encontrada");

    const concepto = validarCamposVenta(args.concepto, args.importe, args.fecha);

    await ctx.db.patch("ventas", args.id, {
      concepto,
      importe: args.importe,
      estado: args.estado,
      fecha: args.fecha,
    });
  },
});

// Atajo guiado de 1 toque para el caso común (HOP-26): solo permite
// oportunidad_abierta -> ganada/perdida, con no-op silencioso si la venta ya
// está cerrada — mismo criterio defensivo que marcarHecho/deshacerHecho en
// seguimientos.ts, para que un doble toque o una UI desincronizada no
// reabra ni reescriba un cierre ya hecho por esta vía. Reabrir o corregir un
// estado ya cerrado es cosa de `editar`, nunca de esta mutation.
export const cambiarEstado = mutation({
  args: {
    id: v.id("ventas"),
    estado: v.union(v.literal("ganada"), v.literal("perdida")),
  },
  handler: async (ctx, { id, estado }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return;
    const venta = await ctx.db.get("ventas", id);
    if (!venta || venta.estado !== "oportunidad_abierta") return;
    await ctx.db.patch("ventas", id, { estado });
  },
});
