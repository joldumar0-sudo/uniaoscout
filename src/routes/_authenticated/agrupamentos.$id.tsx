import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CARGOS, cargoLabel, cargoIcon, type Cargo } from "@/lib/cargos";
import { ArrowLeft, Upload, Trash2, FileText, Image as ImageIcon, UserPlus, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agrupamentos/$id")({ component: AgDetail });

function AgDetail() {
  const { id } = Route.useParams();
  const { isAdmin, user } = useAuth();
  const [ag, setAg] = useState<any>(null);
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("agrupamentos").select("*").eq("id", id).maybeSingle();
      setAg(data);
      if (user) {
        const { data: noms } = await supabase.from("nominations").select("cargo")
          .eq("user_id", user.id).eq("agrupamento_id", id);
        const isResp = (noms ?? []).some((n: any) =>
          ["responsavel_agrupamento", "adj_responsavel_agrupamento"].includes(n.cargo)
        );
        setCanManage(isAdmin || isResp);
      }
    })();
  }, [id, user, isAdmin]);

  if (!ag) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <Link to="/agrupamentos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-4xl font-bold text-primary">{String(ag.numero).padStart(2, "0")}</span>
        <div>
          <h1 className="text-2xl font-bold">{ag.nome}</h1>
          {ag.paroquia && <p className="text-muted-foreground">{ag.paroquia}</p>}
        </div>
      </div>

      <Tabs defaultValue="membros">
        <TabsList>
          <TabsTrigger value="membros">Membros & Cargos</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
          <TabsTrigger value="fotos">Fotos</TabsTrigger>
        </TabsList>
        <TabsContent value="membros" className="mt-4">
          <MembrosTab agrupamentoId={id} canManage={canManage} />
        </TabsContent>
        <TabsContent value="docs" className="mt-4">
          <DocsTab agrupamentoId={id} canManage={canManage} />
        </TabsContent>
        <TabsContent value="fotos" className="mt-4">
          <FotosTab agrupamentoId={id} canManage={canManage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MembrosTab({ agrupamentoId, canManage }: { agrupamentoId: string; canManage: boolean }) {
  const [noms, setNoms] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [cargo, setCargo] = useState<Cargo>("responsavel_agrupamento");
  const { user } = useAuth();

  const load = async () => {
    const { data } = await supabase.from("nominations")
      .select("id, cargo, user_id, profiles:profiles!nominations_user_id_fkey(full_name, email)")
      .eq("agrupamento_id", agrupamentoId);
    setNoms(data ?? []);
    const { data: p } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
    setProfiles(p ?? []);
  };
  useEffect(() => { load(); }, [agrupamentoId]);

  const cargosAg = CARGOS.filter((c) => c.nivel === "agrupamento");

  const nomear = async () => {
    if (!userId) return;
    const { error } = await supabase.from("nominations").insert({
      user_id: userId, cargo, agrupamento_id: agrupamentoId, nominated_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Nomeação efetuada");
    setOpen(false); setUserId("");
    load();
  };

  const remover = async (id: string) => {
    const { error } = await supabase.from("nominations").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Nomeação removida");
    load();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Cargos do Agrupamento</h2>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><UserPlus className="h-4 w-4 mr-2" />Nomear</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nomear membro</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Membro</Label>
                  <Select value={userId} onValueChange={setUserId}>
                    <SelectTrigger><SelectValue placeholder="Escolher membro..." /></SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cargo</Label>
                  <Select value={cargo} onValueChange={(v) => setCargo(v as Cargo)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {cargosAg.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={nomear}>Confirmar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {noms.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum cargo atribuído neste agrupamento.</p>
      ) : (
        <div className="space-y-2">
          {noms.map((n: any) => {
            const Icon = cargoIcon(n.cargo);
            return (
              <div key={n.id} className="flex items-center justify-between p-3 rounded-md border bg-card">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{n.profiles?.full_name ?? n.profiles?.email ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{cargoLabel(n.cargo)}</div>
                  </div>
                </div>
                {canManage && (
                  <Button variant="ghost" size="icon" onClick={() => remover(n.id)}>
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

function DocsTab({ agrupamentoId, canManage }: { agrupamentoId: string; canManage: boolean }) {
  const [docs, setDocs] = useState<any[]>([]);
  const { user } = useAuth();

  const load = async () => {
    const { data } = await supabase.from("documents").select("*").eq("agrupamento_id", agrupamentoId).order("created_at", { ascending: false });
    setDocs(data ?? []);
  };
  useEffect(() => { load(); }, [agrupamentoId]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const path = `${agrupamentoId}/${Date.now()}-${f.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, f);
    if (error) { toast.error(error.message); return; }
    await supabase.from("documents").insert({
      agrupamento_id: agrupamentoId, file_path: path, file_name: f.name,
      mime_type: f.type, size_bytes: f.size, uploaded_by: user?.id,
    });
    toast.success("Documento enviado");
    load();
  };

  const download = async (p: string, name: string) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(p, 60);
    if (error) return toast.error(error.message);
    const a = document.createElement("a"); a.href = data.signedUrl; a.download = name; a.click();
  };

  const del = async (id: string, path: string) => {
    await supabase.storage.from("documents").remove([path]);
    await supabase.from("documents").delete().eq("id", id);
    load();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Documentos</h2>
        <label>
          <input type="file" hidden onChange={upload} />
          <Button asChild size="sm"><span><Upload className="h-4 w-4 mr-2" />Enviar</span></Button>
        </label>
      </div>
      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum documento.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-navy shrink-0" />
                <span className="truncate">{d.file_name}</span>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => download(d.file_path, d.file_name)}>
                  <Download className="h-4 w-4" />
                </Button>
                {(canManage || d.uploaded_by === user?.id) && (
                  <Button size="icon" variant="ghost" onClick={() => del(d.id, d.file_path)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function FotosTab({ agrupamentoId, canManage }: { agrupamentoId: string; canManage: boolean }) {
  const [fotos, setFotos] = useState<any[]>([]);
  const { user } = useAuth();

  const load = async () => {
    const { data } = await supabase.from("photos").select("*").eq("agrupamento_id", agrupamentoId).order("created_at", { ascending: false });
    setFotos(data ?? []);
  };
  useEffect(() => { load(); }, [agrupamentoId]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const path = `${agrupamentoId}/${Date.now()}-${f.name}`;
    const { error } = await supabase.storage.from("photos").upload(path, f);
    if (error) { toast.error(error.message); return; }
    await supabase.from("photos").insert({ agrupamento_id: agrupamentoId, file_path: path, uploaded_by: user?.id });
    toast.success("Foto enviada"); load();
  };

  const url = (p: string) => supabase.storage.from("photos").getPublicUrl(p).data.publicUrl;

  const del = async (id: string, path: string) => {
    await supabase.storage.from("photos").remove([path]);
    await supabase.from("photos").delete().eq("id", id);
    load();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Fotos</h2>
        <label>
          <input type="file" accept="image/*" hidden onChange={upload} />
          <Button asChild size="sm"><span><Upload className="h-4 w-4 mr-2" />Enviar foto</span></Button>
        </label>
      </div>
      {fotos.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Nenhuma foto.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {fotos.map((p) => (
            <div key={p.id} className="relative group aspect-square rounded-md overflow-hidden border">
              <img src={url(p.file_path)} className="w-full h-full object-cover" alt="" />
              {(canManage || p.uploaded_by === user?.id) && (
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
    </Card>
  );
}
