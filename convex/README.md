# Convex

`schema.ts` define las tablas de Vibe CRM (`users`, `clientes`, `seguimientos`,
`interacciones`, `ventas`) según el modelo de datos del handoff de diseño
(`design/design_handoff_crm_pwa/README.md`).

Todavía no se ha creado ni enlazado un proyecto de Convex: eso requiere
iniciar sesión de forma interactiva en el navegador, así que hazlo tú:

1. `npx convex dev`
   - Pide iniciar sesión (abre el navegador) y crear/enlazar un proyecto.
   - Genera `convex/_generated/` (cliente y tipos) y escribe
     `NEXT_PUBLIC_CONVEX_URL` en `.env.local`.
   - Déjalo corriendo en una terminal aparte mientras desarrollas: sincroniza
     `schema.ts` y las funciones de `convex/*.ts` en cada guardado.
2. Escribe las primeras funciones (queries/mutations) por entidad, por ejemplo
   `convex/clientes.ts`, `convex/seguimientos.ts`, etc.
3. En las pantallas (`src/app/(app)/...`), sustituye los datos de ejemplo
   marcados con `TODO(convex)` por `useQuery`/`useMutation` de `convex/react`
   usando `api` desde `convex/_generated/api`.
4. Para producción: `npx convex deploy` (o configúralo en el pipeline de
   Railway) y añade `NEXT_PUBLIC_CONVEX_URL` como variable de entorno en
   Railway apuntando al deployment de producción.
