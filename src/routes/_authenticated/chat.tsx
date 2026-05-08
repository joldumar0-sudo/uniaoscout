import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Send, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat")({ component: Chat });

function Chat() {
  const { profile, isAdmin } = useAuth();
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
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let q = supabase.from("chat_messages")
      .select("id, content, user_id, created_at, scope, agrupamento_id, profiles:profiles!chat_messages_user_id_fkey(full_name, email)")
      .eq("scope", scope)
      .order("created_at", { ascending: true })
      .limit(200);
    if (scope === "agrupamento" && agrupamentoId) q = q.eq("agrupamento_id", agrupamentoId);
    q.then(({ data }) => setMsgs(data ?? []));

    const channel = supabase.channel(`chat-${scope}-${agrupamentoId ?? "g"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, async (payload: any) => {
        const m = payload.new;
        if (m.scope !== scope) return;
        if (scope === "agrupamento" && m.agrupamento_id !== agrupamentoId) return;
        const { data } = await supabase.from("profiles").select("full_name, email").eq("id", m.user_id).maybeSingle();
        setMsgs((prev) => [...prev, { ...m, profiles: data }]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [scope, agrupamentoId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async () => {
    if (!text.trim() || !user) return;
    const payload: any = { content: text.trim(), user_id: user.id, scope };
    if (scope === "agrupamento") payload.agrupamento_id = agrupamentoId;
    const { error } = await supabase.from("chat_messages").insert(payload);
    if (!error) setText("");
  };

  return (
    <Card className="flex flex-col h-[60vh] mt-4">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Sem mensagens ainda. Inicie a conversa!</p>}
        {msgs.map((m) => {
          const mine = m.user_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {!mine && <div className="text-[10px] opacity-70 mb-0.5">{m.profiles?.full_name ?? m.profiles?.email}</div>}
                <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t p-3 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva uma mensagem..." />
        <Button type="submit"><Send className="h-4 w-4" /></Button>
      </form>
    </Card>
  );
}
