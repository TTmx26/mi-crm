import Link from "next/link";
import { ArrowLeft, Phone, Mail, MessageSquarePlus, CalendarClock, TrendingUp, History } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

// TODO(convex): reemplazar por `useQuery(api.clientes.obtener, { id })` y,
// si no existe, `notFound()`. Por ahora la ficha se renderiza con datos de
// ejemplo para poder construir el layout.
export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div>
      <Link
        href="/clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
        Clientes
      </Link>

      <Card className="mb-4">
        <CardBody>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={`Cliente ${id}`} className="size-14 text-base" />
              <div>
                <p className="text-xl font-semibold text-text">Cliente {id}</p>
                <p className="text-sm text-text-muted">Empresa de ejemplo</p>
              </div>
            </div>
            <Button size="compact" variant="secondary">
              Editar
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="info">Nuevo lead</Badge>
          </div>
          <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4">
            <a href="tel:" className="flex items-center gap-2 py-1.5 text-sm text-text hover:text-primary">
              <Phone size={16} strokeWidth={1.5} aria-hidden />
              Sin teléfono
            </a>
            <a href="mailto:" className="flex items-center gap-2 py-1.5 text-sm text-text hover:text-primary">
              <Mail size={16} strokeWidth={1.5} aria-hidden />
              Sin email
            </a>
          </div>
        </CardBody>
      </Card>

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
    </div>
  );
}
