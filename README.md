# Vibe CRM

CRM en español para un pequeño negocio de venta digital (PWA, móvil-primero).
Next.js (App Router) + Tailwind CSS v4 + Convex.

## Stack

- **Next.js 16** — App Router, TypeScript, Tailwind CSS v4.
- **Convex** — base de datos y backend en tiempo real.
- **lucide-react** — iconografía.
- Diseño: ver `design/design.md` (design system) y
  `design/design_handoff_crm_pwa/README.md` (pantallas, rutas y modelo de
  datos del MVP).

## Estructura

```
src/
  app/
    (auth)/login/         Pantalla de inicio de sesión (sin shell de navegación)
    (app)/                Rutas con AppShell (tab bar móvil / sidebar escritorio)
      hoy/                 Tareas del día (pantalla inicial)
      clientes/            Lista de clientes
      clientes/[id]/       Ficha de cliente
      ventas/              Ventas y oportunidades
      equipo/               Gestión de usuarios (solo Dueña)
      cuenta/               Perfil / mi cuenta
    manifest.ts            Manifest de la PWA
  components/
    ui/                    Componentes base (Button, Card, Badge, Avatar...)
    layout/                AppShell, Sidebar, TabBar, PageHeader
    providers/              ConvexClientProvider
  lib/
    utils.ts                Helper `cn()` para clases
    mock-session.ts          Sesión de ejemplo (sustituir al conectar auth)
convex/
  schema.ts                 Tablas: users, clientes, seguimientos, interacciones, ventas
```

Cada pantalla de `(app)` está marcada con `TODO(convex)` donde debe conectarse
a una query/mutation real una vez exista el backend.

## Empezar a desarrollar

```bash
npm install
npm run dev
```

Abre http://localhost:3000 (redirige a `/hoy`).

### Conectar Convex

Requiere iniciar sesión de forma interactiva, así que hazlo desde tu propia
terminal (ver también `convex/README.md`):

```bash
npx convex dev
```

Esto crea/enlaza el proyecto de Convex, genera `convex/_generated/` y añade
`NEXT_PUBLIC_CONVEX_URL` a `.env.local`. Déjalo corriendo en paralelo a
`npm run dev` mientras trabajas.

## Desplegar en Railway

1. Sube el repo a GitHub.
2. En Railway: **New Project → Deploy from GitHub repo**. Railway detecta
   Next.js automáticamente (Nixpacks) y ejecuta `npm run build` / `npm run
   start`, respetando el puerto que asigna vía `PORT`.
3. Variables de entorno del servicio: `NEXT_PUBLIC_CONVEX_URL` (el deployment
   de producción de Convex — `npx convex deploy` para crearlo).
