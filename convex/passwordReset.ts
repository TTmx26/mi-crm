import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";

// Rate-limit de solicitudes de recuperación de contraseña (HOP-12).
//
// Por qué existe una acción propia en vez de throttlear dentro del provider:
// Convex Auth borra/reemplaza el OTP anterior ANTES de llamar a
// `sendVerificationRequest` (ver node_modules/@convex-dev/auth/dist/server/
// implementation/mutations/createVerificationCode.js y .../signIn.js). Si el
// throttle lanzara dentro del envío, el código viejo ya estaría invalidado y
// el nuevo no se enviaría, dejando al usuario sin código válido. Por eso el
// límite se aplica AQUÍ, antes de delegar en el flujo de auth: si se supera,
// se lanza sin que Convex Auth llegue a tocar el OTP.
const MIN_INTERVAL_MS = 60_000; // 60 s entre envíos
const WINDOW_MS = 60 * 60_000; // ventana de 1 hora
const MAX_PER_WINDOW = 5; // máximo de envíos por ventana

// Único endpoint que usa la UI para pedir/reenviar el código de recuperación.
export const requestReset = action({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    // 1) Throttle server-side, antes de tocar nada. Si excede el límite lanza
    //    aquí: no se crea ni se reemplaza ningún OTP, el anterior sigue válido.
    await ctx.runMutation(internal.passwordReset.throttleResetRequest, { email });

    // 2) Delega en el flujo real de auth (crea + envía el OTP). Se traga el
    //    error (cuenta inexistente / fallo de envío) para no revelar si el
    //    email existe — la UI muestra siempre el mismo mensaje neutro.
    try {
      await ctx.runAction(api.auth.signIn, {
        provider: "password",
        params: { email, flow: "reset" },
      });
    } catch {
      // Neutral a propósito: no distinguir cuenta inexistente de envío fallido.
    }
  },
});

// Aplica el límite por email. Lanza si se excede; en los bloqueos NO modifica
// la fila (así una solicitud bloqueada no altera el estado ni, aguas arriba,
// invalida el OTP que el usuario ya tenga).
export const throttleResetRequest = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.toLowerCase().trim();
    const now = Date.now();

    const existing = await ctx.db
      .query("passwordResetThrottle")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .unique();

    if (existing === null) {
      await ctx.db.insert("passwordResetThrottle", {
        email: normalized,
        windowStart: now,
        count: 1,
        lastSentAt: now,
      });
      return;
    }

    // Bloqueo por intervalo mínimo (sin modificar la fila).
    if (now - existing.lastSentAt < MIN_INTERVAL_MS) {
      throw new Error("Espera un momento antes de volver a pedir un código.");
    }

    // Ventana caducada: reinicia el conteo.
    if (now - existing.windowStart >= WINDOW_MS) {
      await ctx.db.patch("passwordResetThrottle", existing._id, {
        windowStart: now,
        count: 1,
        lastSentAt: now,
      });
      return;
    }

    // Dentro de la ventana pero superado el tope (sin modificar la fila).
    if (existing.count >= MAX_PER_WINDOW) {
      throw new Error("Has pedido demasiados códigos. Inténtalo más tarde.");
    }

    await ctx.db.patch("passwordResetThrottle", existing._id, {
      count: existing.count + 1,
      lastSentAt: now,
    });
  },
});
