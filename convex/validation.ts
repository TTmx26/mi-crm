// El validador de args de Convex ya garantiza el tipo string, pero no que sea
// una fecha real: "2026-99-99" o "2026-02-30" pasarían una comprobación de
// "no vacío". El regex exige el formato exacto YYYY-MM-DD (rechaza años de
// 2 dígitos y meses/días sin cero a la izquierda); el round-trip con `Date`
// atrapa además las fechas de calendario inexistentes (Date normaliza
// "2026-02-30" a "2026-03-02" en vez de fallar, así que comparamos el
// resultado formateado con el original para detectar ese desliz).
export function esFechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const date = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === fecha;
}
