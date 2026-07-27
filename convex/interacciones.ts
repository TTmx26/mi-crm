import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Tope defensivo, mismo criterio que MAX_PENDIENTES en seguimientos.ts.
const MAX_INTERACCIONES = 200;

// El validador de args de Convex ya garantiza el tipo string, pero no que sea
// una fecha real: "2026-99-99" o "2026-02-30" pasarían una comprobación de
// "no vacío". El regex exige el formato exacto YYYY-MM-DD (rechaza años de
// 2 dígitos y meses/días sin cero a la izquierda); el round-trip con `Date`
// atrapa además las fechas de calendario inexistentes (Date normaliza
// "2026-02-30" a "2026-03-02" en vez de fallar, así que comparamos el
// resultado formateado con el original para detectar ese desliz).
function esFechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const date = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === fecha;
}

export const listarPorCliente = query({
  args: { clienteId: v.id("clientes") },
  handler: async (ctx, { clienteId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("No autenticado");

    // El índice compuesto ordena por fecha en la propia base de datos, así
    // `take` acota de verdad (no un `.collect()` seguido de sort en memoria).
    const interacciones = await ctx.db
      .query("interacciones")
      .withIndex("by_cliente_fecha", (q) => q.eq("clienteId", clienteId))
      .order("desc")
      .take(MAX_INTERACCIONES);

    // Desempate explícito por _creationTime desc dentro del conjunto ya
    // acotado (barato, ≤200 filas) — no depende de asumir cómo desempata
    // el índice por sí solo.
    interacciones.sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
      return b._creationTime - a._creationTime;
    });

    const autorIds = [...new Set(interacciones.map((i) => i.autorId))];
    const autores = await Promise.all(autorIds.map((id) => ctx.db.get("users", id)));
    const nombrePorAutor = new Map(autorIds.map((id, i) => [id, autores[i]?.name ?? "Usuario eliminado"]));

    return interacciones.map((i) => ({ ...i, autorNombre: nombrePorAutor.get(i.autorId)! }));
  },
});

export const crear = mutation({
  args: {
    clienteId: v.id("clientes"),
    tipo: v.union(
      v.literal("llamada"),
      v.literal("email"),
      v.literal("whatsapp"),
      v.literal("en_persona"),
    ),
    texto: v.string(),
    fecha: v.string(),
  },
  handler: async (ctx, args) => {
    const autorId = await getAuthUserId(ctx);
    if (autorId === null) throw new Error("No autenticado");

    const cliente = await ctx.db.get("clientes", args.clienteId);
    if (!cliente) throw new Error("Cliente no encontrado");

    const texto = args.texto.trim();
    if (!texto) throw new Error("El texto es obligatorio");
    if (!esFechaValida(args.fecha)) throw new Error("La fecha no es válida");

    const id = await ctx.db.insert("interacciones", {
      clienteId: args.clienteId,
      tipo: args.tipo,
      texto,
      fecha: args.fecha,
      autorId,
    });

    if (!cliente.ultimoContactoEn || args.fecha > cliente.ultimoContactoEn) {
      await ctx.db.patch("clientes", args.clienteId, { ultimoContactoEn: args.fecha });
    }

    return id;
  },
});
