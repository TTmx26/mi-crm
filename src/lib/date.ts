export function todayISO(): string {
  // Fecha local (no UTC): evita el desfase de hasta 2h entre la hora de Madrid
  // y la de Convex, que movería items entre buckets de fecha.
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

// Debe coincidir siempre con fechaNegocioHoy() en convex/seguimientos.ts —
// mismo cálculo (Europe/Madrid), a propósito distinto de todayISO(). Se usa
// donde el valor tiene que coincidir con lo que el servidor considera "hoy"
// (p.ej. el mínimo/valor inicial de fecha al programar un seguimiento): si
// aquí usáramos la hora local del dispositivo, un usuario en otro huso
// horario podría ver como válida una fecha que el servidor rechaza.
export function hoyNegocioISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
}
