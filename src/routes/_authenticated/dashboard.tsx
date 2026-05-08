import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Boxes, MessageSquare, Library, Image as ImageIcon, PawPrint, Shield } from "lucide-react";
import { cargoLabel, cargoIcon } from "@/lib/cargos";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { profile, isAdmin, cargos } = useAuth();
  const [stats, setStats] = useState({ agrupamentos: 0, equipamentos: 0, membros: 0 });
  const [agName, setAgName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ count: ag }, { count: eq }, { count: mem }] = await Promise.all([
        supabase.from("agrupamentos").select("*", { count: "exact", head: true }),
        supabase.from("equipamentos").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      setStats({ agrupamentos: ag ?? 0, equipamentos: eq ?? 0, membros: mem ?? 0 });
      if (profile?.agrupamento_id) {
        const { data } = await supabase.from("agrupamentos").select("numero, nome").eq("id", profile.agrupamento_id).maybeSingle();
        if (data) setAgName(`${String(data.numero).padStart(2, "0")} · ${data.nome}`);
      }
    })();
  }, [profile?.agrupamento_id]);

  const quickLinks = [
    { to: "/chat", label: "Chat", icon: MessageSquare, color: "bg-primary" },
    { to: "/biblioteca", label: "Biblioteca", icon: Library, color: "bg-navy" },
    { to: "/galeria", label: "Galeria", icon: ImageIcon, color: "bg-khaki text-khaki-foreground" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Olá, {profile?.full_name?.split(" ")[0] ?? "membro"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? "Painel Provincial de Administração" : agName ? `Agrupamento: ${agName}` : "Dashboard"}
        </p>
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {quickLinks.map(({ to, label, icon: Icon, color }) => (
          <Link key={to} to={to}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className={`h-12 w-12 rounded-lg ${color} text-primary-foreground flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="text-lg font-semibold">{label}</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users} label="Agrupamentos" value={stats.agrupamentos} />
        <StatCard icon={Boxes} label="Equipamentos" value={stats.equipamentos} />
        <StatCard icon={Shield} label="Membros visíveis" value={stats.membros} />
      </div>

      {/* My cargos */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <PawPrint className="h-5 w-5 text-primary" /> Meus cargos
        </h2>
        {cargos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cargo atribuído. Aguarde nomeação do Coordenador Provincial ou Responsável do Agrupamento.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cargos.map((c, i) => {
              const Icon = cargoIcon(c.cargo);
              return (
                <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm">
                  <Icon className="h-4 w-4" />
                  {cargoLabel(c.cargo)}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </Card>
  );
}
