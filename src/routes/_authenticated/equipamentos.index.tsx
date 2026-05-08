import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Boxes, Plus, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/equipamentos/")({ component: List });

function List() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [numero, setNumero] = useState("");
  const [titulo, setTitulo] = useState("");

  const load = async () => {
    const { data } = await supabase.from("equipamentos").select("*").order("numero");
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const { error } = await supabase.from("equipamentos").insert({
      numero: parseInt(numero, 10), titulo, conteudo: "",
    });
    if (error) return toast.error(error.message);
    toast.success("Equipamento criado");
    setOpen(false); setNumero(""); setTitulo(""); load();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Equipamentos</h1>
          <p className="text-muted-foreground text-sm">
            Informação oficial provincial — espelhada para todas as paróquias e agrupamentos
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo equipamento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Número</Label><Input type="number" value={numero} onChange={(e) => setNumero(e.target.value)} /></div>
                <div><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
              </div>
              <DialogFooter><Button onClick={create}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <Boxes className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Ainda não há equipamentos cadastrados. {isAdmin && "Crie o primeiro acima."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((e) => (
            <Link key={e.id} to="/equipamentos/$id" params={{ id: e.id }}>
              <Card className="p-5 hover:shadow-md hover:border-primary transition-all cursor-pointer h-full">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-2xl font-bold text-primary">#{String(e.numero).padStart(2, "0")}</div>
                  {!isAdmin && <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <h3 className="font-semibold mb-1">{e.titulo}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{e.conteudo || "Sem conteúdo."}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
