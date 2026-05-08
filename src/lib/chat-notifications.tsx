import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";

type Ctx = {
  unread: number;
  unreadProvincial: number;
  unreadAgrupamento: number;
  clear: (scope?: "provincial" | "agrupamento") => void;
  permission: NotificationPermission | "unsupported";
  requestPermission: () => Promise<void>;
};

const ChatNotificationsCtx = createContext<Ctx | null>(null);

export function ChatNotificationsProvider({ children }: { children: ReactNode }) {
  const { user, profile, isAdmin } = useAuth();
  const loc = useLocation();
  const [unreadProv, setUnreadProv] = useState(0);
  const [unreadAg, setUnreadAg] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  const onChatRef = useRef(false);
  onChatRef.current = loc.pathname.startsWith("/chat");

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setPermission(p);
  };

  const notify = (title: string, body: string) => {
    toast(title, { description: body });
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(title, { body, icon: "/favicon.ico" }); } catch { /* noop */ }
    }
  };

  useEffect(() => {
    if (!user) return;
    const agId = profile?.agrupamento_id ?? null;
    const channel = supabase
      .channel(`chat-notify-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, async (payload: any) => {
        const m = payload.new;
        if (m.user_id === user.id) return;

        // Filter by what the user can see
        if (m.scope === "provincial") {
          // everyone authenticated can see
        } else if (m.scope === "agrupamento") {
          if (!isAdmin && m.agrupamento_id !== agId) return;
        } else return;

        // If currently viewing chat, don't increment / notify
        if (onChatRef.current) return;

        const { data: prof } = await supabase
          .from("profiles").select("full_name, email").eq("id", m.user_id).maybeSingle();
        const who = prof?.full_name || prof?.email || "Alguém";
        const title = m.scope === "provincial" ? "Nova mensagem (Provincial)" : "Nova mensagem (Agrupamento)";
        notify(title, `${who}: ${String(m.content).slice(0, 120)}`);

        if (m.scope === "provincial") setUnreadProv((n) => n + 1);
        else setUnreadAg((n) => n + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, profile?.agrupamento_id, isAdmin]);

  // Auto-clear when navigating to chat
  useEffect(() => {
    if (loc.pathname.startsWith("/chat")) {
      setUnreadProv(0); setUnreadAg(0);
    }
  }, [loc.pathname]);

  const clear = (scope?: "provincial" | "agrupamento") => {
    if (!scope || scope === "provincial") setUnreadProv(0);
    if (!scope || scope === "agrupamento") setUnreadAg(0);
  };

  return (
    <ChatNotificationsCtx.Provider
      value={{
        unread: unreadProv + unreadAg,
        unreadProvincial: unreadProv,
        unreadAgrupamento: unreadAg,
        clear, permission, requestPermission,
      }}
    >
      {children}
    </ChatNotificationsCtx.Provider>
  );
}

export function useChatNotifications() {
  const v = useContext(ChatNotificationsCtx);
  if (!v) throw new Error("useChatNotifications must be used inside ChatNotificationsProvider");
  return v;
}
