// Next.js 16 renombró `middleware.ts` a `proxy.ts` (confirmado en
// node_modules/next/dist/docs/.../file-conventions/proxy.md) — un
// middleware.ts normal se ignora en silencio, sin error, dejando todas las
// rutas sin proteger. La documentación de @convex-dev/auth todavía habla de
// "middleware.ts", pero la función `convexAuthNextjsMiddleware` en sí es
// compatible: solo cambia el nombre/ubicación del archivo, no la función.
//
// Esta es una conveniencia de UX (redirige antes de renderizar), no la
// barrera de seguridad real: cada función de Convex verifica la sesión por
// su cuenta (ver getAuthUserId en convex/seguimientos.ts y convex/users.ts).
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isPublicPage = createRouteMatcher(["/login", "/olvide-contrasena"]);
const isProtectedRoute = createRouteMatcher(["/((?!login|olvide-contrasena).*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isPublicPage(request) && (await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/hoy");
  }
  if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
