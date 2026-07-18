"use client";

import { useState } from "react";
import { Plus, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Metric } from "@/components/ui/metric";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const filters = ["Todas", "En marcha", "Ganadas", "Perdidas"] as const;

// TODO(convex): reemplazar por `useQuery(api.ventas.listar, { filtro })`.
export default function VentasPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Todas");

  return (
    <div>
      <PageHeader
        title="Ventas"
        action={
          <Button>
            <Plus size={18} strokeWidth={1.5} aria-hidden />
            Añadir venta
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Metric label="En marcha" value="€0" delta="0 oportunidades" deltaVariant="success" />
        <Metric label="Ganado" value="€0" delta="0 ventas" deltaVariant="success" />
      </div>

      <div className="mb-4 flex gap-1 rounded-md border border-border bg-surface p-1">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={cn(
              "h-9 flex-1 rounded-[4px] text-[13px] font-medium transition-colors duration-[150ms]",
              filter === item ? "bg-primary-subtle text-primary" : "text-text-muted hover:bg-surface-2",
            )}
          >
            {item} (0)
          </button>
        ))}
      </div>

      <Card className="p-0">
        <EmptyState
          icon={<TrendingUp size={24} strokeWidth={1.5} aria-hidden />}
          title="Sin operaciones todavía"
          helperText="Registra tu primera venta u oportunidad para verla aquí."
          action={<Button size="compact">Añadir venta</Button>}
        />
      </Card>
    </div>
  );
}
