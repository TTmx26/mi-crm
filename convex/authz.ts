import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// Enforcement de "usuario activo" (HOP-14). La barrera PRIMARIA contra un
// desactivado es a nivel de sesión (beforeSessionCreation en auth.ts +
// invalidateSessions al desactivar): no puede crear sesiones nuevas y las
// vivas se cierran. Estos helpers son la DEFENSA EN PROFUNDIDAD por función:
// cubren la ventana entre marcar desactivado e invalidar sesiones, y cualquier
// sesión que llegara a sobrevivir. Solo usan getAuthUserId + ctx.db.get, así
// que valen igual en query y en mutation.
type Ctx = QueryCtx | MutationCtx;

async function loadActiveUserOrThrow(ctx: Ctx): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("No autenticado");
  const user = await ctx.db.get("users", userId);
  // Falla cerrado también si la fila no existe (no solo si está desactivada).
  if (!user) throw new Error("No autenticado");
  if (user.desactivadoEn !== undefined) throw new Error("Cuenta desactivada");
  return user;
}

// Para handlers que lanzan si no hay sesión válida (el patrón de casi todas las
// queries/mutations de datos): reemplaza a `getAuthUserId` + null-check.
export async function requireActiveUserId(ctx: Ctx): Promise<Id<"users">> {
  return (await loadActiveUserOrThrow(ctx))._id;
}

// Para handlers que hacen no-op silencioso si no hay sesión (marcarHecho,
// deshacerHecho, cambiarEstado): devuelve null en vez de lanzar, tratando a un
// desactivado exactamente igual que a un no autenticado. También lo usa
// `users.viewer` (el front interpreta null como "sin sesión").
export async function getActiveUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  const user = await ctx.db.get("users", userId);
  if (!user || user.desactivadoEn !== undefined) return null;
  return user;
}

// Gate de administración (HOP-14): además de sesión activa, exige rol
// "propietaria". Lo usan las funciones del panel de equipo (listar/crear/
// editar/desactivar) para rechazar en el BACKEND a un comercial que llegue por
// URL o API directa — ocultar el enlace en el front es solo cosmético. Falla
// con el mismo criterio cerrado que el resto (no autenticado / desactivado /
// sin rol). Sirve igual en query y en mutation (solo getAuthUserId + ctx.db.get);
// desde una action se invoca a través de un internalQuery/internalMutation.
export async function requirePropietaria(ctx: Ctx): Promise<Doc<"users">> {
  const user = await loadActiveUserOrThrow(ctx);
  if (user.role !== "propietaria") {
    throw new Error("Solo la propietaria puede gestionar el equipo");
  }
  return user;
}
