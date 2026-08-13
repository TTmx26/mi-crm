import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { createAccount, invalidateSessions } from "@convex-dev/auth/server";
import { requirePropietaria } from "./authz";
import { esEmailValido } from "./validation";

// Login en dos pasos (HOP-14, Decisión 3): tras pedir solo el email, el front
// consulta esto para decidir la rama del paso 2.
//   "password"   → el correo ya tiene contraseña configurada → pedir contraseña.
//   "configurar" → aún no la tiene (invitado pendiente), o el correo no existe,
//                  o está desactivado → mostrar el paso de código (mensaje
//                  neutro; solo se envía código de verdad si la cuenta existe).
//
// Query PÚBLICA (se llama sin sesión). Es la única superficie de enumeración
// del login email-first (patrón estándar Google/Microsoft): revela si un correo
// es un usuario configurado. Aceptable — registro cerrado, userbase pequeña — y
// el estado "pendiente/desconocido/desactivado" se colapsa en "configurar" para
// no filtrar invitaciones ni desactivaciones.
//
// La detección se basa en `authAccounts.secret`: crear la cuenta sin secreto
// (invitación) la deja como "pendiente"; reset-verification fija el secreto y
// pasa a "configurada". Distinto de accesoConfigurado (PR2), que además cuenta
// Google: aquí solo importa la contraseña, porque esta rama decide el login por
// contraseña.
export const estadoAcceso = query({
  args: { email: v.string() },
  handler: async (ctx, { email }): Promise<"password" | "configurar"> => {
    const emailCanonico = email.trim().toLowerCase();

    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", emailCanonico),
      )
      .unique();
    // Sin cuenta password, o con cuenta pero sin contraseña fijada → configurar.
    if (!account || account.secret === undefined) return "configurar";

    // Tiene contraseña; solo es "password" si el usuario está activo. Un
    // desactivado se colapsa a "configurar" (neutro, no revela el estado).
    const user = await ctx.db.get("users", account.userId);
    if (!user || user.desactivadoEn !== undefined) return "configurar";

    return "password";
  },
});

// Panel de gestión de equipo (HOP-14, F18): la lista que ve la Dueña. Gate de
// backend por rol (requirePropietaria) — un comercial que llame por API directa
// recibe error, no basta con ocultar el enlace en el front.
//
// A diferencia de users.listar (selector "Asignado a", que OCULTA desactivados),
// aquí se listan TODOS —activos e inactivos—: este es justo el sitio donde se
// ven y se reactivan. `activo` se deriva de desactivadoEn para que el front no
// tenga que conocer la convención del timestamp.
export const listarEquipo = query({
  args: {},
  handler: async (ctx) => {
    await requirePropietaria(ctx);

    const users = await ctx.db.query("users").collect();
    return users
      .map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        activo: u.desactivadoEn === undefined,
      }))
      // Negocio pequeño: ordenar en memoria es irrelevante. Activos primero,
      // luego por nombre, con desempate estable por _id (orden determinista
      // aunque haya nombres vacíos o repetidos).
      .sort((a, b) => {
        if (a.activo !== b.activo) return Number(b.activo) - Number(a.activo);
        return a.name.localeCompare(b.name) || a._id.localeCompare(b._id);
      });
  },
});

// Verificación previa a crear (HOP-14): autoriza (solo Dueña) y rechaza un email
// ya en uso con un mensaje limpio, antes de tocar createAccount. Es un
// internalQuery para poder invocarlo desde la action con la identidad del
// llamante propagada. El `email` llega ya canónico (trim+lowercase) desde la action.
export const verificarPuedeCrearUsuario = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    await requirePropietaria(ctx);
    const existente = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (existente) {
      throw new ConvexError("Ya existe un usuario con ese email.");
    }
  },
});

// Alta de usuario desde el panel (HOP-14, F18). Mismo camino que
// bootstrap.provisionPasswordAccount (createAccount con shouldLinkViaEmail), pero
// con gate de rol, validación y mensajes visibles. Corre como action porque
// createAccount hashea la contraseña. No crea sesión: la Dueña sigue logueada y
// la persona entra luego con su contraseña temporal.
export const crearUsuario = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("propietaria"), v.literal("comercial")),
  },
  handler: async (ctx, { name, email, password, role }) => {
    // Email como invariante única: se normaliza una sola vez y se usa igual para
    // validar, verificar duplicado y crear la cuenta.
    const emailCanonico = email.trim().toLowerCase();
    const nombre = name.trim();

    if (!nombre) throw new ConvexError("El nombre es obligatorio.");
    if (!esEmailValido(emailCanonico)) throw new ConvexError("El email no es válido.");
    // createAccount NO aplica la política del provider Password (esa solo corre
    // en su propio flujo signUp/reset), así que el mínimo de 8 se exige aquí.
    if (password.length < 8) {
      throw new ConvexError("La contraseña debe tener al menos 8 caracteres.");
    }

    // Autz + duplicado, con la identidad de la Dueña propagada a la query.
    await ctx.runQuery(internal.equipo.verificarPuedeCrearUsuario, { email: emailCanonico });

    // Paridad con bootstrap: no-op en altas nuevas; enlaza bien si existiera una
    // fila ya sembrada con este email.
    await ctx.runMutation(internal.bootstrap.markEmailVerified, { email: emailCanonico });

    try {
      await createAccount(ctx, {
        provider: "password",
        account: { id: emailCanonico, secret: password },
        profile: { email: emailCanonico, name: nombre, role },
        shouldLinkViaEmail: true,
      });
    } catch (err) {
      // Segunda defensa ante duplicado (carrera, o cuenta sin fila en users):
      // solo se traduce "already exists"; cualquier otro fallo se relanza sin
      // enmascarar.
      const mensaje = err instanceof Error ? err.message : String(err);
      if (mensaje.includes("already exists")) {
        throw new ConvexError("Ya existe una cuenta con ese email.");
      }
      throw err;
    }
  },
});

