import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CLIENTE_ESTADO_LABEL, CLIENTE_ESTADO_BADGE_VARIANT, type ClienteEstado } from "@/lib/cliente-estado";

export type SeguimientoBucket = "atrasado" | "hoy" | "proxima";

export interface SeguimientoRowProps {
  clienteNombre: string;
  clienteEstado?: ClienteEstado;
  accion: string;
  responsableNombre: string;
  vence: string; // "YYYY-MM-DD"
  hoyISO: string; // "YYYY-MM-DD"
  bucket: SeguimientoBucket;
  clienteHref?: string;
  onToggleHecho: () => void;
  className?: string;
}

const MS_PER_DAY = 86_400_000;
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function diffDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);
}

function formatShortDate(vence: string): string {
  const [, m, d] = vence.split("-");
  return `${parseInt(d, 10)} ${MESES[parseInt(m, 10) - 1]}`;
}

function formatVence(
  vence: string,
  hoyISO: string,
  bucket: SeguimientoBucket,
): { chipLabel: string; chipVariant: BadgeVariant; helperText?: string } {
  if (bucket === "atrasado") {
    const dias = diffDays(vence, hoyISO);
    return {
      chipLabel: "Atrasado",
      chipVariant: "error",
      helperText: dias === 1 ? "Venció ayer" : `Venció hace ${dias} días`,
    };
  }
  if (bucket === "hoy") {
    return { chipLabel: "Hoy", chipVariant: "neutral" };
  }
  const dias = diffDays(hoyISO, vence);
  return {
    chipLabel: "Próximo",
    chipVariant: "neutral",
    helperText: dias === 1 ? "Vence mañana" : `Vence el ${formatShortDate(vence)}`,
  };
}

export function SeguimientoRow({
  clienteNombre,
  clienteEstado,
  accion,
  responsableNombre,
  vence,
  hoyISO,
  bucket,
  clienteHref,
  onToggleHecho,
  className,
}: SeguimientoRowProps) {
  const { chipLabel, chipVariant, helperText } = formatVence(vence, hoyISO, bucket);

  const content = (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="truncate text-[15px] font-medium text-text">{clienteNombre}</p>
        {clienteEstado && (
          <Badge variant={CLIENTE_ESTADO_BADGE_VARIANT[clienteEstado]} className="shrink-0">
            {CLIENTE_ESTADO_LABEL[clienteEstado]}
          </Badge>
        )}
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-text-muted">
        <span className="truncate">{accion}</span>
        <Avatar name={responsableNombre} variant="neutral" className="size-5 shrink-0 text-[10px]" />
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border px-[18px] py-3.5 last:border-b-0",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Marcar como hecho"
        onClick={onToggleHecho}
        className="flex size-11 shrink-0 items-center justify-center"
      >
        <span
          className="size-6 rounded-full border-2 border-border-strong transition-colors duration-[150ms] hover:border-primary"
          aria-hidden
        />
      </button>

      <Avatar name={clienteNombre} className="shrink-0" />

      {clienteHref ? (
        <Link href={clienteHref} className="min-w-0 flex-1">
          {content}
        </Link>
      ) : (
        content
      )}

      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant={chipVariant}>{chipLabel}</Badge>
        {helperText && <span className="text-[12px] text-text-subtle">{helperText}</span>}
      </div>
    </div>
  );
}
