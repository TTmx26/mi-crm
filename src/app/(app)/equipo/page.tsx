import { ShieldAlert, Plus, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/mock-session";

// TODO(convex): reemplazar por `useQuery(api.usuarios.listar)` y comprobar
// `session.user.role === 'propietaria'` con la sesión real (Convex Auth).
export default function EquipoPage() {
  const user = getCurrentUser();

  if (user.role !== "propietaria") {
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
