# Mejoras sobre el PRD

Registro de mejoras entregadas **más allá del PRD original** del MVP. El PRD y las
funciones base (F1–F18) se documentan en `design/` y en Linear (proyecto crm-mvp);
aquí se apuntan los añadidos y ajustes posteriores, con su origen y una descripción
breve orientada a producto.

## Selector de tema — Claro / Oscuro / Sistema

- **Qué es:** un icono de **luna** en la esquina superior derecha, presente en todas
  las pantallas de la app. Al pulsarlo despliega un menú con tres modos:
  - **Claro** — tema claro fijo.
  - **Oscuro** — tema oscuro fijo.
  - **Sistema** — sigue la preferencia del dispositivo (claro/oscuro del sistema
    operativo) y cambia en vivo si el usuario la cambia.
- **Dónde:** franja superior del `AppShell`, por encima del contenido de cada
  pantalla, para no solaparse con el botón de acción de cada página ni con la barra
  de pestañas inferior. Funciona igual en escritorio y en móvil.
- **Persistencia:** la elección se guarda en el dispositivo (`localStorage`) y se
  aplica **antes del primer pintado** (sin parpadeo al recargar).
- **Por qué:** el prototipo hi-fi ya definía el modo oscuro completo (ver HOP-61);
  esta mejora le da un acceso rápido y visible desde cualquier pantalla, en vez de
  esconderlo dentro de "Mi cuenta".
- **Implementación:** `src/components/ui/theme-menu.tsx` (el control), montado en
  `src/components/layout/app-shell.tsx`; usa el `ThemeProvider`
  (`src/components/providers/theme-provider.tsx`) y los tokens de tema de
  `src/app/globals.css`.

## Moneda en pesos mexicanos (MXN)

- **Qué es:** los importes se muestran en **pesos mexicanos** (símbolo `$`, formato
  `$1,234.56`) en toda la app (métricas de Ventas, listado y ficha de cliente).
- **Alcance:** solo presentación — el importe se guarda como número, sin moneda; el
  cambio no toca datos existentes. Centralizado en `src/lib/moneda.ts`.
