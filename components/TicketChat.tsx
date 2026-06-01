"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/actions/messages";
import { Send, Loader2 } from "lucide-react";
import { formatDateTimeRu } from "@/lib/utils";

interface SenderInfo {
  full_name: string;
}

export interface Message {
  id: string;
  incident_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  sender?: SenderInfo | SenderInfo[] | null;
}

interface TicketChatProps {
  incidentId: string;
  currentUserId: string;
  initialMessages: Message[];
}

export function TicketChat({ incidentId, currentUserId, initialMessages }: TicketChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Store sender names cache in state to comply with React rules of render
  const [senderNames, setSenderNames] = useState<Record<string, string>>(() => {
    const initialCache: Record<string, string> = {};
    initialMessages.forEach((msg) => {
      if (msg.sender) {
        const extracted = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
        if (extracted?.full_name) {
          initialCache[msg.sender_id] = extracted.full_name;
        }
      }
    });
    return initialCache;
  });

  // Autoscroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Supabase Realtime Subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`incident-chat-${incidentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "incident_messages",
          filter: `incident_id=eq.${incidentId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Omit<Message, "sender">;
          
          // If message is already in state, ignore it
          if (messages.some((m) => m.id === newMsg.id)) return;

          // Fetch sender name if not in state cache
          let senderName = senderNames[newMsg.sender_id];
          if (!senderName) {
            const { data } = await supabase
              .from("employees")
              .select("full_name")
              .eq("id", newMsg.sender_id)
              .single();
            senderName = data?.full_name ?? "Пользователь";
            setSenderNames((prev) => ({ ...prev, [newMsg.sender_id]: senderName }));
          }

          const completeMsg: Message = {
            ...newMsg,
            sender: { full_name: senderName },
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === completeMsg.id)) return prev;
            return [...prev, completeMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [incidentId, messages, senderNames]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setSending(true);

    const res = await sendMessage(incidentId, textToSend);
    if (res && res.error) {
      alert(res.error);
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[400px] border border-gray-100 rounded-xl bg-white shadow-inner-sm overflow-hidden">
      {/* Messages Header */}
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Чат по инциденту</span>
        <span className="text-[10px] text-gray-400 bg-gray-200/50 px-2 py-0.5 rounded-full">
          {messages.length} сообщ.
        </span>
      </div>

      {/* Messages List */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Нет сообщений. Напишите первое сообщение!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            const senderName = senderNames[msg.sender_id] ?? "Отправитель";
            
            return (
              <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && (
                  <span className="text-[10px] font-semibold text-gray-400 mb-0.5 ml-1">
                    {senderName}
                  </span>
                )}
                <div
                  className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                    isOwn
                      ? "bg-blue-500 text-white rounded-tr-none"
                      : "bg-gray-100 text-gray-800 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      isOwn ? "text-blue-100" : "text-gray-400"
                    }`}
                  >
                    {formatDateTimeRu(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="border-t border-gray-100 p-2 bg-gray-50 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Напишите сообщение..."
          className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !inputText.trim()}
          className="h-8 w-8 shrink-0 flex items-center justify-center bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors cursor-pointer"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
