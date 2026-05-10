import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Send, MessageSquare, Paperclip, Mic, Square, Trash2, FileIcon, Download } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/chat")({ component: Chat });

function Chat() {
  const { profile } = useAuth();
  const hasAg = !!profile?.agrupamento_id;
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto h-full flex flex-col">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="h-7 w-7 text-primary" /> Chat
      </h1>
      <Tabs defaultValue={hasAg ? "ag" : "prov"} className="flex-1 flex flex-col">
        <TabsList>
          {hasAg && <TabsTrigger value="ag">Meu Agrupamento</TabsTrigger>}
          <TabsTrigger value="prov">Provincial</TabsTrigger>
        </TabsList>
        {hasAg && (
          <TabsContent value="ag" className="flex-1">
            <ChatRoom scope="agrupamento" agrupamentoId={profile!.agrupamento_id!} />
          </TabsContent>
        )}
        <TabsContent value="prov" className="flex-1">
          <ChatRoom scope="provincial" agrupamentoId={null} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChatRoom({ scope, agrupamentoId }: { scope: "provincial" | "agrupamento"; agrupamentoId: string | null }) {
  const { user, isAdmin } = useAuth();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let q = supabase.from("chat_messages")
      .select("id, content, user_id, created_at, scope, agrupamento_id, attachment_url, attachment_type, attachment_name, profiles:profiles!chat_messages_user_id_profile_fkey(full_name, email)")
      .eq("scope", scope)
      .order("created_at", { ascending: true })
      .limit(500);
    if (scope === "agrupamento" && agrupamentoId) q = q.eq("agrupamento_id", agrupamentoId);
    q.then(({ data }) => setMsgs(data ?? []));

    const channel = supabase.channel(`chat-${scope}-${agrupamentoId ?? "g"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, async (payload: any) => {
        const m = payload.new;
        if (m.scope !== scope) return;
        if (scope === "agrupamento" && m.agrupamento_id !== agrupamentoId) return;
        const { data } = await supabase.from("profiles").select("full_name, email").eq("id", m.user_id).maybeSingle();
        setMsgs((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, { ...m, profiles: data }]);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (payload: any) => {
        setMsgs((prev) => prev.filter((m) => m.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [scope, agrupamentoId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const sendMessage = async (extra: Partial<any> = {}) => {
    if (!user) return;
    const payload: any = { user_id: user.id, scope, content: text.trim() || null, ...extra };
    if (scope === "agrupamento") payload.agrupamento_id = agrupamentoId;
    const { error } = await supabase.from("chat_messages").insert(payload);
    if (error) { toast.error(error.message); return; }
    setText("");
  };

  const send = async () => {
    if (!text.trim()) return;
    await sendMessage();
  };

  const uploadAndSend = async (file: Blob, name: string, type: "image" | "audio" | "file") => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = name.includes(".") ? name.split(".").pop() : (type === "audio" ? "webm" : "bin");
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("chat-attachments").upload(path, file, {
        contentType: file.type || undefined,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("chat-attachments").getPublicUrl(path);
      await sendMessage({ attachment_url: data.publicUrl, attachment_type: type, attachment_name: name });
    } catch (e: any) {
      toast.error(e.message || "Falha ao enviar anexo");
    } finally {
      setUploading(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const type: "image" | "audio" | "file" = f.type.startsWith("image/") ? "image" : f.type.startsWith("audio/") ? "audio" : "file";
    await uploadAndSend(f, f.name, type);
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        await uploadAndSend(blob, `audio-${Date.now()}.webm`, "audio");
      };
      mr.start();
      recRef.current = mr;
      setRecording(true);
    } catch {
      toast.error("Não foi possível aceder ao microfone");
    }
  };

  const stopRec = () => {
    recRef.current?.stop();
    recRef.current = null;
    setRecording(false);
  };

  const deleteMsg = async (id: string) => {
    const { error } = await supabase.from("chat_messages").delete().eq("id", id);
    if (error) toast.error(error.message);
    else setMsgs((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <Card className="flex flex-col h-[60vh] mt-4">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Sem mensagens ainda. Inicie a conversa!</p>}
        {msgs.map((m) => {
          const mine = m.user_id === user?.id;
          const canDelete = mine || isAdmin;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"} group`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {!mine && <div className="text-[10px] opacity-70 mb-0.5">{m.profiles?.full_name ?? m.profiles?.email}</div>}
                {m.attachment_url && m.attachment_type === "image" && (
                  <a href={m.attachment_url} target="_blank" rel="noreferrer">
                    <img src={m.attachment_url} alt={m.attachment_name ?? ""} className="rounded-lg max-h-64 mb-1" />
                  </a>
                )}
                {m.attachment_url && m.attachment_type === "audio" && (
                  <audio src={m.attachment_url} controls className="max-w-full mb-1" />
                )}
                {m.attachment_url && m.attachment_type === "file" && (
                  <a href={m.attachment_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm underline mb-1">
                    <FileIcon className="h-4 w-4" /> {m.attachment_name ?? "Ficheiro"} <Download className="h-3 w-3" />
                  </a>
                )}
                {m.content && <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>}
                {canDelete && (
                  <button onClick={() => deleteMsg(m.id)}
                    className="opacity-0 group-hover:opacity-70 hover:!opacity-100 text-[10px] mt-1 inline-flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> Eliminar
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t p-3 flex gap-2 items-center">
        <input ref={fileRef} type="file" hidden onChange={onFile}
          accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" />
        <Button type="button" size="icon" variant="ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant={recording ? "destructive" : "ghost"}
          onClick={recording ? stopRec : startRec} disabled={uploading}>
          {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Input value={text} onChange={(e) => setText(e.target.value)}
          placeholder={uploading ? "A enviar anexo..." : recording ? "A gravar áudio..." : "Escreva uma mensagem..."}
          disabled={uploading || recording} />
        <Button type="submit" disabled={uploading || recording || !text.trim()}><Send className="h-4 w-4" /></Button>
      </form>
    </Card>
  );
}
