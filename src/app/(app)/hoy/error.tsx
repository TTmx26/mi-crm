"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function HoyError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-text-muted">No se pudo cargar Hoy. Comprueba tu conexión o vuelve a intentarlo.</p>
      <Button onClick={() => unstable_retry()}>Reintentar</Button>
    </div>
  );
}
