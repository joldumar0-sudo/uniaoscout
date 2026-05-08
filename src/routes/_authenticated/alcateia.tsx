import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PawPrint, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/alcateia")({ component: Alcateia });

function Alcateia() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <PawPrint className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Alcateia</h1>
      </div>
      <p className="text-muted-foreground mb-6 text-sm">Espaço dos Balu e Akela — místicas e progressões dos lobitos</p>

      <Tabs defaultValue="mistica">
        <TabsList>
          <TabsTrigger value="mistica">Místicas</TabsTrigger>
          <TabsTrigger value="progressao">Progressões</TabsTrigger>
        </TabsList>
        <TabsContent value="mistica" className="mt-4"><Lista tipo="mistica" /></TabsContent>
        <TabsContent value="progressao" className="mt-4"><Lista tipo="progressao" /></TabsContent>
      </Tabs>
    </div>
  );
}

function Lista({ tipo }: { tipo: "mistica" | "progressao" }) {
  const { user, profile, isAdmin, cargos } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");

  const canPost = isAdmin || cargos.some((c) =>
    ["balu_agrupamento", "akela_agrupamento", "responsavel_agrupamento", "adj_responsavel_agrupamento"].includes(c.cargo)
  );

  const load = async () => {
    const { data } = await supabase.from("alcateia_posts").select("*").eq("tipo", tipo).order("created_at", { ascending: false });
    setPosts(data ?? []);
  };
  useEffect(() => { load(); }, [tipo]);

  const create = async () => {
    if (!titulo.trim()) return;
    const { error } = await supabase.from("alcateia_posts").insert({
      tipo, titulo, conteudo, agrupamento_id: profile?.agrupamento_id ?? null, created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    setTitulo(""); setConteudo(""); load();
  };

  const del = async (id: string) => {
    await supabase.from("alcateia_posts").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      {canPost && (
        <Card className="p-4 space-y-3">
          <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <Textarea placeholder="Conteúdo..." rows={4} value={conteudo} onChange={(e) => setConteudo(e.target.value)} />
          <Button onClick={create}><Plus className="h-4 w-4 mr-2" />Publicar</Button>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm">Sem publicações.</Card>
      ) : posts.map((p) => (
        <Card key={p.id} className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold">{p.titulo}</h3>
            {(p.created_by === user?.id || isAdmin) && (
              <Button size="icon" variant="ghost" onClick={() => del(p.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm">{p.conteudo}</p>
        </Card>
      ))}
    </div>
  );
}
