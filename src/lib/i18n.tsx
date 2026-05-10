import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "pt" | "en";
const KEY = "ecm-lang";

const DICT: Record<Lang, Record<string, string>> = {
  pt: {
    "dash.hello": "Olá",
    "dash.member": "membro",
    "dash.admin_panel": "Painel Provincial de Administração",
    "dash.group": "Agrupamento",
    "dash.dashboard": "Dashboard",
    "dash.quick": "Atalhos",
    "dash.appearance": "Aparência",
    "dash.language": "Idioma",
    "nav.dashboard": "Dashboard",
    "nav.agrupamentos": "Agrupamentos",
    "nav.equipamentos": "Equipamentos",
    "nav.biblioteca": "Biblioteca",
    "nav.galeria": "Galeria",
    "nav.chat": "Chat",
    "nav.alcateia": "Alcateia",
    "theme.light": "Claro",
    "theme.dark": "Escuro",
    "theme.auto": "Auto",
    "stats.agrupamentos": "Agrupamentos",
    "stats.equipamentos": "Equipamentos",
    "stats.membros": "Membros visíveis",
    "cargos.title": "Meus cargos",
    "cargos.empty": "Nenhum cargo atribuído. Aguarde nomeação do Coordenador Provincial ou Responsável do Agrupamento.",
  },
  en: {
    "dash.hello": "Hello",
    "dash.member": "member",
    "dash.admin_panel": "Provincial Administration Panel",
    "dash.group": "Group",
    "dash.dashboard": "Dashboard",
    "dash.quick": "Shortcuts",
    "dash.appearance": "Appearance",
    "dash.language": "Language",
    "nav.dashboard": "Dashboard",
    "nav.agrupamentos": "Groups",
    "nav.equipamentos": "Equipment",
    "nav.biblioteca": "Library",
    "nav.galeria": "Gallery",
    "nav.chat": "Chat",
    "nav.alcateia": "Cub Pack",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.auto": "Auto",
    "stats.agrupamentos": "Groups",
    "stats.equipamentos": "Equipment",
    "stats.membros": "Visible members",
    "cargos.title": "My roles",
    "cargos.empty": "No role assigned yet. Wait for the Provincial Coordinator or Group Leader to nominate you.",
  },
};

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }>({
  lang: "pt", setLang: () => {}, t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    const saved = (typeof window !== "undefined" ? (localStorage.getItem(KEY) as Lang | null) : null) ?? "pt";
    setLangState(saved);
    if (typeof document !== "undefined") document.documentElement.lang = saved;
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        const next = (e.newValue as Lang | null) ?? "pt";
        setLangState(next);
        document.documentElement.lang = next;
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLang = (l: Lang) => {
    localStorage.setItem(KEY, l);
    setLangState(l);
    document.documentElement.lang = l;
  };

  const t = (k: string) => DICT[lang][k] ?? DICT.pt[k] ?? k;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
