import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { esFechaValida } from "./validation";
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
// `todayISO` que calcula el cliente en hoy/page.tsx: aquel usa la hora local
// del navegador (correcto para "qué ve el usuario ahora mismo"); este fija
// la zona del negocio para que la fecha de auditoría no dependa de dónde
// esté físicamente el dispositivo que completó la tarea.
//
// Debe coincidir siempre con hoyNegocioISO() en src/lib/date.ts (mismo
// cálculo) — el formulario de "Programar seguimiento" usa esa versión para
// que el mínimo/valor inicial de fecha coincida con lo que valida `crear`.
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

// Sirve tanto a "Programar seguimiento" (desde la ficha, con responsableId
// elegido explícitamente) como a "Nueva tarea" (desde Hoy, sin responsableId
// -> el creador). Asignar el seguimiento a otro compañero es un uso legítimo
// aquí (a diferencia de marcarHecho/deshacerHecho, donde suplantar a otro
// usuario sí era el problema): quien programa puede repartir trabajo.
export const crear = mutation({
  args: {
    clienteId: v.id("clientes"),
    accion: v.string(),
    vence: v.string(),
    responsableId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const sessionUserId = await getAuthUserId(ctx);
    if (sessionUserId === null) throw new Error("No autenticado");

    const cliente = await ctx.db.get("clientes", args.clienteId);
    if (!cliente) throw new Error("Cliente no encontrado");

    const accion = args.accion.trim();
    if (!accion) throw new Error("Describe qué hay que hacer");

    if (!esFechaValida(args.vence)) throw new Error("La fecha no es válida");
    if (args.vence < fechaNegocioHoy()) throw new Error("La fecha no puede ser anterior a hoy");

    const responsableId = args.responsableId ?? sessionUserId;
    const responsable = await ctx.db.get("users", responsableId);
    if (!responsable) throw new Error("Usuario asignado no encontrado");

    return await ctx.db.insert("seguimientos", {
      clienteId: args.clienteId,
      accion,
      vence: args.vence,
      hecho: false,
      responsableId,
    });
  },
});

// Tope defensivo (mismo criterio que MAX_PENDIENTES): los pendientes de un
// cliente no crecen sin límite por sí solos (se completan y salen del
// filtro), pero el tope es una red de seguridad barata igualmente.
const MAX_PENDIENTES_CLIENTE = 100;

export const porCliente = query({
  args: { clienteId: v.id("clientes") },
  handler: async (ctx, { clienteId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("No autenticado");

    // El índice compuesto acota el escaneo a los pendientes de este cliente
    // sin tocar sus seguimientos ya completados (que sí se acumulan sin
    // límite con el tiempo) — a diferencia de `by_cliente` a secas.
    const pendientes = await ctx.db
      .query("seguimientos")
      .withIndex("by_cliente_estado_vence", (q) => q.eq("clienteId", clienteId).eq("hecho", false))
      .order("asc")
      .take(MAX_PENDIENTES_CLIENTE);

    const responsableIds = [...new Set(pendientes.map((s) => s.responsableId))];
    const responsables = await Promise.all(responsableIds.map((id) => ctx.db.get("users", id)));
    const nombrePorResponsable = new Map(
      responsableIds.map((id, i) => [id, responsables[i]?.name ?? "Usuario eliminado"]),
    );

    // `responsableNombre` (y `responsableId`, ya incluido en `s`) le permite
    // a la ficha distinguir "mío" (checkbox activo) de "de un compañero"
    // (solo indicador, sin acción) sin ampliar la regla de `marcarHecho`.
    return pendientes.map((s) => ({
      ...s,
      responsableNombre: nombrePorResponsable.get(s.responsableId)!,
    }));
  },
});

// Mismo tope defensivo que MAX_PENDIENTES_CLIENTE: aquí sí hace falta de
// verdad, a diferencia de los pendientes, porque los completados de un
// cliente se acumulan sin límite con el tiempo (nunca "salen" de este
// filtro).
const MAX_COMPLETADOS_CLIENTE = 100;

// Para el Historial de la ficha (se combina en el cliente con las
// interacciones — cada dominio mantiene su propia query, la página compone).
export const completadosPorCliente = query({
  args: { clienteId: v.id("clientes") },
  handler: async (ctx, { clienteId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("No autenticado");

    const completados = await ctx.db
      .query("seguimientos")
      .withIndex("by_cliente_estado_fechaHecho", (q) => q.eq("clienteId", clienteId).eq("hecho", true))
      .order("desc")
      .take(MAX_COMPLETADOS_CLIENTE);

    const responsableIds = [...new Set(completados.map((s) => s.responsableId))];
    const responsables = await Promise.all(responsableIds.map((id) => ctx.db.get("users", id)));
    const nombrePorResponsable = new Map(
      responsableIds.map((id, i) => [id, responsables[i]?.name ?? "Usuario eliminado"]),
    );

    return completados.map((s) => ({
      ...s,
      responsableNombre: nombrePorResponsable.get(s.responsableId)!,
    }));
  },
});
