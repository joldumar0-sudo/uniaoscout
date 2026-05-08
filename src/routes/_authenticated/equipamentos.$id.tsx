import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/equipamentos/$id")({ component: Detail });

function Detail() {
  const { id } = Route.useParams();
  const { isAdmin } = useAuth();
  const [eq, setEq] = useState<any>(null);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");

  useEffect(() => {
    supabase.from("equipamentos").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setEq(data); setTitulo(data?.titulo ?? ""); setConteudo(data?.conteudo ?? "");
    });
  }, [id]);

  if (!eq) return <div className="p-8">Carregando...</div>;

  const save = async () => {
    const { error } = await supabase.from("equipamentos").update({ titulo, conteudo }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Salvo. Conteúdo replicado para todos.");
  };

  const del = async () => {
    if (!confirm("Eliminar este equipamento?")) return;
    await supabase.from("equipamentos").delete().eq("id", id);
    window.history.back();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/equipamentos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Equipamentos
      </Link>

      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-4xl font-bold text-primary">#{String(eq.numero).padStart(2, "0")}</span>
        <h1 className="text-2xl font-bold">Equipamento</h1>
        {!isAdmin && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
            <Lock className="h-3 w-3" /> Somente leitura
          </span>
        )}
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Título</label>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} disabled={!isAdmin} />
        </div>
        <div>
          <label className="text-sm font-medium">Conteúdo oficial</label>
          <Textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} disabled={!isAdmin}
            rows={14} className="font-mono text-sm" />
        </div>
        {isAdmin && (
          <div className="flex justify-between">
            <Button variant="outline" onClick={del}><Trash2 className="h-4 w-4 mr-2" />Eliminar</Button>
            <Button onClick={save}><Save className="h-4 w-4 mr-2" />Salvar e replicar</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
