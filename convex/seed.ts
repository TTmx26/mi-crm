import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function upsertUser(
  ctx: MutationCtx,
  user: { name: string; email: string; role: Doc<"users">["role"] },
): Promise<Id<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", user.email))
    .unique();
  return existing?._id ?? (await ctx.db.insert("users", user));
}

async function upsertCliente(
  ctx: MutationCtx,
  cliente: { nombre: string; estado: Doc<"clientes">["estado"]; telefono?: string; email?: string },
): Promise<Id<"clientes">> {
  const existing = await ctx.db
    .query("clientes")
    .withIndex("by_nombre", (q) => q.eq("nombre", cliente.nombre))
    .unique();
  return existing?._id ?? (await ctx.db.insert("clientes", cliente));
}

async function upsertSeguimiento(
  ctx: MutationCtx,
  seguimiento: {
    clienteId: Id<"clientes">;
    accion: string;
    vence: string;
    responsableId: Id<"users">;
  },
): Promise<void> {
  const existing = await ctx.db
    .query("seguimientos")
    .withIndex("by_cliente", (q) => q.eq("clienteId", seguimiento.clienteId))
    .filter((q) => q.eq(q.field("accion"), seguimiento.accion))
    .unique();
  if (existing) return;
  await ctx.db.insert("seguimientos", { ...seguimiento, hecho: false });
}

// Migración de un solo uso: la Marta ya sembrada en dev tiene el email falso
// original. La renombra in situ (mismo _id, no rompe los seguimientos que ya
// apuntan a ella) para que upsertUser la encuentre por el email real a partir
// de ahora. No-op si ya se migró o si no existe (p.ej. en prod, que arranca
// vacío y nunca tuvo el email falso).
export const migrateMartaEmail = internalMutation({
  args: {},
  handler: async (ctx) => {
    const old = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "marta@vibecrm.test"))
      .unique();
    if (old) {
      await ctx.db.patch("users", old._id, { email: "hoplon26@protonmail.com" });
    }
  },
});

// Idempotente: re-ejecutarlo no duplica users/clientes/seguimientos (se
// buscan por email/nombre/accion antes de insertar), así que el _id de Marta
// que usa `mock-session.ts` se mantiene estable entre ejecuciones mientras no
// se borren los datos manualmente.
export const seedDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const martaId = await upsertUser(ctx, {
      name: "Marta García",
      email: "hoplon26@protonmail.com",
      role: "propietaria",
    });
    const carlosId = await upsertUser(ctx, {
      name: "Carlos Ruiz",
      email: "carlos@vibecrm.test",
      role: "comercial",
    });

    const clienteA = await upsertCliente(ctx, {
      nombre: "Panadería El Trigal",
      telefono: "600111222",
      estado: "nuevo_lead",
    });
    const clienteB = await upsertCliente(ctx, {
      nombre: "Ferretería Suárez",
      email: "info@ferreteriasuarez.test",
      estado: "en_negociacion",
    });
    const clienteC = await upsertCliente(ctx, {
      nombre: "Óptica Visión Clara",
      telefono: "600333444",
      estado: "activo",
    });

    await upsertSeguimiento(ctx, {
      clienteId: clienteA,
      accion: "Llamar para cerrar propuesta",
      vence: isoDaysFromNow(-3),
      responsableId: martaId,
    });
    await upsertSeguimiento(ctx, {
      clienteId: clienteB,
      accion: "Enviar catálogo actualizado",
      vence: isoDaysFromNow(0),
      responsableId: martaId,
    });
    await upsertSeguimiento(ctx, {
      clienteId: clienteC,
      accion: "Revisar renovación de contrato",
      vence: isoDaysFromNow(4),
      responsableId: martaId,
    });
    await upsertSeguimiento(ctx, {
      clienteId: clienteC,
      accion: "Seguimiento de Carlos (no debe verlo Marta)",
      vence: isoDaysFromNow(0),
      responsableId: carlosId,
    });

    return { martaId, carlosId, clienteA, clienteB, clienteC };
  },
});
