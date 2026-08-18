"use client";

import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";

// PUNTO DE INTEGRACIÓN: `updateProfile` / `changePassword` llegarán cuando
// exista un panel de administración (HOP-14). `signOut` ya es real.
export default function CuentaPage() {
  const user = useCurrentUser();
  const { signOut } = useAuthActions();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div>
      <PageHeader title="Mi cuenta" />

      <Card className="mb-4">
        <CardBody className="flex items-center gap-3">
          {user === undefined ? (
            <>
              <Skeleton className="size-14 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
            </>
          ) : (
            user && (
              <>
                <Avatar name={user.name} className="size-14 text-base" />
                <div>
                  <p className="text-lg font-semibold text-text">{user.name}</p>
                  <Badge variant="primary" className="mt-1">
                    {user.role === "propietaria" ? "Dueña" : "Atiende y vende"}
                  </Badge>
                </div>
              </>
            )
          )}
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

      <Button variant="destructive" onClick={() => void handleSignOut()}>
        Cerrar sesión
      </Button>
    </div>
  );
}
