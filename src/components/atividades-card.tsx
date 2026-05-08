import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CalendarDays, MapPin, Plus, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

type Atividade = {
  id: string; titulo: string; descricao: string | null; local: string | null;
  data_inicio: string; data_fim: string | null; scope: string; agrupamento_id: string | null;
  created_by: string | null;
};

export function AtividadesCard({
  scope, agrupamentoId, title, canCreate,
}: { scope: "provincial" | "agrupamento"; agrupamentoId?: string | null; title: string; canCreate: boolean }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Atividade[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", local: "", data_inicio: "", data_fim: "" });

  const load = async () => {
    let q = supabase.from("atividades").select("*").gte("data_inicio", new Date(Date.now() - 86400000).toISOString())
      .order("data_inicio", { ascending: true }).limit(10);
    q = scope === "provincial" ? q.eq("scope", "provincial") : q.eq("scope", "agrupamento").eq("agrupamento_id", agrupamentoId!);
    const { data } = await q;
    setItems((data ?? []) as Atividade[]);
  };

  useEffect(() => { if (scope === "provincial" || agrupamentoId) load(); }, [scope, agrupamentoId]);

  const create = async () => {
    if (!form.titulo || !form.data_inicio) return toast.error("Título e data são obrigatórios");
    const { error } = await supabase.from("atividades").insert({
      scope, agrupamento_id: scope === "agrupamento" ? agrupamentoId! : null,
      titulo: form.titulo, descricao: form.descricao || null, local: form.local || null,
      data_inicio: form.data_inicio, data_fim: form.data_fim || null, created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Atividade criada");
    setOpen(false); setForm({ titulo: "", descricao: "", local: "", data_inicio: "", data_fim: "" });
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("atividades").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" /> {title}
        </h2>
        <div className="flex items-center gap-2">
          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Nova</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova atividade</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
                  <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
                  <div><Label>Local</Label><Input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Início</Label><Input type="datetime-local" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} /></div>
                    <div><Label>Fim (opcional)</Label><Input type="datetime-local" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} /></div>
                  </div>
                </div>
                <DialogFooter><Button onClick={create}>Criar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button asChild size="sm" variant="ghost">
            <Link to="/atividades">Ver todas <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem atividades agendadas.</p>
      ) : (
        <div className="space-y-2">
          {items.map((a) => {
            const d = new Date(a.data_inicio);
            const canDelete = canCreate || a.created_by === user?.id;
            return (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-md border">
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded bg-primary/10 text-primary shrink-0">
                  <span className="text-[10px] uppercase">{d.toLocaleDateString("pt-PT", { month: "short" })}</span>
                  <span className="text-xl font-bold leading-none">{d.getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{a.titulo}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.toLocaleString("pt-PT", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    {a.local && <> · <MapPin className="inline h-3 w-3" /> {a.local}</>}
                  </div>
                  {a.descricao && <div className="text-sm mt-1 text-muted-foreground line-clamp-2">{a.descricao}</div>}
                </div>
                {canDelete && (
                  <Button size="icon" variant="ghost" onClick={() => remove(a.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
