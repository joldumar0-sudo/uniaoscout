import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, Boxes, MessageSquare, Library, Image as ImageIcon,
  PawPrint, ShieldAlert, LogOut, Tent, Loader2, UserCog
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({ component: AuthLayout });

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
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-sidebar-primary flex items-center justify-center">
              <Tent className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">ECMOZ</div>
              <div className="text-[10px] text-sidebar-foreground/70 leading-tight">Escoteiros Católicos</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            const active = loc.pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "hover:bg-sidebar-accent text-sidebar-foreground/90"
                )}>
                <Icon className="h-4 w-4" />
                {n.label}
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

        <div className="border-t border-sidebar-border p-3">
          <div className="text-xs text-sidebar-foreground/70 mb-2 truncate">
            {profile?.full_name ?? profile?.email}
            {isAdmin && <span className="ml-1 px-1.5 py-0.5 rounded bg-sidebar-primary text-sidebar-primary-foreground text-[9px]">ADMIN</span>}
          </div>
          <Button onClick={logout} variant="ghost" size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
