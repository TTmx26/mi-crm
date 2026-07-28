"use client";

import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquarePlus,
  CalendarClock,
  TrendingUp,
  History,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CLIENTE_ESTADO_LABEL, CLIENTE_ESTADO_BADGE_VARIANT } from "@/lib/cliente-estado";
import { CLIENTE_PRIORIDAD_LABEL, CLIENTE_PRIORIDAD_BADGE_VARIANT } from "@/lib/cliente-prioridad";
import { CLIENTE_CANAL_LABEL } from "@/lib/cliente-canal";
import { INTERACCION_TIPO_LABEL, INTERACCION_TIPO_ICON } from "@/lib/interaccion-tipo";
import { useCurrentUser } from "@/hooks/use-current-user";
import { EditarClienteSheet } from "./_components/editar-cliente-sheet";
import { AnotarInteraccionSheet } from "@/components/interacciones/anotar-interaccion-sheet";
import { ProgramarSeguimientoSheet } from "@/components/seguimientos/programar-seguimiento-sheet";
import { api } from "../../../../../convex/_generated/api";

const FORMATO_FECHA_ALTA = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });
const FORMATO_FECHA_CORTA = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const cliente = useQuery(api.clientes.obtener, { id });
  const [editOpen, setEditOpen] = useState(false);
  const [interaccionOpen, setInteraccionOpen] = useState(false);
  const [seguimientoOpen, setSeguimientoOpen] = useState(false);
  const interacciones = useQuery(
    api.interacciones.listarPorCliente,
    cliente ? { clienteId: cliente._id } : "skip",
  );
  const seguimientosPendientes = useQuery(
    api.seguimientos.porCliente,
    cliente ? { clienteId: cliente._id } : "skip",
  );
  const seguimientosCompletados = useQuery(
    api.seguimientos.completadosPorCliente,
    cliente ? { clienteId: cliente._id } : "skip",
  );

  // El Historial combina dos dominios (interacciones + seguimientos
  // completados) en una sola línea de tiempo, ordenada por la fecha real del
  // evento (fecha de la interacción o fechaHecho del seguimiento) — no por
  // "todas las interacciones y luego todos los seguimientos". Cada dominio
  // mantiene su propia query (igual que "Seguimientos pendientes" arriba);
  // la combinación es solo de presentación, aquí en la página.
  const historial =
    interacciones === undefined || seguimientosCompletados === undefined
      ? undefined
      : [
          ...interacciones.map((i) => ({ tipo: "interaccion" as const, item: i, fechaOrden: i.fecha })),
          ...seguimientosCompletados.map((s) => ({
            tipo: "seguimiento" as const,
            item: s,
            fechaOrden: s.fechaHecho!,
          })),
        ].sort((a, b) => {
          if (a.fechaOrden !== b.fechaOrden) return a.fechaOrden < b.fechaOrden ? 1 : -1;
          return b.item._creationTime - a.item._creationTime;
        });
  const currentUser = useCurrentUser();
  const marcarHecho = useMutation(api.seguimientos.marcarHecho);

  if (cliente === null) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
        Clientes
      </Link>

      {cliente === undefined ? (
        <Card className="mb-4 p-5">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      ) : (
        <Card className="mb-4">
          <CardBody>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={cliente.nombre} className="size-14 text-base" />
                <div>
                  <p className="text-xl font-semibold text-text">{cliente.nombre}</p>
                  {cliente.empresa && <p className="text-sm text-text-muted">{cliente.empresa}</p>}
                </div>
              </div>
              <Button size="compact" variant="secondary" onClick={() => setEditOpen(true)}>
                Editar
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {cliente.prioridad && (
                <Badge variant={CLIENTE_PRIORIDAD_BADGE_VARIANT[cliente.prioridad]}>
                  {CLIENTE_PRIORIDAD_LABEL[cliente.prioridad]}
                </Badge>
              )}
              {cliente.estado && (
                <Badge variant={CLIENTE_ESTADO_BADGE_VARIANT[cliente.estado]}>
                  {CLIENTE_ESTADO_LABEL[cliente.estado]}
                </Badge>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4">
              {cliente.telefono ? (
                <a
                  href={`tel:${cliente.telefono}`}
                  className="flex items-center gap-2 py-1.5 text-sm text-text hover:text-primary"
                >
                  <Phone size={16} strokeWidth={1.5} aria-hidden />
                  {cliente.telefono}
                </a>
              ) : (
                <p className="flex items-center gap-2 py-1.5 text-sm text-text-muted">
                  <Phone size={16} strokeWidth={1.5} aria-hidden />
                  Sin teléfono
                </p>
              )}
              {cliente.email ? (
                <a
                  href={`mailto:${cliente.email}`}
                  className="flex items-center gap-2 py-1.5 text-sm text-text hover:text-primary"
                >
                  <Mail size={16} strokeWidth={1.5} aria-hidden />
                  {cliente.email}
                </a>
              ) : (
                <p className="flex items-center gap-2 py-1.5 text-sm text-text-muted">
                  <Mail size={16} strokeWidth={1.5} aria-hidden />
                  Sin email
                </p>
              )}
              {cliente.canalOrigen && (
                <p className="py-1.5 text-sm text-text-muted">
                  Canal de origen: {CLIENTE_CANAL_LABEL[cliente.canalOrigen]}
                </p>
              )}
              {cliente.nota && <p className="py-1.5 text-sm text-text-muted">{cliente.nota}</p>}
              <p className="py-1.5 text-[13px] text-text-subtle">
                Alta: {FORMATO_FECHA_ALTA.format(new Date(cliente._creationTime))}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Button
          variant="secondary"
          className="justify-start"
          onClick={() => setInteraccionOpen(true)}
        >
          <MessageSquarePlus size={18} strokeWidth={1.5} aria-hidden />
          Anotar interacción
        </Button>
        <Button
          variant="secondary"
          className="justify-start"
          onClick={() => setSeguimientoOpen(true)}
        >
          <CalendarClock size={18} strokeWidth={1.5} aria-hidden />
          Programar seguimiento
        </Button>
        <Button variant="secondary" className="justify-start">
          <TrendingUp size={18} strokeWidth={1.5} aria-hidden />
          Registrar venta
        </Button>
      </div>

      <Card className="mb-4">
        <CardHeader title="Seguimientos pendientes" />
        <CardBody className={seguimientosPendientes && seguimientosPendientes.length > 0 ? "p-0" : undefined}>
          {seguimientosPendientes === undefined ? (
            <div className="flex flex-col gap-3 p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : seguimientosPendientes.length === 0 ? (
            <p className="p-5 text-sm text-text-muted">Sin seguimientos pendientes.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {seguimientosPendientes.map((s) => {
                const esMio = s.responsableId === currentUser?._id;
                return (
                  <div key={s._id} className="flex items-center gap-3 p-4">
                    {esMio ? (
                      <button
                        type="button"
                        aria-label="Marcar como hecho"
                        onClick={() => void marcarHecho({ id: s._id })}
                        className="flex size-11 shrink-0 items-center justify-center"
                      >
                        <span
                          className="size-6 rounded-full border-2 border-border-strong transition-colors duration-[150ms] hover:border-primary"
                          aria-hidden
                        />
                      </button>
                    ) : (
                      <span className="flex size-11 shrink-0 items-center justify-center">
                        <span className="size-6 rounded-full border-2 border-border" aria-hidden />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text">{s.accion}</p>
                      <p className="text-[13px] text-text-subtle">
                        {FORMATO_FECHA_CORTA.format(new Date(`${s.vence}T00:00:00`))}
                        {!esMio && ` · Asignado a ${s.responsableNombre}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Historial" />
        <CardBody className={historial && historial.length > 0 ? "p-0" : undefined}>
          {historial === undefined ? (
            <div className="flex flex-col gap-3 p-5">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : historial.length === 0 ? (
            <EmptyState
              icon={<History size={24} strokeWidth={1.5} aria-hidden />}
              title="Sin actividad todavía"
              helperText="Las interacciones, ventas y seguimientos completados aparecerán aquí."
            />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {historial.map((entry) => {
                if (entry.tipo === "interaccion") {
                  const i = entry.item;
                  const Icon = INTERACCION_TIPO_ICON[i.tipo];
                  return (
                    <div key={i._id} className="flex gap-3 p-4">
                      <Icon
                        size={18}
                        strokeWidth={1.5}
                        className="mt-0.5 shrink-0 text-text-subtle"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-text">
                            {INTERACCION_TIPO_LABEL[i.tipo]}
                          </span>
                          <span className="shrink-0 text-[13px] text-text-subtle">
                            {FORMATO_FECHA_CORTA.format(new Date(`${i.fecha}T00:00:00`))}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-text-muted">{i.texto}</p>
                        <p className="mt-1 text-[13px] text-text-subtle">Por {i.autorNombre}</p>
                      </div>
                    </div>
                  );
                }
                const s = entry.item;
                return (
                  <div key={s._id} className="flex gap-3 p-4">
                    <CheckCircle2
                      size={18}
                      strokeWidth={1.5}
                      className="mt-0.5 shrink-0 text-success-text"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-text">Seguimiento completado</span>
                        <span className="shrink-0 text-[13px] text-text-subtle">
                          {FORMATO_FECHA_CORTA.format(new Date(`${s.fechaHecho}T00:00:00`))}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-text-muted">{s.accion}</p>
                      <p className="mt-1 text-[13px] text-text-subtle">Por {s.responsableNombre}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {cliente && (
        <>
          <EditarClienteSheet open={editOpen} onClose={() => setEditOpen(false)} cliente={cliente} />
          <AnotarInteraccionSheet
            open={interaccionOpen}
            onClose={() => setInteraccionOpen(false)}
            clienteId={cliente._id}
          />
          <ProgramarSeguimientoSheet
            open={seguimientoOpen}
            onClose={() => setSeguimientoOpen(false)}
            clienteId={cliente._id}
          />
        </>
      )}
    </div>
  );
}
