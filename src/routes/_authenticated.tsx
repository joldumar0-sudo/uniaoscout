import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { ChatNotificationsProvider, useChatNotifications } from "@/lib/chat-notifications";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, Boxes, MessageSquare, Library, Image as ImageIcon,
  PawPrint, ShieldAlert, LogOut, Loader2, UserCog, Bell, BellOff, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import logo from "@/assets/logo-ecm.png";
import { APP_VERSION } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated")({
  component: () => (
    <ChatNotificationsProvider>
      <AuthLayout />
    </ChatNotificationsProvider>
  ),
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agrupamentos", label: "Agrupamentos", icon: Users },
  { to: "/equipamentos", label: "Equipamentos", icon: Boxes },
  { to: "/biblioteca", label: "Biblioteca", icon: Library },
  { to: "/galeria", label: "Galeria", icon: ImageIcon },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/alcateia", label: "Alcateia", icon: PawPrint },
];

function AuthLayout() {
  const { loading, session, profile, isAdmin } = useAuth();
  const { unread, permission, requestPermission } = useChatNotifications();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !session) nav({ to: "/login" });
  }, [loading, session, nav]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const logout = async () => {
    await supabase.auth.signOut();
    nav({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 border-r border-sidebar-border">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ECM" className="h-11 w-11 rounded-md object-cover shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-bold leading-tight uppercase tracking-wide">Escoteiros Católicos</div>
              <div className="text-[10px] text-sidebar-foreground/70 leading-tight">de Moçambique</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            const active = loc.pathname.startsWith(n.to);
            const Icon = n.icon;
            const badge = n.to === "/chat" ? unread : 0;
            return (
              <Link key={n.to} to={n.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "hover:bg-sidebar-accent text-sidebar-foreground/90"
                )}>
                <Icon className="h-4 w-4" />
                <span className="flex-1">{n.label}</span>
                {badge > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-3 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
                Administração
              </div>
              <Link to="/membros" className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                loc.pathname.startsWith("/membros")
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "hover:bg-sidebar-accent text-sidebar-foreground/90"
              )}>
                <UserCog className="h-4 w-4" /> Membros & Cargos
              </Link>
              <Link to="/auditoria" className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                loc.pathname.startsWith("/auditoria")
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "hover:bg-sidebar-accent text-sidebar-foreground/90"
              )}>
                <ShieldAlert className="h-4 w-4" /> Auditoria
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="text-xs text-sidebar-foreground/70 truncate">
            {profile?.full_name ?? profile?.email}
            {isAdmin && <span className="ml-1 px-1.5 py-0.5 rounded bg-sidebar-primary text-sidebar-primary-foreground text-[9px]">ADMIN</span>}
          </div>
          {permission !== "granted" && permission !== "unsupported" && (
            <Button onClick={requestPermission} variant="ghost" size="sm"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
              {permission === "denied" ? <BellOff className="h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
              {permission === "denied" ? "Notificações bloqueadas" : "Ativar notificações"}
            </Button>
          )}
          <Link to="/configuracoes" className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm",
            loc.pathname.startsWith("/configuracoes")
              ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
              : "hover:bg-sidebar-accent text-sidebar-foreground/90"
          )}>
            <Settings className="h-4 w-4" /> Definições
          </Link>
          <Button onClick={logout} variant="ghost" size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
          <div className="text-[10px] text-sidebar-foreground/50 text-center pt-1">
            v{APP_VERSION} · OLDUMAR JULIO
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
