"use client";

import { ShieldAlert, Plus, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";

// TODO(convex): reemplazar por `useQuery(api.usuarios.listar)` cuando exista
// un panel de administración de usuarios (HOP-14).
export default function EquipoPage() {
  const user = useCurrentUser();

  if (user === undefined) {
    return (
      <div>
        <PageHeader title="Equipo" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (user?.role !== "propietaria") {
    return (
      <Card className="p-0">
        <EmptyState
          icon={<ShieldAlert size={24} strokeWidth={1.5} aria-hidden />}
          title="Acceso restringido"
          helperText="Solo la Dueña puede gestionar el equipo."
        />
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Equipo"
        action={
          <Button>
            <Plus size={18} strokeWidth={1.5} aria-hidden />
            Añadir usuario
          </Button>
        }
      />

      <Card className="p-0">
        <EmptyState
          icon={<UsersRound size={24} strokeWidth={1.5} aria-hidden />}
          title="Solo tú por ahora"
          helperText="Añade a Carlos u otras personas del equipo para que registren ventas e interacciones."
          action={<Button size="compact">Añadir usuario</Button>}
        />
      </Card>
    </div>
  );
}
