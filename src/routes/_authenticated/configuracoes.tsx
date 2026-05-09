import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme, APP_VERSION, APP_DEVELOPER, type ThemeMode } from "@/lib/theme";
import { useChatNotifications } from "@/lib/chat-notifications";
import { Sun, Moon, Monitor, Mail, Phone, User, Bell, BellOff, BellRing } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-ecm.png";

export const Route = createFileRoute("/_authenticated/configuracoes")({ component: Page });

function Page() {
  const { mode, setMode } = useTheme();
  const { permission, requestPermission, unread, unreadProvincial, unreadAgrupamento } = useChatNotifications();
  const opts: { v: ThemeMode; label: string; Icon: any }[] = [
    { v: "light", label: "Claro", Icon: Sun },
    { v: "dark", label: "Escuro", Icon: Moon },
    { v: "auto", label: "Automático", Icon: Monitor },
  ];

  const askPerm = async () => {
    await requestPermission();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      toast.success("Notificações activadas em tempo real");
    } else {
      toast.error("Permissão de notificações negada");
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <img src={logo} alt="ECM" className="h-16 w-16 rounded-md object-cover" />
        <div>
          <h1 className="text-2xl font-bold">Definições</h1>
          <p className="text-sm text-muted-foreground">Escoteiros Católicos de Moçambique</p>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Aparência</h2>
        <div className="grid grid-cols-3 gap-2">
          {opts.map(({ v, label, Icon }) => (
            <Button key={v} variant={mode === v ? "default" : "outline"}
              onClick={() => setMode(v)} className="h-20 flex-col gap-1">
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          O modo automático segue as preferências do sistema.
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" /> Notificações
          </h2>
          {unread > 0 && (
            <span className="text-xs rounded-full bg-primary text-primary-foreground px-2 py-0.5">
              {unread} nova{unread === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">Notificações do navegador</div>
              <div className="text-xs text-muted-foreground">
                Estado: {permission === "granted" ? "Activadas" : permission === "denied" ? "Bloqueadas" : permission === "unsupported" ? "Não suportado" : "Por activar"}
              </div>
            </div>
            {permission === "granted" ? (
              <Button variant="outline" disabled className="gap-2"><Bell className="h-4 w-4" /> Activadas</Button>
            ) : permission === "denied" ? (
              <Button variant="outline" disabled className="gap-2"><BellOff className="h-4 w-4" /> Bloqueadas</Button>
            ) : permission === "unsupported" ? (
              <Button variant="outline" disabled>Indisponível</Button>
            ) : (
              <Button onClick={askPerm} className="gap-2"><Bell className="h-4 w-4" /> Activar</Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div className="rounded-md bg-muted p-3">
              <div className="text-xs text-muted-foreground">Provincial</div>
              <div className="text-lg font-semibold">{unreadProvincial}</div>
            </div>
            <div className="rounded-md bg-muted p-3">
              <div className="text-xs text-muted-foreground">Agrupamento</div>
              <div className="text-lg font-semibold">{unreadAgrupamento}</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            As mensagens do chat chegam em tempo real, mesmo com esta página aberta.
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Sobre o aplicativo</h2>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between"><dt className="text-muted-foreground">Versão</dt><dd className="font-medium">{APP_VERSION}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground flex items-center gap-1"><User className="h-3.5 w-3.5"/>Desenvolvido por</dt><dd className="font-medium">{APP_DEVELOPER.name}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground flex items-center gap-1"><Mail className="h-3.5 w-3.5"/>E-mail</dt><dd><a className="text-primary hover:underline" href={`mailto:${APP_DEVELOPER.email}`}>{APP_DEVELOPER.email}</a></dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground flex items-center gap-1"><Phone className="h-3.5 w-3.5"/>Contacto</dt><dd><a className="text-primary hover:underline" href={`tel:+258${APP_DEVELOPER.contact}`}>+258 {APP_DEVELOPER.contact}</a></dd></div>
        </dl>
      </Card>
    </div>
  );
}
