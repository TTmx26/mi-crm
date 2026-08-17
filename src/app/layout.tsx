import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

// Fija data-theme ANTES del primer paint para evitar el parpadeo de tema claro.
// MISMA regla que ThemeProvider (clave "theme"; valor inválido => "system";
// dark => set, light => remove, system => prefers-color-scheme). Mantener ambos
// en sincronía: si cambia la regla aquí, cambiarla también en theme-provider.ts.
const THEME_NO_FLASH_SCRIPT = `(function(){try{var p=localStorage.getItem('theme');if(p!=='light'&&p!=='dark'&&p!=='system')p='system';var d=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);var e=document.documentElement;if(d)e.dataset.theme='dark';else delete e.dataset.theme;}catch(e){}})();`;

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vibe CRM",
  description: "CRM para pequeños negocios de venta digital.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#16A34A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      {/* suppressHydrationWarning: el script anti-parpadeo muta data-theme del
          <html> antes de la hidratación; sin esto React avisaría del atributo extra. */}
      <html
        lang="es"
        suppressHydrationWarning
        className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-bg text-text font-sans">
          {/* Primer hijo de <body>: se ejecuta antes de pintar el contenido de
              la app, fijando data-theme sin parpadeo (App Router desaconseja un
              <head> manual en el layout raíz). */}
          <script dangerouslySetInnerHTML={{ __html: THEME_NO_FLASH_SCRIPT }} />
          <ThemeProvider>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
