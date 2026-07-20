"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { type ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error(
    "Convex no está configurado: falta NEXT_PUBLIC_CONVEX_URL. Las pantallas que usan useQuery/useMutation fallarán en runtime.",
  );
}

const client = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!client) {
    return children;
  }

  return <ConvexAuthNextjsProvider client={client}>{children}</ConvexAuthNextjsProvider>;
}
