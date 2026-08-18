// Pesos mexicanos (MXN). Con la configuración es-MX el símbolo es "$" y usa
// coma para miles y punto para decimales (p. ej. "$1,234.56"). Solo afecta a la
// presentación: el importe se guarda como número, sin moneda.
export const FORMATO_IMPORTE = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
