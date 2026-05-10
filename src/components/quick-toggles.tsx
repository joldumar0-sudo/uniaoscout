import { useTheme, type ThemeMode } from "@/lib/theme";
import { useI18n, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sun, Moon, Monitor, Languages } from "lucide-react";

export function QuickToggles() {
  const { mode, setMode } = useTheme();
  const { lang, setLang, t } = useI18n();

  const themes: { v: ThemeMode; Icon: any; label: string }[] = [
    { v: "light", Icon: Sun, label: t("theme.light") },
    { v: "dark", Icon: Moon, label: t("theme.dark") },
    { v: "auto", Icon: Monitor, label: t("theme.auto") },
  ];
  const langs: { v: Lang; label: string }[] = [
    { v: "pt", label: "PT" },
    { v: "en", label: "EN" },
  ];

  return (
    <Card className="p-3 flex flex-wrap items-center gap-3 mb-4">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground hidden sm:inline">{t("dash.appearance")}:</span>
        <div className="inline-flex rounded-md border bg-background p-0.5">
          {themes.map(({ v, Icon, label }) => (
            <Button
              key={v}
              size="sm"
              variant={mode === v ? "default" : "ghost"}
              onClick={() => setMode(v)}
              className="h-8 px-2.5 gap-1.5"
              title={label}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <Languages className="h-4 w-4 text-muted-foreground" />
        <div className="inline-flex rounded-md border bg-background p-0.5">
          {langs.map(({ v, label }) => (
            <Button
              key={v}
              size="sm"
              variant={lang === v ? "default" : "ghost"}
              onClick={() => setLang(v)}
              className="h-8 px-3 text-xs font-semibold"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
