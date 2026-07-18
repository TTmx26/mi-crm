"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ListPlus, MessageSquarePlus, TrendingUp, UserPlus, CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SeguimientoRow, type SeguimientoBucket } from "@/components/ui/seguimiento-row";
import { getCurrentUser } from "@/lib/mock-session";
import { cn } from "@/lib/utils";
import { UndoToast } from "./_components/undo-toast";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { SeguimientoParaHoy } from "../../../../convex/seguimientos";

const quickActions = [
  { label: "Nueva tarea", icon: ListPlus, primary: true },
  { label: "Anotar interacción", icon: MessageSquarePlus },
  { label: "Registrar venta", icon: TrendingUp },
  { label: "Nuevo cliente", icon: UserPlus },
];

type SeccionKey = "atrasados" | "paraHoy" | "proximas";

const SECCIONES: { key: SeccionKey; label: string; emptyText: string }[] = [
  { key: "atrasados", label: "Atrasados", emptyText: "No tienes seguimientos atrasados" },
  { key: "paraHoy", label: "Para hoy", emptyText: "No hay seguimientos para hoy" },
  { key: "proximas", label: "Próximas", emptyText: "No tienes próximos seguimientos programados" },
];

const BUCKET_BY_SECCION: Record<SeccionKey, SeguimientoBucket> = {
  atrasados: "atrasado",
  paraHoy: "hoy",
  proximas: "proxima",
};

interface PendingUndo {
  item: SeguimientoParaHoy;
  seccion: SeccionKey;
}

function todayISO(): string {
  // Fecha local (no UTC): evita el desfase de hasta 2h entre la hora de Madrid
  // y la de Convex, que movería items entre Atrasados/Para hoy/Próximas.
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export default function HoyPage() {
  // Inicializador perezoso de useState: se evalúa una sola vez al montar, la
  // excepción explícita que las reglas de pureza de React permiten para esto
  // (a diferencia de llamarlo directamente en el cuerpo del render).
  const [hoyISO] = useState<string>(() => todayISO());

  const responsableId = getCurrentUser().id as Id<"users">;
  const queryArgs = { responsableId, hoy: hoyISO };

  const data = useQuery(api.seguimientos.paraHoy, queryArgs);

  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(undoTimerRef.current), []);

  const marcarHecho = useMutation(api.seguimientos.marcarHecho).withOptimisticUpdate(
    (store, args) => {
      const current = store.getQuery(api.seguimientos.paraHoy, queryArgs);
      if (!current) return;
      const strip = (items: SeguimientoParaHoy[]) => items.filter((s) => s._id !== args.id);
      store.setQuery(api.seguimientos.paraHoy, queryArgs, {
        atrasados: strip(current.atrasados),
        paraHoy: strip(current.paraHoy),
        proximas: strip(current.proximas),
      });
    },
  );

  // Lee `pendingUndo` (estado, no ref) del cierre de este render: solo se
  // invoca desde handleUndo, que solo existe una vez que el toast (que
  // depende de este mismo estado) ya se ha renderizado con su valor actual.
  const deshacerHecho = useMutation(api.seguimientos.deshacerHecho).withOptimisticUpdate(
    (store, args) => {
      if (!pendingUndo || pendingUndo.item._id !== args.id) return;
      const current = store.getQuery(api.seguimientos.paraHoy, queryArgs);
      if (!current) return;
      const merged = [...current[pendingUndo.seccion], pendingUndo.item].sort((a, b) =>
        a.vence < b.vence ? -1 : 1,
      );
      store.setQuery(api.seguimientos.paraHoy, queryArgs, { ...current, [pendingUndo.seccion]: merged });
    },
  );

  function handleDone(item: SeguimientoParaHoy, seccion: SeccionKey) {
    setPendingUndo({ item, seccion });
    void marcarHecho({ id: item._id, responsableId });

    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setPendingUndo(null), 3800);
  }

  function handleUndo() {
    if (!pendingUndo) return;
    void deshacerHecho({ id: pendingUndo.item._id, responsableId });
    setPendingUndo(null);
    clearTimeout(undoTimerRef.current);
  }

  const pendingCount = data ? data.atrasados.length + data.paraHoy.length : undefined;
  const headerTitle =
    data === undefined
      ? "Cargando seguimientos…"
      : pendingCount === 0
        ? "Todo al día"
        : `${pendingCount} ${pendingCount === 1 ? "seguimiento pendiente" : "seguimientos pendientes"}`;

  return (
    <div>
      <PageHeader eyebrow="Hoy" title={headerTitle} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {quickActions.map(({ label, icon: Icon, primary }) => (
          <button
            key={label}
            type="button"
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 text-center shadow-xs transition-colors duration-[150ms] hover:bg-surface-2"
          >
            <span
              className={
                primary
                  ? "flex size-11 items-center justify-center rounded-full bg-primary text-on-primary"
                  : "flex size-11 items-center justify-center rounded-full bg-primary-subtle text-primary"
              }
            >
              <Icon size={20} strokeWidth={1.5} aria-hidden />
            </span>
            <span className="text-sm font-medium text-text">{label}</span>
          </button>
        ))}
      </div>

      {SECCIONES.map(({ key, label, emptyText }) => {
        const items = data?.[key];
        const atrasados = key === "atrasados";

        return (
          <Card key={key} className={cn("mb-4", atrasados && "border-t-[3px] border-t-error")}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  {atrasados && <span className="size-2 rounded-full bg-error" aria-hidden />}
                  <span className={atrasados ? "text-error-text" : undefined}>
                    {label} ({items ? items.length : "…"})
                  </span>
                </span>
              }
            />
            <CardBody className="p-0">
              {items === undefined ? (
                <div className="flex flex-col gap-3 p-5">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : items.length === 0 ? (
                <EmptyState
                  icon={<CalendarCheck size={24} strokeWidth={1.5} aria-hidden />}
                  title={emptyText}
                  helperText="Cuando programes un seguimiento, aparecerá aquí."
                  action={
                    <Button size="compact" variant="secondary">
                      Nueva tarea
                    </Button>
                  }
                />
              ) : (
                <div>
                  {items.map((item) => (
                    <SeguimientoRow
                      key={item._id}
                      clienteNombre={item.clienteNombre}
                      clienteEstado={item.clienteEstado}
                      accion={item.accion}
                      responsableNombre={item.responsableNombre}
                      vence={item.vence}
                      hoyISO={hoyISO}
                      bucket={BUCKET_BY_SECCION[key]}
                      clienteHref={`/clientes/${item.clienteId}`}
                      onToggleHecho={() => handleDone(item, key)}
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}

      {pendingUndo && <UndoToast message="Seguimiento completado" onUndo={handleUndo} />}
    </div>
  );
}
