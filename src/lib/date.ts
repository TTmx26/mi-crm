export function todayISO(): string {
  // Fecha local (no UTC): evita el desfase de hasta 2h entre la hora de Madrid
  // y la de Convex, que movería items entre buckets de fecha.
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
