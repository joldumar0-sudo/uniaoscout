import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image as ImageIcon, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/galeria")({ component: Galeria });

function Galeria() {
  const { isAdmin, cargos, user } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
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
    const { data } = await supabase.from("photos").select("*").order("created_at", { ascending: false }).limit(200);
    setPhotos(data ?? []);
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

  const url = (p: string) => supabase.storage.from("photos").getPublicUrl(p).data.publicUrl;

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    const ag_id = target === "provincial" ? null : target;
    const folder = ag_id ?? "provincial";
    const path = `${folder}/${Date.now()}-${f.name}`;
    const up = await supabase.storage.from("photos").upload(path, f);
    if (up.error) { setUploading(false); return toast.error(up.error.message); }
    const { error } = await supabase.from("photos").insert({
      agrupamento_id: ag_id, file_path: path, uploaded_by: user?.id,
    });
    setUploading(false);
    e.target.value = "";
    if (error) return toast.error(error.message);
    toast.success("Foto enviada");
    load();
  };

  const del = async (id: string, path: string) => {
    await supabase.storage.from("photos").remove([path]);
    const { error } = await supabase.from("photos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const canDeletePhoto = (p: any) =>
    isAdmin || isProvCoord || p.uploaded_by === user?.id ||
    (p.agrupamento_id && myAgRespIds.includes(p.agrupamento_id));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ImageIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Galeria</h1>
      </div>
      <p className="text-muted-foreground mb-6 text-sm">Fotos da Província e dos agrupamentos.</p>

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
            <input type="file" accept="image/*" hidden onChange={upload} disabled={uploading} />
            <Button asChild disabled={uploading}>
              <span><Upload className="h-4 w-4 mr-2" />{uploading ? "Enviando..." : "Enviar foto"}</span>
            </Button>
          </label>
        </Card>
      )}

      {photos.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Sem fotos ainda.
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative group aspect-square rounded-md overflow-hidden border bg-muted">
              <img src={url(p.file_path)} alt={p.caption ?? ""} className="w-full h-full object-cover hover:scale-105 transition-transform" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {p.agrupamento_id ? agMap[p.agrupamento_id] ?? "" : "Provincial"}
              </div>
              {canDeletePhoto(p) && (
                <Button size="icon" variant="destructive"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                  onClick={() => del(p.id, p.file_path)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
