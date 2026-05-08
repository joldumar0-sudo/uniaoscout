import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/auditoria")({ component: Audit });

function Audit() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [ags, setAgs] = useState<any[]>([]);
  const [eqs, setEqs] = useState<any[]>([]);
  const [agId, setAgId] = useState(""); const [eqId, setEqId] = useState("");
  const [desc, setDesc] = useState("");

  const load = async () => {
    const [{ data: a }, { data: e }, { data: i }] = await Promise.all([
      supabase.from("agrupamentos").select("id, numero, nome").order("numero"),
      supabase.from("equipamentos").select("id, numero, titulo").order("numero"),
      supabase.from("audit_divergences").select("*").order("created_at", { ascending: false }),
    ]);
    setAgs(a ?? []); setEqs(e ?? []); setItems(i ?? []);
  };
  useEffect(() => { load(); }, []);

  if (!isAdmin) return <div className="p-8">Acesso restrito.</div>;

  const create = async () => {
    if (!desc.trim()) return;
    await supabase.from("audit_divergences").insert({
      agrupamento_id: agId || null, equipamento_id: eqId || null, descricao: desc,
    });
    setDesc(""); setAgId(""); setEqId(""); load();
    toast.success("Divergência registada");
  };

  const resolve = async (id: string) => {
    await supabase.from("audit_divergences").update({ status: "resolvido" }).eq("id", id);
    load();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ShieldAlert className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Auditoria</h1>
      </div>
      <p className="text-muted-foreground mb-6 text-sm">Confronto de dados — divergências entre agrupamentos e diretrizes provinciais</p>

      <Card className="p-5 mb-6 space-y-3">
        <h2 className="font-semibold">Registar divergência</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Select value={agId} onValueChange={setAgId}>
            <SelectTrigger><SelectValue placeholder="Agrupamento (opcional)" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {ags.map((a) => <SelectItem key={a.id} value={a.id}>{String(a.numero).padStart(2,"0")} {a.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={eqId} onValueChange={setEqId}>
            <SelectTrigger><SelectValue placeholder="Equipamento (opcional)" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {eqs.map((e) => <SelectItem key={e.id} value={e.id}>#{String(e.numero).padStart(2,"0")} {e.titulo}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Textarea placeholder="Descrever a divergência observada..." value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
        <Button onClick={create}><Plus className="h-4 w-4 mr-2" />Registar</Button>
      </Card>

      <div className="space-y-2">
        {items.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">Sem divergências registadas.</Card>
        ) : items.map((i) => (
          <Card key={i.id} className="p-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide font-semibold mb-1"
                style={{ color: i.status === "resolvido" ? "var(--primary)" : "var(--destructive)" }}>
                {i.status}
              </div>
              <div className="text-sm">{i.descricao}</div>
            </div>
            {i.status === "aberto" && (
              <Button size="sm" variant="outline" onClick={() => resolve(i.id)}>
                <CheckCircle2 className="h-4 w-4 mr-1" />Resolver
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
