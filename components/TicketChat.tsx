"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/actions/messages";
import { Send, Loader2, Camera, X, Image as ImageIcon } from "lucide-react";
import { formatDateTimeRu } from "@/lib/utils";
import { toast } from "sonner";

interface SenderInfo {
  full_name: string;
  avatar_url?: string | null;
}

export interface Message {
  id: string;
  incident_id: string;
  sender_id: string | null;
  text: string;
  created_at: string;
  sender?: SenderInfo | SenderInfo[] | null;
  photo_urls?: string[] | null;
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
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);
  
  // Store sender details cache in state to comply with React rules of render
  const [senderDetails, setSenderDetails] = useState<Record<string, { name: string; avatarUrl: string | null }>>(() => {
    const initialCache: Record<string, { name: string; avatarUrl: string | null }> = {};
    initialMessages.forEach((msg) => {
      if (msg.sender && msg.sender_id) {
        const extracted = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
        if (extracted?.full_name) {
          initialCache[msg.sender_id] = {
            name: extracted.full_name,
            avatarUrl: extracted.avatar_url ?? null,
          };
        }
      }
    });
    return initialCache;
  });

  // Ensure current user details are loaded in the cache
  useEffect(() => {
    if (!currentUserId) return;
    
    const fetchCurrentUserDetails = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("employees")
        .select("full_name, avatar_url")
        .eq("id", currentUserId)
        .single();
        
      if (data) {
        setSenderDetails((prev) => {
          if (prev[currentUserId]) return prev;
          return {
            ...prev,
            [currentUserId]: {
              name: data.full_name,
              avatarUrl: data.avatar_url ?? null,
            },
          };
        });
      }
    };
    
    fetchCurrentUserDetails();
  }, [currentUserId]);

  // Sync state with parent's initialMessages when they update (e.g. from Server Actions revalidatePath)
  useEffect(() => {
    setMessages((prev) => {
      // Keep optimistic messages that are not yet in initialMessages
      const pendingOptimistic = prev.filter((m) => {
        if (!m.id.startsWith("temp-")) return false;
        
        // Match by text and sender
        const matched = initialMessages.some(
          (real) => real.sender_id === m.sender_id && real.text === m.text
        );
        return !matched;
      });
      
      return [...initialMessages, ...pendingOptimistic].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    // Also update senderDetails cache with any new senders
    const updatedCache = { ...senderDetails };
    let hasNewSenders = false;
    initialMessages.forEach((msg) => {
      if (msg.sender && msg.sender_id && !updatedCache[msg.sender_id]) {
        const extracted = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
        if (extracted?.full_name) {
          updatedCache[msg.sender_id] = {
            name: extracted.full_name,
            avatarUrl: extracted.avatar_url ?? null,
          };
          hasNewSenders = true;
        }
      }
    });
    if (hasNewSenders) {
      setSenderDetails(updatedCache);
    }
  }, [initialMessages]);

  // Autoscroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Refs to keep subscription callback updated without resetting the Supabase channel
  const messagesRef = useRef<Message[]>(messages);
  const senderDetailsRef = useRef<Record<string, { name: string; avatarUrl: string | null }>>(senderDetails);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    senderDetailsRef.current = senderDetails;
  }, [senderDetails]);

  // Supabase Realtime Subscription with Polling Fallback
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();
    let channel: any = null;
    let pollingInterval: NodeJS.Timeout | null = null;

    const setupPolling = () => {
      if (pollingInterval) clearInterval(pollingInterval);
      
      pollingInterval = setInterval(async () => {
        const { data, error } = await supabase
          .from("incident_messages")
          .select("*, sender:employees!incident_messages_sender_id_fkey(full_name, avatar_url)")
          .eq("incident_id", incidentId)
          .order("created_at", { ascending: true });

        if (!error && isMounted && data) {
          // Sync sender details cache
          const updatedCache = { ...senderDetailsRef.current };
          let hasNewSenders = false;
          data.forEach((msg: any) => {
            if (msg.sender && msg.sender_id && !updatedCache[msg.sender_id]) {
              const extracted = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
              if (extracted?.full_name) {
                updatedCache[msg.sender_id] = {
                  name: extracted.full_name,
                  avatarUrl: extracted.avatar_url ?? null,
                };
                hasNewSenders = true;
              }
            }
          });
          if (hasNewSenders) {
            setSenderDetails(updatedCache);
          }

          setMessages((prev) => {
            // Keep optimistic messages that are not yet in the loaded list
            const pendingOptimistic = prev.filter((m) => {
              if (!m.id.startsWith("temp-")) return false;
              const matched = data.some(
                (real: any) => real.sender_id === m.sender_id && real.text === m.text
              );
              return !matched;
            });

            // Map and format incoming data to match local structure
            const formatted = data.map((d: any) => ({
              ...d,
              sender: d.sender ? {
                full_name: d.sender.full_name,
                avatar_url: d.sender.avatar_url,
              } : null
            }));

            return [...formatted, ...pendingOptimistic].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        }
      }, 5000);
    };

    const setupRealtime = () => {
      channel = supabase
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
            if (messagesRef.current.some((m) => m.id === newMsg.id)) return;

            // Fetch sender details if not in state cache
            let senderInfo = newMsg.sender_id ? senderDetailsRef.current[newMsg.sender_id] : null;
            if (!senderInfo && newMsg.sender_id) {
              const { data } = (await supabase
                .from("employees")
                .select("full_name, avatar_url")
                .eq("id", newMsg.sender_id as string)
                .single()) as any;
              senderInfo = {
                name: data?.full_name ?? "Пользователь",
                avatarUrl: data?.avatar_url ?? null,
              };
              setSenderDetails((prev) => ({ ...prev, [newMsg.sender_id!]: senderInfo! }));
            }

            const completeMsg: Message = {
              ...newMsg,
              sender: senderInfo
                ? {
                    full_name: senderInfo.name,
                    avatar_url: senderInfo.avatarUrl,
                  }
                : null,
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === completeMsg.id)) return prev;
              
              // Remove optimistic message that matches this new message's text and sender
              const filtered = prev.filter(
                (m) =>
                  !(
                    m.id.startsWith("temp-") &&
                    m.sender_id === completeMsg.sender_id &&
                    m.text === completeMsg.text
                  )
              );
              return [...filtered, completeMsg];
            });
          }
        )
        .subscribe((status) => {
          console.log(`Realtime status for incident ${incidentId}:`, status);
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("WebSocket blocked or error, switching to polling fallback");
            setupPolling();
          }
        });
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [incidentId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...selectedFiles]);
      const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = inputText.trim();
    const hasText = !!textToSend;
    const hasPhotos = photos.length > 0;

    if ((!hasText && !hasPhotos) || sending) return;

    // Save inputs in case of error rollback
    const originalPhotos = [...photos];
    const originalPreviews = [...photoPreviews];
    const originalInputText = inputText;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      incident_id: incidentId,
      sender_id: currentUserId,
      text: textToSend,
      created_at: new Date().toISOString(),
      sender: {
        full_name: senderDetails[currentUserId]?.name ?? "Отправка...",
        avatar_url: senderDetails[currentUserId]?.avatarUrl ?? null,
      },
      photo_urls: [...photoPreviews],
    };

    setMessages((prev) => [...prev, tempMessage]);
    setPhotos([]);
    setPhotoPreviews([]);
    setInputText("");
    setSending(true);

    const uploadedPhotoUrls: string[] = [];

    if (hasPhotos) {
      try {
        const { compressImageToTarget } = await import("@/lib/image/compressImage");
        const supabase = createClient();

        for (const file of originalPhotos) {
          let fileToUpload = file;
          try {
            const compressionResult = await compressImageToTarget(file);
            fileToUpload = compressionResult.file;
          } catch (compressErr) {
            console.warn("Compression failed, using original:", compressErr);
          }

          const fileExt = fileToUpload.name.split(".").pop();
          const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto 
            ? crypto.randomUUID() 
            : `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
          const fileName = `${uuid}.${fileExt}`;
          const filePath = `chat/${incidentId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("ticket-attachments")
            .upload(filePath, fileToUpload, {
              contentType: fileToUpload.type,
              upsert: true,
            });

          if (uploadError) {
            console.error("Chat photo upload error:", uploadError);
            toast.error(`Ошибка при загрузке фото ${file.name}`);
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            setPhotos(originalPhotos);
            setPhotoPreviews(originalPreviews);
            setInputText(originalInputText);
            setSending(false);
            return;
          }

          const { data: { publicUrl } } = supabase.storage
            .from("ticket-attachments")
            .getPublicUrl(filePath);

          uploadedPhotoUrls.push(publicUrl);
        }
      } catch (err) {
        console.error("Chat attachment upload exception:", err);
        toast.error("Не удалось загрузить фотографии в чат");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setPhotos(originalPhotos);
        setPhotoPreviews(originalPreviews);
        setInputText(originalInputText);
        setSending(false);
        return;
      }
    }

    try {
      const res = await sendMessage(incidentId, textToSend, uploadedPhotoUrls);
      if (res && res.error) {
        toast.error(res.error);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setPhotos(originalPhotos);
        setPhotoPreviews(originalPreviews);
        setInputText(originalInputText);
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, photo_urls: uploadedPhotoUrls } : m
          )
        );
      }
    } catch (sendErr) {
      console.error("Chat send message exception:", sendErr);
      toast.error("Не удалось отправить сообщение");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setPhotos(originalPhotos);
      setPhotoPreviews(originalPreviews);
      setInputText(originalInputText);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px] border border-border rounded-xl bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Messages Header */}
      <div className="bg-muted/50 border-b border-border px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Чат по инциденту</span>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {messages.length} сообщ.
        </span>
      </div>

      {/* Messages List */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Нет сообщений. Напишите первое сообщение!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            const senderInfo = msg.sender_id ? senderDetails[msg.sender_id] : null;
            const senderName = senderInfo?.name ?? (msg.sender_id ? "Сотрудник" : "Бывший сотрудник");
            
            return (
              <div key={msg.id} className={`flex items-start gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-muted shrink-0 overflow-hidden flex items-center justify-center border border-border">
                  {senderInfo?.avatarUrl ? (
                    <img src={senderInfo.avatarUrl} alt={senderName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {senderName.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Message Bubble Column */}
                <div className={`flex flex-col max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                  {!isOwn && (
                    <span className="text-[10px] font-semibold text-muted-foreground mb-0.5 ml-1">
                      {senderName}
                    </span>
                  )}
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-sm ${
                      isOwn
                        ? "bg-blue-500 text-white rounded-tr-none"
                        : "bg-muted text-foreground rounded-tl-none"
                    }`}
                  >
                    {msg.text && (
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                    )}
                    {msg.photo_urls && msg.photo_urls.length > 0 && (
                      <div className={`mt-1.5 flex flex-wrap gap-1.5 ${isOwn ? "justify-end" : "justify-start"}`}>
                        {msg.photo_urls.map((url, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setPreviewImageUrl(url)}
                            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden border border-border/30 cursor-pointer hover:opacity-90 transition-opacity bg-card"
                          >
                            <img src={url} alt={`Вложение ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    <span
                      className={`block text-[9px] mt-1 text-right ${
                        isOwn ? "text-blue-100" : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {formatDateTimeRu(msg.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Photos Preview */}
      {photoPreviews.length > 0 && (
        <div className="border-t border-border p-2 bg-muted/20 flex flex-wrap gap-2">
          {photoPreviews.map((preview, index) => (
            <div key={index} className="relative w-14 h-14 rounded-lg border border-border overflow-hidden bg-card shrink-0">
              <img src={preview} alt="Превью" className="object-cover w-full h-full" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-black/90 text-white rounded-full p-0.5 cursor-pointer transition-colors"
                title="Удалить"
                disabled={sending}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="border-t border-border p-2 bg-muted/30 flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoChange}
          multiple
          accept="image/*"
          className="hidden"
          disabled={sending}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="h-8 w-8 shrink-0 flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          title="Прикрепить фото"
        >
          <Camera className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Напишите сообщение..."
          className="flex-1 px-3 py-1.5 text-sm bg-background border border-input text-foreground rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || (!inputText.trim() && photos.length === 0)}
          className="h-8 w-8 shrink-0 flex items-center justify-center bg-blue-500 hover:bg-blue-600 disabled:bg-muted disabled:text-muted-foreground text-white rounded-lg transition-colors cursor-pointer"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      {/* Photo Preview Overlay */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 text-white rounded-full p-2 cursor-pointer transition-colors z-50 focus:outline-none"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-full max-h-[90vh] rounded-xl overflow-hidden bg-black/50 p-1 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImageUrl}
              alt="Просмотр изображения"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
