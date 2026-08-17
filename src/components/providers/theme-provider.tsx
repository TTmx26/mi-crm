"use client";

import { useCallback, useEffect, useSyncExternalStore, type ReactNode } from "react";

export type ThemePref = "light" | "dark" | "system";
type Resolved = "light" | "dark";

// Clave única y estable. Debe coincidir con la del script anti-parpadeo en
// layout.tsx (THEME_NO_FLASH_SCRIPT): ambos leen "theme" y resuelven el tema con
// la MISMA regla (valor inválido => "system"; dark => set; light => remove;
// system => prefers-color-scheme) para no producir parpadeo ni desajuste.
export const THEME_STORAGE_KEY = "theme";

function isPref(value: unknown): value is ThemePref {
  return value === "light" || value === "dark" || value === "system";
}

// --- Store de la preferencia (localStorage + emisor propio para esta pestaña) ---
const prefListeners = new Set<() => void>();
function emitPref() {
  prefListeners.forEach((l) => l());
}
function subscribePref(cb: () => void): () => void {
  prefListeners.add(cb);
  window.addEventListener("storage", cb); // sincroniza con otras pestañas
  return () => {
    prefListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function readPref(): ThemePref {
  const value = localStorage.getItem(THEME_STORAGE_KEY);
  return isPref(value) ? value : "system";
}

// --- Store de prefers-color-scheme (para el modo "system") ---
function subscribeSystem(cb: () => void): () => void {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}
function readSystemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// useSyncExternalStore: lee de un store externo sin setState-en-efecto y sin
// desajuste de hidratación — en SSR y en la primera hidratación usa el snapshot
// de servidor ("system" / false) y reconcilia con el valor real tras montar.
export function useTheme() {
  const preference = useSyncExternalStore(subscribePref, readPref, () => "system" as ThemePref);
  const systemDark = useSyncExternalStore(subscribeSystem, readSystemDark, () => false);

  const resolved: Resolved = preference === "system" ? (systemDark ? "dark" : "light") : preference;

  const setPreference = useCallback((pref: ThemePref) => {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
    emitPref();
  }, []);

  return { preference, resolved, setPreference };
}

// Montado siempre (en layout): aplica data-theme al <html> cuando cambia el tema
// resuelto. El efecto solo actualiza el DOM (sistema externo), sin setState. El
// script de <head> ya fijó el valor correcto antes del paint; esto lo mantiene.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { resolved } = useTheme();

  useEffect(() => {
    const el = document.documentElement;
    if (resolved === "dark") el.dataset.theme = "dark";
    else delete el.dataset.theme; // claro = :root por defecto (no hay [data-theme="light"])
  }, [resolved]);

  return <>{children}</>;
}
