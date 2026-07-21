import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables, // authSessions, authAccounts, authRefreshTokens, etc. — no tocar

  // `name`/`email`/`role` se quedan obligatorios (a diferencia de la receta
  // genérica de authTables): no hay OAuth ni cuentas anónimas, así que exigir
  // `role` es una segunda barrera gratuita contra cualquier alta que no pase
  // por nuestro flujo (ver el guard en convex/auth.ts).
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("propietaria"), v.literal("comercial")),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  }).index("email", ["email"]), // nombre exigido por createAccount({shouldLinkViaEmail: true})

  clientes: defineTable({
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
    nota: v.optional(v.string()),
    // Denormalizado para ordenar/leer rápido la lista sin agregar interacciones.
    ultimoContactoEn: v.optional(v.string()),
    prioridad: v.optional(v.union(v.literal("alta"), v.literal("media"), v.literal("baja"))),
  }).index("by_nombre", ["nombre"]),

  seguimientos: defineTable({
    clienteId: v.id("clientes"),
    accion: v.string(),
    vence: v.string(), // "YYYY-MM-DD"
    hecho: v.boolean(),
    fechaHecho: v.optional(v.string()),
    responsableId: v.id("users"),
  })
    .index("by_cliente", ["clienteId"])
    .index("by_vence", ["vence"])
    .index("by_responsable_estado_vence", ["responsableId", "hecho", "vence"]),

  interacciones: defineTable({
    clienteId: v.id("clientes"),
    tipo: v.union(v.literal("llamada"), v.literal("email"), v.literal("whatsapp"), v.literal("en_persona")),
    texto: v.string(),
    fecha: v.string(), // "YYYY-MM-DD"
    autorId: v.id("users"),
  }).index("by_cliente", ["clienteId"]),

  ventas: defineTable({
    clienteId: v.id("clientes"),
    concepto: v.string(),
    importe: v.number(),
    estado: v.union(v.literal("oportunidad_abierta"), v.literal("ganada"), v.literal("perdida")),
    fecha: v.string(), // "YYYY-MM-DD"
    autorId: v.id("users"),
  })
    .index("by_cliente", ["clienteId"])
    .index("by_estado", ["estado"]),
});
