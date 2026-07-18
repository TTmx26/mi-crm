/**
 * PUNTO DE INTEGRACIÓN: sustituir por la sesión real una vez conectada
 * la autenticación (Convex Auth u otro proveedor). Mientras tanto, el
 * shell y las pantallas usan este usuario de ejemplo para poder
 * construirse y navegarse.
 *
 * `id` debe ser el `_id` real de un doc en la tabla `users` del deployment
 * de Convex conectado (no un string arbitrario): las queries que filtran
 * por `responsableId: v.id("users")` (p. ej. `seguimientos.paraHoy`)
 * rechazan cualquier valor que no tenga el formato de un Id de Convex. Este
 * valor viene de `npx convex run seed:seedDemo`; si se reinicializan los
 * datos, hay que actualizarlo con el nuevo `martaId`.
 */
export type UserRole = "propietaria" | "comercial";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const mockUser: SessionUser = {
  id: "jh703sxjrwnysd3g9watjx74ws8ashfs",
  name: "Marta García",
  email: "marta@vibecrm.test",
  role: "propietaria",
};

export function getCurrentUser(): SessionUser {
  return mockUser;
}
