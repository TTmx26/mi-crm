"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { ShieldAlert, Plus, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/ui/list-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { USER_ROL_LABEL, USER_ROL_BADGE_VARIANT } from "@/lib/user-rol";
import { NuevoUsuarioSheet } from "./_components/nuevo-usuario-sheet";
import { EditarUsuarioSheet, type EquipoMiembro } from "./_components/editar-usuario-sheet";
import { api } from "../../../../convex/_generated/api";

export default function EquipoPage() {
  const user = useCurrentUser();
  const esPropietaria = user?.role === "propietaria";
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editando, setEditando] = useState<EquipoMiembro | null>(null);

  // Solo la Dueña puede leer la lista; para el resto se salta la query (que en
  // el backend lanzaría) y se muestra el aviso de acceso restringido.
  const equipo = useQuery(api.equipo.listarEquipo, esPropietaria ? {} : "skip");

  if (user === undefined) {
    return (
      <div>
        <PageHeader title="Equipo" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!esPropietaria) {
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
        eyebrow={
          equipo === undefined
            ? undefined
            : equipo.length === 1
              ? "1 PERSONA"
              : `${equipo.length} PERSONAS`
        }
        title="Equipo"
        action={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus size={18} strokeWidth={1.5} aria-hidden />
            Añadir usuario
          </Button>
        }
      />

      {equipo === undefined ? (
        <Card className="flex flex-col gap-3 p-5">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </Card>
      ) : equipo.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<UsersRound size={24} strokeWidth={1.5} aria-hidden />}
            title="Solo tú por ahora"
            helperText="Añade a Carlos u otras personas del equipo para que registren ventas e interacciones."
            action={
              <Button size="compact" onClick={() => setSheetOpen(true)}>
                Añadir usuario
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="p-0">
          {equipo.map((u) => (
            <ListRow
              key={u._id}
              name={u.name}
              subtitle={u.email}
              onClick={() => setEditando(u)}
              badge={
                <div className="flex shrink-0 gap-1.5">
                  {!u.activo && <Badge variant="neutral">Inactivo</Badge>}
                  <Badge variant={USER_ROL_BADGE_VARIANT[u.role]}>{USER_ROL_LABEL[u.role]}</Badge>
                </div>
              }
            />
          ))}
        </Card>
      )}

      <NuevoUsuarioSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      <EditarUsuarioSheet
        open={editando !== null}
        onClose={() => setEditando(null)}
        usuario={editando}
      />
    </div>
  );
}
