import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/mock-session";

// PUNTO DE INTEGRACIÓN: `updateProfile` / `changePassword` / `signOut`
// llegarán con el proveedor de autenticación real.
export default function CuentaPage() {
  const user = getCurrentUser();

  return (
    <div>
      <PageHeader title="Mi cuenta" />

      <Card className="mb-4">
        <CardBody className="flex items-center gap-3">
          <Avatar name={user.name} className="size-14 text-base" />
          <div>
            <p className="text-lg font-semibold text-text">{user.name}</p>
            <Badge variant="primary" className="mt-1">
              {user.role === "propietaria" ? "Dueña" : "Atiende y vende"}
            </Badge>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-4 divide-y divide-border p-0">
        <button type="button" className="w-full px-5 py-4 text-left text-[15px] text-text hover:bg-surface-2">
          Editar mis datos
        </button>
        <button type="button" className="w-full px-5 py-4 text-left text-[15px] text-text hover:bg-surface-2">
          Cambiar contraseña
        </button>
      </Card>

      <Button variant="destructive">Cerrar sesión</Button>
    </div>
  );
}
