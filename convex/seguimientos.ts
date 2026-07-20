import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";

export interface SeguimientoParaHoy {
  _id: Id<"seguimientos">;
  clienteId: Id<"clientes">;
  clienteNombre: string;
  clienteEstado: Doc<"clientes">["estado"];
  accion: string;
  vence: string;
  responsableNombre: string;
}

export interface ParaHoyResult {
  atrasados: SeguimientoParaHoy[];
  paraHoy: SeguimientoParaHoy[];
  proximas: SeguimientoParaHoy[];
}

// Tope defensivo: sin él, "Próximas" (nada las expulsa hasta que se marcan
// hechas o vencen) podría crecer sin límite en una cuenta longeva. El índice
// ordena por `vence` asc, así que un `take` prioriza siempre lo más atrasado/
// próximo a vencer sobre el resto lejano en el futuro. Esto no protege contra
// más de 200 atrasados+hoy simultáneos (caso extremo no realista para el
// tamaño de negocio de este MVP); para eso haría falta paginar o acotar por
// bucket en vez de por el total, que queda fuera de este alcance.
const MAX_PENDIENTES = 200;

// Fecha de negocio (Europe/Madrid), no UTC: cerca de medianoche,
// `new Date().toISOString()` puede registrar el día equivocado para una
// auditoría en hora local de España. `Intl` resuelve el cambio de horario
// (CET/CEST) sin añadir una dependencia. Deliberadamente distinto del
// `hoyISO` que calcula el cliente en hoy/page.tsx: aquel usa la hora local
// del navegador (correcto para "qué ve el usuario ahora mismo"); este fija
// la zona del negocio para que la fecha de auditoría no dependa de dónde
// esté físicamente el dispositivo que completó la tarea.
function fechaNegocioHoy(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
}

export const paraHoy = query({
  args: {
    hoy: v.string(),
  },
  handler: async (ctx, { hoy }): Promise<ParaHoyResult> => {
    const responsableId = await getAuthUserId(ctx);
    if (responsableId === null) {
      throw new Error("No autenticado");
    }

    const pendientes = await ctx.db
      .query("seguimientos")
      .withIndex("by_responsable_estado_vence", (q) =>
        q.eq("responsableId", responsableId).eq("hecho", false),
      )
      .take(MAX_PENDIENTES);

    const responsable = await ctx.db.get("users", responsableId);
    const responsableNombre = responsable?.name ?? "Sin responsable";

    const clienteIds = [...new Set(pendientes.map((s) => s.clienteId))];
    const clientes = await Promise.all(clienteIds.map((id) => ctx.db.get("clientes", id)));
    const clientesPorId = new Map(clienteIds.map((id, i) => [id, clientes[i]]));

    const decorated: SeguimientoParaHoy[] = pendientes.map((s) => {
      const cliente = clientesPorId.get(s.clienteId);
      return {
        _id: s._id,
        clienteId: s.clienteId,
        clienteNombre: cliente?.nombre ?? "Cliente eliminado",
        clienteEstado: cliente?.estado,
        accion: s.accion,
        vence: s.vence,
        responsableNombre,
      };
    });

    return {
      atrasados: decorated.filter((s) => s.vence < hoy),
      paraHoy: decorated.filter((s) => s.vence === hoy),
      proximas: decorated.filter((s) => s.vence > hoy),
    };
  },
});

// El responsable ya no viene del cliente (a diferencia de antes): se deriva
// de la sesión autenticada server-side. Esto cierra el hallazgo de la
// auditoría — ya no es posible marcar/deshacer seguimientos ajenos
// declarando un responsableId cualquiera, porque ya no se acepta como
// argumento en absoluto.
export const marcarHecho = mutation({
  args: { id: v.id("seguimientos") },
  handler: async (ctx, { id }) => {
    const responsableId = await getAuthUserId(ctx);
    if (responsableId === null) return;
    const seguimiento = await ctx.db.get("seguimientos", id);
    if (!seguimiento || seguimiento.responsableId !== responsableId || seguimiento.hecho) return;
    // Fecha del servidor, no la que mande el cliente: `fechaHecho` es un dato
    // de auditoría y no debe poder falsificarse con una fecha arbitraria.
    await ctx.db.patch("seguimientos", id, { hecho: true, fechaHecho: fechaNegocioHoy() });
  },
});

export const deshacerHecho = mutation({
  args: { id: v.id("seguimientos") },
  handler: async (ctx, { id }) => {
    const responsableId = await getAuthUserId(ctx);
    if (responsableId === null) return;
    const seguimiento = await ctx.db.get("seguimientos", id);
    if (!seguimiento || seguimiento.responsableId !== responsableId || !seguimiento.hecho) return;
    await ctx.db.patch("seguimientos", id, { hecho: false, fechaHecho: undefined });
  },
});