// Editar un usuario del equipo (HOP-14): nombre y rol. El email NO es editable
// (preserva la identidad de login, por eso no está en args). Mutation simple:
// cambiar de rol no requiere tocar sesiones —viewer relee el rol y la UI
// reacciona sola (incluida una Dueña que se auto-degrade y pierda /equipo).
export const editarUsuario = mutation({
  args: {
    id: v.id("users"),
    name: v.string(),
    role: v.union(v.literal("propietaria"), v.literal("comercial")),
  },
  handler: async (ctx, { id, name, role }) => {
    await requirePropietaria(ctx);

    const target = await ctx.db.get("users", id);
    if (!target) throw new ConvexError("Usuario no encontrado.");

    const nombre = name.trim();
    if (!nombre) throw new ConvexError("El nombre es obligatorio.");

    // Guarda "última Dueña activa": degradar a la única propietaria activa
    // dejaría al negocio sin nadie que pueda gestionar el equipo. (Degradar a
    // una propietaria ya desactivada no reduce el conteo activo, así que se
    // permite.)
    if (target.role === "propietaria" && role !== "propietaria" && target.desactivadoEn === undefined) {
      const propietariasActivas = (await ctx.db.query("users").collect()).filter(
        (u) => u.role === "propietaria" && u.desactivadoEn === undefined,
      );
      if (propietariasActivas.length <= 1) {
        throw new ConvexError("Debe quedar al menos una Dueña activa.");
      }
    }

    await ctx.db.patch("users", id, { name: nombre, role });
  },
});

// Marca a un usuario como desactivado (HOP-14, PR4). Hace autz + guardas de forma
// atómica en una mutation; la action que la envuelve invalida las sesiones vivas.
// Idempotente: si ya estaba desactivado no repisa el timestamp (pero la action
// llama a invalidateSessions igual, para no dejar una sesión residual viva).
export const marcarDesactivado = internalMutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const actor = await requirePropietaria(ctx);
    if (id === actor._id) {
      throw new ConvexError("No puedes desactivar tu propia cuenta.");
    }
    const target = await ctx.db.get("users", id);
    if (!target) throw new ConvexError("Usuario no encontrado.");
    if (target.desactivadoEn !== undefined) return; // ya desactivado (idempotente)

    // Misma guarda e idéntico criterio que editarUsuario: no dejar al negocio sin
    // ninguna Dueña activa.
    if (target.role === "propietaria") {
      const propietariasActivas = (await ctx.db.query("users").collect()).filter(
        (u) => u.role === "propietaria" && u.desactivadoEn === undefined,
      );
      if (propietariasActivas.length <= 1) {
        throw new ConvexError("Debe quedar al menos una Dueña activa.");
      }
    }

    await ctx.db.patch("users", id, { desactivadoEn: Date.now() });
  },
});

// Desactiva el acceso de un usuario (HOP-14, PR4). Es una action porque además de
// marcar la fila hay que invalidar las sesiones vivas (invalidateSessions exige
// contexto de action). La barrera primaria es esta + beforeSessionCreation; los
// helpers de authz son la defensa en profundidad por función.
export const desactivarUsuario = action({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    await ctx.runMutation(internal.equipo.marcarDesactivado, { id });
    // Siempre, aunque marcarDesactivado haya sido idempotente: cierra cualquier
    // sesión viva residual del usuario.
    await invalidateSessions(ctx, { userId: id });
  },
});

// Devuelve el acceso a un usuario desactivado (HOP-14, PR4). Mutation simple: NO
// revive sesiones antiguas —solo limpia desactivadoEn— así que la persona vuelve
// a entrar con sus credenciales (estadoAcceso vuelve a "password").
export const reactivarUsuario = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    await requirePropietaria(ctx);
    const target = await ctx.db.get("users", id);
    if (!target) throw new ConvexError("Usuario no encontrado.");
    if (target.desactivadoEn === undefined) return; // ya activo
    await ctx.db.patch("users", id, { desactivadoEn: undefined });
  },
});
