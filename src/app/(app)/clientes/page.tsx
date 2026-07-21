"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { Search, X, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ListRow } from "@/components/ui/list-row";
import { Badge } from "@/components/ui/badge";
import { CLIENTE_ESTADO_LABEL, CLIENTE_ESTADO_BADGE_VARIANT } from "@/lib/cliente-estado";
import { CLIENTE_PRIORIDAD_LABEL, CLIENTE_PRIORIDAD_BADGE_VARIANT } from "@/lib/cliente-prioridad";
import { NuevoClienteSheet } from "./_components/nuevo-cliente-sheet";
import { api } from "../../../../convex/_generated/api";

export default function ClientesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const clientes = useQuery(api.clientes.listar);
  const filtrados = clientes?.filter((c) =>
    c.nombre.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        eyebrow={
          clientes === undefined
            ? undefined
            : clientes.length === 1
              ? "1 CLIENTE"
              : `${clientes.length} CLIENTES`
        }
        title="Clientes"
        action={
          <Button className="hidden md:inline-flex" onClick={() => setSheetOpen(true)}>
            <Plus size={18} strokeWidth={1.5} aria-hidden />
            Nuevo cliente
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search
          size={18}
          strokeWidth={1.5}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, email o teléfono"
          className="h-12 w-full rounded-md border border-border-strong bg-surface pl-10 pr-10 text-[15px] text-text placeholder:text-text-subtle focus-visible:border-primary"
        />
        {query && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-text-subtle hover:bg-surface-2"
          >
            <X size={16} strokeWidth={1.5} aria-hidden />
          </button>
        )}
      </div>

      {clientes === undefined ? (
        <Card className="flex flex-col gap-3 p-5">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </Card>
      ) : filtrados!.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<Users size={24} strokeWidth={1.5} aria-hidden />}
            title={clientes.length === 0 ? "Todavía no hay clientes" : "Sin resultados"}
            helperText={
              clientes.length === 0
                ? "Añade tu primer cliente para empezar a hacer seguimiento."
                : "Prueba con otro nombre."
            }
            action={
              clientes.length === 0 ? (
                <Button size="compact" onClick={() => setSheetOpen(true)}>
                  Añadir cliente
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card className="p-0">
          {filtrados!.map((c) => (
            <ListRow
              key={c._id}
              name={c.nombre}
              subtitle={c.telefono ?? c.email}
              onClick={() => router.push(`/clientes/${c._id}`)}
              badge={
                <div className="flex shrink-0 gap-1.5">
                  {c.prioridad && (
                    <Badge variant={CLIENTE_PRIORIDAD_BADGE_VARIANT[c.prioridad]}>
                      {CLIENTE_PRIORIDAD_LABEL[c.prioridad]}
                    </Badge>
                  )}
                  {c.estado && (
                    <Badge variant={CLIENTE_ESTADO_BADGE_VARIANT[c.estado]}>
                      {CLIENTE_ESTADO_LABEL[c.estado]}
                    </Badge>
                  )}
                </div>
              }
            />
          ))}
        </Card>
      )}

      <button
        type="button"
        aria-label="Nuevo cliente"
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-20 right-4 z-20 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg hover:bg-primary-hover md:hidden"
      >
        <Plus size={24} strokeWidth={1.5} aria-hidden />
      </button>

      <NuevoClienteSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
