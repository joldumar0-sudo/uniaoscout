import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, MapPin, ArrowLeft, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/atividades")({ component: Page });

type Atividade = {
  id: string; titulo: string; descricao: string | null; local: string | null;
  data_inicio: string; data_fim: string | null; scope: string; agrupamento_id: string | null;
};

function Page() {
  const { profile } = useAuth();
  const [scope, setScope] = useState<"provincial" | "agrupamento">("provincial");
  const [items, setItems] = useState<Atividade[]>([]);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    (async () => {
      let query = supabase.from("atividades").select("*").order("data_inicio", { ascending: false }).limit(500);
      if (scope === "provincial") query = query.eq("scope", "provincial");
      else if (profile?.agrupamento_id) query = query.eq("scope", "agrupamento").eq("agrupamento_id", profile.agrupamento_id);
      else { setItems([]); return; }
      const { data } = await query;
      setItems((data ?? []) as Atividade[]);
    })();
  }, [scope, profile?.agrupamento_id]);

  const filtered = useMemo(() => {
    return items.filter((a) => {
      if (q && !`${a.titulo} ${a.descricao ?? ""} ${a.local ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      const d = new Date(a.data_inicio).getTime();
      if (from && d < new Date(from).getTime()) return false;
      if (to && d > new Date(to).getTime() + 86400000) return false;
      return true;
    });
  }, [items, q, from, to]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Atividades</h1>
      </div>

      <Tabs value={scope} onValueChange={(v) => setScope(v as any)} className="mb-4">
        <TabsList>
          <TabsTrigger value="provincial">Provincial</TabsTrigger>
          <TabsTrigger value="agrupamento" disabled={!profile?.agrupamento_id}>Meu Agrupamento</TabsTrigger>
        </TabsList>
        <TabsContent value={scope}></TabsContent>
      </Tabs>

      <Card className="p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Título, local..." className="pl-8" />
          </div>
        </div>
        <div>
          <Label className="text-xs">De</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Até</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Nenhuma atividade encontrada.</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const d = new Date(a.data_inicio);
            return (
              <Card key={a.id} className="p-4 flex items-start gap-3">
                <div className="flex flex-col items-center justify-center w-16 h-16 rounded bg-primary/10 text-primary shrink-0">
                  <span className="text-[10px] uppercase">{d.toLocaleDateString("pt-PT", { month: "short" })}</span>
                  <span className="text-2xl font-bold leading-none">{d.getDate()}</span>
                  <span className="text-[10px]">{d.getFullYear()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{a.titulo}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.toLocaleString("pt-PT", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}
                    {a.local && <> · <MapPin className="inline h-3 w-3" /> {a.local}</>}
                  </div>
                  {a.descricao && <div className="text-sm mt-1">{a.descricao}</div>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
