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

    const concepto = args.concepto.trim();
    if (!concepto) throw new Error("La descripción es obligatoria");
    if (!(args.importe > 0)) throw new Error("El importe debe ser mayor que 0");
    if (!esFechaValida(args.fecha)) throw new Error("La fecha no es válida");

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
