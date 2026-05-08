import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Library, FileText, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/biblioteca")({ component: Biblio });

function Biblio() {
  const { profile, isAdmin } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [agMap, setAgMap] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data: ags } = await supabase.from("agrupamentos").select("id, numero, nome");
      const map: Record<string, string> = {};
      (ags ?? []).forEach((a: any) => { map[a.id] = `${String(a.numero).padStart(2, "0")} - ${a.nome}`; });
      setAgMap(map);
      const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false }).limit(500);
      setDocs(data ?? []);
    })();
  }, []);

  const download = async (p: string, name: string) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(p, 60);
    if (error) return toast.error(error.message);
    const a = document.createElement("a"); a.href = data.signedUrl; a.download = name; a.click();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Library className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Biblioteca</h1>
      </div>
      <p className="text-muted-foreground mb-6 text-sm">
        {isAdmin ? "Todos os documentos da Província." : "Documentos do seu agrupamento."}
      </p>

      {docs.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Nenhum documento disponível.
        </Card>
      ) : (
        <Card className="divide-y">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-navy shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{d.file_name}</div>
                  <div className="text-xs text-muted-foreground">{agMap[d.agrupamento_id] ?? "—"}</div>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => download(d.file_path, d.file_name)}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
