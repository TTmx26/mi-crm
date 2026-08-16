"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { Plus, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Metric } from "@/components/ui/metric";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ListRow } from "@/components/ui/list-row";
import { Badge } from "@/components/ui/badge";
import { VENTA_ESTADO_LABEL, VENTA_ESTADO_BADGE_VARIANT } from "@/lib/venta-estado";
import { FORMATO_IMPORTE } from "@/lib/moneda";
import { RegistrarVentaSheet } from "@/components/ventas/registrar-venta-sheet";
import { cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";

const FORMATO_FECHA_CORTA = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });

const filters = ["Todas", "En marcha", "Ganadas", "Perdidas"] as const;
type Filtro = (typeof filters)[number];

// Suma en céntimos enteros (Math.round(importe * 100)) para no arrastrar
// imprecisión de coma flotante al sumar muchos importes — se divide por 100
// solo al formatear. No toca el campo `importe` guardado (sigue siendo
// v.number()).
function sumaImportes(ventas: { importe: number }[]) {
  return ventas.reduce((acc, v) => acc + Math.round(v.importe * 100), 0) / 100;
}

export default function VentasPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filtro>("Todas");
  const [registrarOpen, setRegistrarOpen] = useState(false);

  const ventas = useQuery(api.ventas.listar);

  // Derivado en el cliente (no en el servidor): con las ventas ya acotadas
  // por el índice `by_fecha`, calcular aquí los 4 contadores y las 2 sumas
  // evita 4 queries distintas por categoría.
  const abiertas = ventas?.filter((v) => v.estado === "oportunidad_abierta") ?? [];
  const ganadas = ventas?.filter((v) => v.estado === "ganada") ?? [];
  const perdidas = ventas?.filter((v) => v.estado === "perdida") ?? [];

  const porFiltro: Record<Filtro, typeof abiertas> = {
    Todas: ventas ?? [],
    "En marcha": abiertas,
    Ganadas: ganadas,
    Perdidas: perdidas,
  };
  const visibles = porFiltro[filter];

  return (
    <div>
      <PageHeader
        title="Ventas"
        action={
          <Button onClick={() => setRegistrarOpen(true)}>
            <Plus size={18} strokeWidth={1.5} aria-hidden />
            Añadir venta
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        {ventas === undefined ? (
          <>
            <Skeleton className="h-[104px] w-full" />
            <Skeleton className="h-[104px] w-full" />
          </>
        ) : (
          <>
            <Metric
              label="En marcha"
              value={FORMATO_IMPORTE.format(sumaImportes(abiertas))}
              delta={`${abiertas.length} ${abiertas.length === 1 ? "oportunidad" : "oportunidades"}`}
              deltaVariant="success"
            />
            <Metric
              label="Ganado"
              value={FORMATO_IMPORTE.format(sumaImportes(ganadas))}
              delta={`${ganadas.length} ${ganadas.length === 1 ? "venta" : "ventas"}`}
              deltaVariant="success"
            />
          </>
        )}
      </div>

      <div className="mb-4 flex gap-1 rounded-md border border-border bg-surface p-1">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={cn(
              "h-9 flex-1 rounded-sm text-[13px] font-medium transition-colors duration-[150ms]",
              filter === item ? "bg-primary-subtle text-primary" : "text-text-muted hover:bg-surface-2",
            )}
          >
            {item} ({ventas === undefined ? "…" : porFiltro[item].length})
          </button>
        ))}
      </div>

      {ventas === undefined ? (
        <Card className="flex flex-col gap-3 p-5">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </Card>
      ) : visibles.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<TrendingUp size={24} strokeWidth={1.5} aria-hidden />}
            title={ventas.length === 0 ? "Sin operaciones todavía" : "Sin operaciones en este filtro"}
            helperText={
              ventas.length === 0
                ? "Las ventas se registran desde la ficha del cliente, desde este botón, o desde el panel de accesos rápidos de Hoy."
                : "Prueba con otro filtro."
            }
            action={
              ventas.length === 0 ? (
                <Button size="compact" onClick={() => setRegistrarOpen(true)}>
                  Añadir venta
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card className="p-0">
          {visibles.map((v) => (
            <ListRow
              key={v._id}
              name={v.clienteNombre}
              subtitle={`${v.concepto} · ${FORMATO_FECHA_CORTA.format(new Date(`${v.fecha}T00:00:00`))}`}
              amount={FORMATO_IMPORTE.format(v.importe)}
              onClick={() => router.push(`/clientes/${v.clienteId}`)}
              badge={
                <Badge variant={VENTA_ESTADO_BADGE_VARIANT[v.estado]}>{VENTA_ESTADO_LABEL[v.estado]}</Badge>
              }
            />
          ))}
        </Card>
      )}

      <RegistrarVentaSheet open={registrarOpen} onClose={() => setRegistrarOpen(false)} />
    </div>
  );
}
