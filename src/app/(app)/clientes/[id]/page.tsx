"use client";

import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowLeft, Phone, Mail, MessageSquarePlus, CalendarClock, TrendingUp, History } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CLIENTE_ESTADO_LABEL, CLIENTE_ESTADO_BADGE_VARIANT } from "@/lib/cliente-estado";
import { CLIENTE_PRIORIDAD_LABEL, CLIENTE_PRIORIDAD_BADGE_VARIANT } from "@/lib/cliente-prioridad";
import { CLIENTE_CANAL_LABEL } from "@/lib/cliente-canal";
import { EditarClienteSheet } from "./_components/editar-cliente-sheet";
import { api } from "../../../../../convex/_generated/api";

const FORMATO_FECHA_ALTA = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const cliente = useQuery(api.clientes.obtener, { id });
  const [editOpen, setEditOpen] = useState(false);

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
        <Button variant="secondary" className="justify-start">
          <MessageSquarePlus size={18} strokeWidth={1.5} aria-hidden />
          Anotar interacción
        </Button>
        <Button variant="secondary" className="justify-start">
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
        <CardBody>
          <p className="text-sm text-text-muted">Sin seguimientos pendientes.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Historial" />
        <CardBody>
          <EmptyState
            icon={<History size={24} strokeWidth={1.5} aria-hidden />}
            title="Sin actividad todavía"
            helperText="Las interacciones, ventas y seguimientos completados aparecerán aquí."
          />
        </CardBody>
      </Card>

      {cliente && (
        <EditarClienteSheet open={editOpen} onClose={() => setEditOpen(false)} cliente={cliente} />
      )}
    </div>
  );
}
