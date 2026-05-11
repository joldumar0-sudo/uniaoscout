import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CARGOS, cargoLabel, cargoIcon, type Cargo } from "@/lib/cargos";
import { UserCog, UserPlus, Trash2, Crown, ShieldOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/membros")({ component: Membros });

function Membros() {
  const { isAdmin, isSuperAdmin, user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [ags, setAgs] = useState<any[]>([]);
  const [noms, setNoms] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [confirmExo, setConfirmExo] = useState<{ kind: "nom" | "admin"; id: string; label: string } | null>(null);
  const [openAdmin, setOpenAdmin] = useState(false);
  const [adminUserId, setAdminUserId] = useState("");
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [cargo, setCargo] = useState<Cargo>("padre");
  const [agId, setAgId] = useState<string>("");

  const load = async () => {
    const [{ data: p }, { data: a }, { data: n }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, agrupamento_id").order("full_name"),
      supabase.from("agrupamentos").select("id, numero, nome, paroquia").order("numero"),
      supabase.from("nominations").select("id, cargo, user_id, agrupamento_id").order("nominated_at", { ascending: false }),
      supabase.from("user_roles").select("id, user_id, role").eq("role", "admin"),
    ]);
    const profs = p ?? [];
    const withProf = (rows: any[]) => rows.map((row) => ({
      ...row,
      profiles: profs.find((x: any) => x.id === row.user_id) ?? null,
    }));
    setProfiles(profs); setAgs(a ?? []); setNoms(withProf(n ?? [])); setAdmins(withProf(r ?? []));
  };

  const updateAg = async (id: string, patch: { nome?: string; paroquia?: string }) => {
    const { error } = await supabase.from("agrupamentos").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Agrupamento atualizado"); load();
  };

  useEffect(() => { load(); }, []);

  if (!isAdmin) return <div className="p-8">Acesso restrito ao Administrador / Coordenador Provincial.</div>;

  const cargoMeta = CARGOS.find((c) => c.value === cargo);
  const needsAg = cargoMeta?.nivel === "agrupamento";

  const nomear = async () => {
    if (!userId) return toast.error("Escolha um membro");
    if (needsAg && !agId) return toast.error("Escolha um agrupamento");
    const { error } = await supabase.from("nominations").insert({
      user_id: userId, cargo, agrupamento_id: needsAg ? agId : null, nominated_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Nomeação registada");
    setOpen(false); setUserId(""); setAgId(""); load();
  };

  const updateProfileAg = async (pid: string, ag: string | null) => {
    const { error } = await supabase.from("profiles").update({ agrupamento_id: ag }).eq("id", pid);
    if (error) return toast.error(error.message);
    toast.success("Agrupamento atribuído"); load();
  };

  const grantAdmin = async () => {
    if (!adminUserId) return toast.error("Escolha um membro");
    const { error } = await supabase.from("user_roles").insert({ user_id: adminUserId, role: "admin" });
    if (error) return toast.error(error.message);
    toast.success("Administrador adicionado");
    setOpenAdmin(false); setAdminUserId(""); load();
  };

  const doExonerate = async () => {
    if (!confirmExo) return;
    const { kind, id } = confirmExo;
    const { error } = kind === "nom"
      ? await supabase.from("nominations").delete().eq("id", id)
      : await supabase.from("user_roles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Exoneração efetuada");
    setConfirmExo(null); load();
  };

  const agName = (id: string | null) => {
    if (!id) return "—";
    const a = ags.find((x) => x.id === id); return a ? `${String(a.numero).padStart(2, "0")} ${a.nome}` : "—";
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserCog className="h-8 w-8 text-primary" /> Membros & Cargos
          </h1>
          <p className="text-muted-foreground text-sm">Gestão centralizada de membros e nomeações</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><UserPlus className="h-4 w-4 mr-2" />Nomear cargo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nomear cargo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Membro</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger><SelectValue placeholder="Escolher..." /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cargo</Label>
                <Select value={cargo} onValueChange={(v) => setCargo(v as Cargo)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {CARGOS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {needsAg && (
                <div>
                  <Label>Agrupamento</Label>
                  <Select value={agId} onValueChange={setAgId}>
                    <SelectTrigger><SelectValue placeholder="Escolher..." /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {ags.map((a) => <SelectItem key={a.id} value={a.id}>{String(a.numero).padStart(2,"0")} - {a.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter><Button onClick={nomear}>Confirmar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="font-semibold mb-3">Agrupamentos · Nome & Paróquia ({ags.length})</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {ags.map((a) => (
            <div key={a.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded border">
              <div className="col-span-1 font-mono text-sm">{String(a.numero).padStart(2, "0")}</div>
              <Input className="col-span-5" defaultValue={a.nome} placeholder="Nome do agrupamento"
                onBlur={(e) => e.target.value !== a.nome && updateAg(a.id, { nome: e.target.value })} />
              <Input className="col-span-6" defaultValue={a.paroquia ?? ""} placeholder="Paróquia"
                onBlur={(e) => e.target.value !== (a.paroquia ?? "") && updateAg(a.id, { paroquia: e.target.value })} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="font-semibold mb-3">Membros ({profiles.length})</h2>
        <div className="space-y-2">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded border">
              <div className="min-w-0">
                <div className="font-medium truncate">{p.full_name ?? "(sem nome)"}</div>
                <div className="text-xs text-muted-foreground truncate">{p.email}</div>
              </div>
              <Select value={p.agrupamento_id ?? "none"} onValueChange={(v) => updateProfileAg(p.id, v === "none" ? null : v)}>
                <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">— Sem agrupamento —</SelectItem>
                  {ags.map((a) => <SelectItem key={a.id} value={a.id}>{String(a.numero).padStart(2,"0")} - {a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </Card>

      {isSuperAdmin && (
        <Card className="p-6 mb-6 border-primary/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" /> Administradores ({admins.length})
            </h2>
            <Dialog open={openAdmin} onOpenChange={setOpenAdmin}>
              <DialogTrigger asChild>
                <Button size="sm"><UserPlus className="h-4 w-4 mr-2" />Adicionar admin</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Adicionar Administrador</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Label>Membro</Label>
                  <Select value={adminUserId} onValueChange={setAdminUserId}>
                    <SelectTrigger><SelectValue placeholder="Escolher..." /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {profiles.filter((p) => !admins.some((a) => a.user_id === p.id))
                        .map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter><Button onClick={grantAdmin}>Confirmar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            O Administrador é uma categoria independente do Coordenador Provincial. Apenas Administradores podem nomear ou exonerar outros Administradores.
          </p>
          <div className="space-y-2">
            {admins.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded border">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-primary/10 text-primary flex items-center justify-center">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{r.profiles?.full_name ?? r.profiles?.email}</div>
                    <div className="text-xs text-muted-foreground">Administrador</div>
                  </div>
                </div>
                {r.user_id !== user?.id && (
                  <Button size="sm" variant="outline" onClick={() => setConfirmExo({ kind: "admin", id: r.id, label: `Administrador · ${r.profiles?.full_name ?? r.profiles?.email}` })}>
                    <ShieldOff className="h-4 w-4 mr-2" />Exonerar
                  </Button>
                )}
              </div>
            ))}
            {admins.length === 0 && <p className="text-sm text-muted-foreground">Nenhum administrador.</p>}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="font-semibold mb-3">Todas as Nomeações ({noms.length})</h2>
        <div className="space-y-2">
          {noms.map((n: any) => {
            const Icon = cargoIcon(n.cargo);
            return (
              <div key={n.id} className="flex items-center justify-between p-3 rounded border">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{n.profiles?.full_name ?? n.profiles?.email}</div>
                    <div className="text-xs text-muted-foreground">{cargoLabel(n.cargo)} · {agName(n.agrupamento_id)}</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setConfirmExo({ kind: "nom", id: n.id, label: `${cargoLabel(n.cargo)} · ${n.profiles?.full_name ?? n.profiles?.email}` })}>
                  <ShieldOff className="h-4 w-4 mr-2" />Exonerar
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      <AlertDialog open={!!confirmExo} onOpenChange={(o) => !o && setConfirmExo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exoneração</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que pretende exonerar: <strong>{confirmExo?.label}</strong>? Esta ação remove o cargo do membro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={doExonerate}>Exonerar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
