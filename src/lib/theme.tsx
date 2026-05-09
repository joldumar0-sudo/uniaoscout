import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "auto";
const KEY = "ecm-theme";

const Ctx = createContext<{ mode: ThemeMode; setMode: (m: ThemeMode) => void }>({
  mode: "auto", setMode: () => {},
});

function apply(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  const dark = mode === "dark" || (mode === "auto" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("auto");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as ThemeMode | null) ?? "auto";
    setModeState(saved);
    apply(saved);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { if ((localStorage.getItem(KEY) ?? "auto") === "auto") apply("auto"); };
    mq.addEventListener("change", onChange);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        const next = (e.newValue as ThemeMode | null) ?? "auto";
        setModeState(next);
        apply(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setMode = (m: ThemeMode) => {
    localStorage.setItem(KEY, m);
    setModeState(m);
    apply(m);
  };

  return <Ctx.Provider value={{ mode, setMode }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

export const APP_VERSION = "1.0.2";
export const APP_DEVELOPER = {
  name: "OLDUMAR JULIO",
  email: "joldumar0@gmail.com",
  contact: "849235892",
};
