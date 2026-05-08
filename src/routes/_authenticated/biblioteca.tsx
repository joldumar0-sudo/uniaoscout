import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Library, FileText, Download, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/biblioteca")({ component: Biblio });

function Biblio() {
  const { profile, isAdmin, cargos, user } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [agMap, setAgMap] = useState<Record<string, string>>({});
  const [agOptions, setAgOptions] = useState<{ id: string; label: string }[]>([]);
  const [target, setTarget] = useState<string>("provincial");
  const [uploading, setUploading] = useState(false);

  const isProvCoord = cargos.some((c) => ["coord_provincial", "adj_coord_provincial"].includes(c.cargo as string));
  const myAgRespIds = cargos
    .filter((c) => ["responsavel_agrupamento", "adj_responsavel_agrupamento"].includes(c.cargo as string) && c.agrupamento_id)
    .map((c) => c.agrupamento_id as string);

  const canUploadProvincial = isAdmin || isProvCoord;
  const canUploadAny = canUploadProvincial || myAgRespIds.length > 0;

  const load = async () => {
    const { data: ags } = await supabase.from("agrupamentos").select("id, numero, nome");
    const map: Record<string, string> = {};
    (ags ?? []).forEach((a: any) => { map[a.id] = `${String(a.numero).padStart(2, "0")} - ${a.nome}`; });
    setAgMap(map);
    const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false }).limit(500);
    setDocs(data ?? []);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const opts: { id: string; label: string }[] = [];
    if (canUploadProvincial) opts.push({ id: "provincial", label: "Provincial (todos)" });
    if (isAdmin || isProvCoord) {
      Object.entries(agMap).forEach(([id, label]) => opts.push({ id, label }));
    } else {
      myAgRespIds.forEach((id) => agMap[id] && opts.push({ id, label: agMap[id] }));
    }
    setAgOptions(opts);
    if (opts.length && !opts.find((o) => o.id === target)) setTarget(opts[0].id);
  }, [agMap, isAdmin, isProvCoord, myAgRespIds.join(",")]);

  const download = async (p: string, name: string) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(p, 60);
    if (error) return toast.error(error.message);
    const a = document.createElement("a"); a.href = data.signedUrl; a.download = name; a.click();
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    const ag_id = target === "provincial" ? null : target;
    const folder = ag_id ?? "provincial";
    const path = `${folder}/${Date.now()}-${f.name}`;
    const up = await supabase.storage.from("documents").upload(path, f);
    if (up.error) { setUploading(false); return toast.error(up.error.message); }
    const { error } = await supabase.from("documents").insert({
      agrupamento_id: ag_id, file_path: path, file_name: f.name,
      mime_type: f.type, size_bytes: f.size, uploaded_by: user?.id,
    });
    setUploading(false);
    e.target.value = "";
    if (error) return toast.error(error.message);
    toast.success("Documento enviado");
    load();
  };

  const del = async (id: string, path: string) => {
    await supabase.storage.from("documents").remove([path]);
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const canDeleteDoc = (d: any) =>
    isAdmin || isProvCoord || d.uploaded_by === user?.id ||
    (d.agrupamento_id && myAgRespIds.includes(d.agrupamento_id));

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Library className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Biblioteca</h1>
      </div>
      <p className="text-muted-foreground mb-6 text-sm">
        Manuais, livros e documentos da Província e dos agrupamentos.
      </p>

      {canUploadAny && (
        <Card className="p-4 mb-6 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <Label className="text-xs">Destino</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {agOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <label>
            <input type="file" hidden onChange={upload} disabled={uploading} />
            <Button asChild disabled={uploading}>
              <span><Upload className="h-4 w-4 mr-2" />{uploading ? "Enviando..." : "Enviar arquivo"}</span>
            </Button>
          </label>
        </Card>
      )}

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
                  <div className="text-xs text-muted-foreground">
                    {d.agrupamento_id ? agMap[d.agrupamento_id] ?? "—" : "Provincial"}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => download(d.file_path, d.file_name)}>
                  <Download className="h-4 w-4" />
                </Button>
                {canDeleteDoc(d) && (
                  <Button size="icon" variant="ghost" onClick={() => del(d.id, d.file_path)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
