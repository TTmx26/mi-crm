"use client";

import { useState } from "react";
import { Search, X, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

// TODO(convex): reemplazar por `useQuery(api.clientes.buscar, { query })`
// una vez exista el esquema y las funciones de Convex.
const contacts: never[] = [];

export default function ClientesPage() {
  const [query, setQuery] = useState("");

  return (
    <div>
      <PageHeader
        eyebrow={contacts.length === 1 ? "1 CLIENTE" : `${contacts.length} CLIENTES`}
        title="Clientes"
        action={
          <Button className="hidden md:inline-flex">
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

      <Card className="p-0">
        <EmptyState
          icon={<Users size={24} strokeWidth={1.5} aria-hidden />}
          title="Todavía no hay clientes"
          helperText="Añade tu primer cliente para empezar a hacer seguimiento."
          action={<Button size="compact">Añadir cliente</Button>}
        />
      </Card>

      <button
        type="button"
        aria-label="Nuevo cliente"
        className="fixed bottom-20 right-4 z-20 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg hover:bg-primary-hover md:hidden"
      >
        <Plus size={24} strokeWidth={1.5} aria-hidden />
      </button>
    </div>
  );
}
