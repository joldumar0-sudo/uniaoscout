import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agrupamentos/")({ component: List });

type Ag = { id: string; numero: number; nome: string; paroquia: string | null };

function List() {
  const [items, setItems] = useState<Ag[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("agrupamentos").select("id, numero, nome, paroquia").order("numero").then(({ data }) => {
      setItems((data ?? []) as Ag[]);
    });
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((a) =>
      String(a.numero).padStart(2, "0").includes(term) ||
      a.nome.toLowerCase().includes(term) ||
      (a.paroquia ?? "").toLowerCase().includes(term)
    );
  }, [items, q]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agrupamentos</h1>
          <p className="text-muted-foreground text-sm">01 a 100 — selecione um agrupamento</p>
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Pesquisar por número, nome ou paróquia..." value={q}
          onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map((a) => (
          <Link key={a.id} to="/agrupamentos/$id" params={{ id: a.id }}>
            <Card className="p-4 hover:shadow-md hover:border-primary transition-all cursor-pointer h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="text-2xl font-bold text-primary">{String(a.numero).padStart(2, "0")}</div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium truncate">{a.nome}</div>
              {a.paroquia && <div className="text-xs text-muted-foreground truncate">{a.paroquia}</div>}
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">Nenhum agrupamento encontrado.</p>
      )}
    </div>
  );
}
