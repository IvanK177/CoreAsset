"use client";
import { useState, useTransition } from "react";
import { cn, formatDateTimeRu, BUILDING_ADDRESSES, extractJoinObject } from "@/lib/utils";
import { AlertTriangle, Clock, CheckCircle2, User, Building, Wrench, Loader2, Camera, Image as ImageIcon, X, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DecompressedText } from "@/components/shared/DecompressedText";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { takeRoomRequestToWork, resolveRoomRequest } from "@/lib/actions/facilities-portal";
import { toast } from "sonner";
import { TaskCalendar, CalendarTask } from "@/components/TaskCalendar";
import { calculateDeadline } from "@/lib/utils/sla";

interface RoomRequestRow {
  id: string;
  room: string;
  type: string;
  description: string;
  status: string;
  author_id: string;
  created_at: string;
  photo_urls?: string[] | null;
  resolution?: string | null;
  resolution_photo_urls?: string[] | null;
  assigned_to?: string | null;
  priority?: string;
  employee: {
    id: string;
    full_name: string;
    position: string | null;
    room: string | null;
    building: string | null;
  } | null;
  assignee?: { full_name: string | null } | { full_name: string | null }[] | null;
}

interface FacilitiesPortalClientViewProps {
  requests: RoomRequestRow[];
}

const statusLabels: Record<string, string> = {
  open: "Открыта",
  in_progress: "В работе",
  resolved: "Решена",
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const typeLabels: Record<string, string> = {
  ремонт: "Ремонт",
  оснащение: "Оснащение",
};

const typeColors: Record<string, string> = {
  ремонт: "bg-orange-50 text-orange-700 border-orange-200",
  оснащение: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

function getShortId(id: string) {
  return `#R${id.substring(0, 4).toUpperCase()}`;
}

function getMonthlyStats(requestsList: RoomRequestRow[], building: string) {
  const filtered = requestsList.filter(req => {
    if (building === "all") return true;
    return req.employee?.building === building;
  });

  const groups: Record<string, { monthKey: string; monthName: string; total: number; resolved: number; open: number; sortKey: string }> = {};

  filtered.forEach(req => {
    if (!req.created_at) return;
    const date = new Date(req.created_at);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    
    const monthNames = [
      "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
      "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ];
    const monthName = `${monthNames[month]} ${year}`;

    if (!groups[monthKey]) {
      groups[monthKey] = {
        monthKey,
        monthName,
        total: 0,
        resolved: 0,
        open: 0,
        sortKey: monthKey,
      };
    }

    groups[monthKey].total += 1;
    if (req.status === "resolved") {
      groups[monthKey].resolved += 1;
    } else {
      groups[monthKey].open += 1;
    }
  });

  return Object.values(groups).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

export default function FacilitiesPortalClientView({ requests }: FacilitiesPortalClientViewProps) {
  const [activeViewTab, setActiveViewTab] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [buildingFilter, setBuildingFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("facilities_building_filter") || "all";
    }
    return "all";
  });

  const handleBuildingChange = (val: string) => {
    setBuildingFilter(val);
    localStorage.setItem("facilities_building_filter", val);
  };

  const [selectedRequest, setSelectedRequest] = useState<RoomRequestRow | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  
  const [resolutionPhotos, setResolutionPhotos] = useState<File[]>([]);
  const [resolutionPhotoPreviews, setResolutionPhotoPreviews] = useState<string[]>([]);

  const handleResolutionPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setResolutionPhotos((prev) => [...prev, ...filesArray]);

      const previewsArray = filesArray.map((file) => URL.createObjectURL(file));
      setResolutionPhotoPreviews((prev) => [...prev, ...previewsArray]);
    }
  };

  const removeResolutionPhoto = (index: number) => {
    setResolutionPhotos((prev) => prev.filter((_, i) => i !== index));
    setResolutionPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleTakeToWork = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      const result = await takeRoomRequestToWork(id);
      if (result.error) {
        toast.error("Не удалось взять заявку в работу: " + result.error);
      } else {
        toast.success("Заявка взята в работу");
      }
      setPendingId(null);
    });
  };

  const handleResolveClick = (id: string) => {
    setResolvingRequestId(id);
    setResolutionText("");
    setResolutionPhotos([]);
    setResolutionPhotoPreviews([]);
    setResolveDialogOpen(true);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingRequestId) return;

    setResolveDialogOpen(false);
    setPendingId(resolvingRequestId);

    // Upload resolution photos if any
    const uploadedUrls: string[] = [];
    try {
      if (resolutionPhotos.length > 0) {
        const { compressImageToTarget } = await import("@/lib/image/compressImage");
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        for (const file of resolutionPhotos) {
          let fileToUpload = file;
          try {
            const compressionResult = await compressImageToTarget(file);
            fileToUpload = compressionResult.file;
            console.log(`Original: ${Math.round(file.size / 1024)}KB, Compressed: ${compressionResult.finalSizeKB}KB`);
          } catch (compressErr) {
            console.warn("Compression failed, using original:", compressErr);
          }

          const fileExt = fileToUpload.name.split(".").pop();
          const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto 
            ? crypto.randomUUID() 
            : `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
          const fileName = `${uuid}.${fileExt}`;
          const filePath = `resolutions/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from("ticket-attachments")
            .upload(filePath, fileToUpload, {
              contentType: fileToUpload.type,
              upsert: false,
            });

          if (uploadError) {
            toast.error(`Ошибка при загрузке фото ${file.name}`);
            setPendingId(null);
            return;
          }

          const { data: { publicUrl } } = supabase.storage
            .from("ticket-attachments")
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
        }
      }
    } catch (err) {
      console.error("Resolution photo upload exception:", err);
      toast.error("Не удалось загрузить фотографии выполненной работы");
      setPendingId(null);
      return;
    }

    startTransition(async () => {
      const result = await resolveRoomRequest(resolvingRequestId, resolutionText, uploadedUrls);
      if (result.error) {
        toast.error("Не удалось завершить заявку: " + result.error);
      } else {
        toast.success("Заявка успешно выполнена");
      }
      setPendingId(null);
      setResolvingRequestId(null);
      setResolutionText("");
      setResolutionPhotos([]);
      setResolutionPhotoPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
    });
  };

  const filteredRequests = requests.filter((req) => {
    // 1. Status Filter
    if (statusFilter !== "all") {
      if (statusFilter === "active" && req.status === "resolved") return false;
      if (statusFilter !== "active" && req.status !== statusFilter) return false;
    }
    // 2. Building Filter
    if (buildingFilter !== "all" && req.employee?.building !== buildingFilter) return false;
    return true;
  });

  const totalOpen = requests.filter((r) => r.status === "open").length;
  const totalInProgress = requests.filter((r) => r.status === "in_progress").length;
  const totalResolved = requests.filter((r) => r.status === "resolved").length;

  const stats = getMonthlyStats(requests, buildingFilter);

  if (selectedRequest) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Quick navigation list */}
          <div className="hidden lg:block w-full lg:w-1/3 space-y-3 bg-muted/30 p-3 rounded-xl border border-border/50 max-h-[600px] overflow-y-auto">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Заявки в списке</h3>
            {filteredRequests.map((req) => (
              <button
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all duration-150 flex flex-col gap-1 cursor-pointer bg-card",
                  selectedRequest.id === req.id
                    ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground font-mono">{getShortId(req.id)}</span>
                  <Badge variant="outline" className={cn("text-[10px] font-semibold", typeColors[req.type])}>
                    {typeLabels[req.type] || req.type}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[10px] font-medium", statusColors[req.status])}>
                    {statusLabels[req.status] || req.status}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground truncate">Кабинет {req.room}</p>
                <p className="text-xs text-muted-foreground truncate">{req.employee?.full_name ?? "—"}</p>
              </button>
            ))}
          </div>

          {/* Right: Detail panel */}
          <div className="w-full lg:w-2/3 rounded-xl bg-card border border-border shadow-sm p-4 md:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">{getShortId(selectedRequest.id)}</span>
                <Badge variant="outline" className={cn("text-xs font-semibold", typeColors[selectedRequest.type])}>
                  {typeLabels[selectedRequest.type] || selectedRequest.type}
                </Badge>
                <Badge variant="outline" className={cn("text-xs font-medium", statusColors[selectedRequest.status])}>
                  {statusLabels[selectedRequest.status] || selectedRequest.status}
                </Badge>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">Заявка АХЧ: Кабинет {selectedRequest.room}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Создана: {formatDateTimeRu(selectedRequest.created_at)}
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-xl border border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Описание</h4>
                <DecompressedText text={selectedRequest.description} className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Заявитель</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground/90">{selectedRequest.employee?.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{selectedRequest.employee?.position ?? "—"}</p>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Размещение</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground/90">Кабинет {selectedRequest.room}</p>
                    <p className="text-xs text-muted-foreground">{selectedRequest.employee?.building ?? "—"}</p>
                  </div>
                </div>
              </div>

              {/* Attached Photos */}
              {selectedRequest.photo_urls && selectedRequest.photo_urls.length > 0 && (
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Фотографии ({selectedRequest.photo_urls.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.photo_urls.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewImageUrl(url)}
                        className="relative w-20 h-20 rounded-lg overflow-hidden border border-border block hover:opacity-85 transition-opacity cursor-pointer focus:outline-none"
                      >
                        <img
                          src={url}
                          alt={`Вложение ${idx + 1}`}
                          className="object-cover w-full h-full"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution details */}
              {selectedRequest.status === "resolved" && (
                <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 space-y-2">
                  <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    Выполнение заявки
                  </h4>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    Заявка успешно выполнена.
                  </p>
                  {(() => {
                    const resolver = extractJoinObject(selectedRequest.assignee) as { full_name: string | null } | null;
                    if (resolver?.full_name) {
                      return (
                        <p className="text-xs text-muted-foreground">
                          Исполнитель: <span className="font-semibold text-foreground/90">{resolver.full_name}</span>
                        </p>
                      );
                    }
                    return null;
                  })()}
                  {selectedRequest.resolution && (
                    <div className="border-t border-emerald-500/20 pt-2 mt-2">
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Решение</p>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {selectedRequest.resolution}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Resolution Photos */}
              {selectedRequest.status === "resolved" && selectedRequest.resolution_photo_urls && selectedRequest.resolution_photo_urls.length > 0 && (
                <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 space-y-2">
                  <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    Фотоотчет выполненной работы ({selectedRequest.resolution_photo_urls.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.resolution_photo_urls.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewImageUrl(url)}
                        className="relative w-20 h-20 rounded-lg overflow-hidden border border-emerald-500/20 block hover:opacity-85 transition-opacity cursor-pointer focus:outline-none"
                      >
                        <img
                          src={url}
                          alt={`Решение ${idx + 1}`}
                          className="object-cover w-full h-full"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg h-9 text-sm"
              >
                Закрыть
              </Button>
              {selectedRequest.status === "open" && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9 text-sm cursor-pointer"
                  onClick={() => {
                    handleTakeToWork(selectedRequest.id);
                    setSelectedRequest(null);
                  }}
                >
                  Взять в работу
                </Button>
              )}
              {selectedRequest.status === "in_progress" && (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9 text-sm cursor-pointer"
                  onClick={() => {
                    handleResolveClick(selectedRequest.id);
                    setSelectedRequest(null);
                  }}
                >
                  Решено
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Photo Preview Dialog */}
        <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
          <DialogContent className="sm:max-w-3xl bg-transparent border-none shadow-none p-0 flex items-center justify-center">
            {previewImageUrl && (
              <div className="relative max-w-full max-h-[85vh] rounded-xl overflow-hidden bg-black/50 p-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(null)}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 text-white rounded-full p-2 cursor-pointer transition-colors z-50 focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
                <img
                  src={previewImageUrl}
                  alt="Просмотр изображения"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const unclosedRequests = requests.filter(
    (req) => req.status !== "resolved"
  );

  const calendarTasks: CalendarTask[] = unclosedRequests
    .filter((req) => {
      if (buildingFilter !== "all") {
        if (req.employee?.building !== buildingFilter) return false;
      }
      return true;
    })
    .map((req) => {
      return {
        id: req.id,
        title: `${typeLabels[req.type.toLowerCase()] || req.type}: Каб. ${req.room}`,
        description: req.description,
        status: req.status,
        priority: req.priority || "medium",
        created_at: req.created_at,
        deadline: calculateDeadline(req.created_at, req.priority || "medium"),
        type: "room_request" as const,
        room: req.room,
        employeeName: req.employee?.full_name ?? undefined,
      };
    });

  return (
    <div className="space-y-6">
      {/* ===== Header Banner ===== */}
      <div className="rounded-2xl bg-emerald-600 p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">Заявки АХЧ</h1>
            <p className="text-emerald-100 text-sm">
              Управление заявками на ремонт и оснащение кабинетов. Берите в работу и отмечайте выполнение.
            </p>
          </div>
          <div className="flex flex-row items-center justify-around sm:justify-end gap-4 sm:gap-6 border-t border-emerald-500/30 sm:border-t-0 pt-4 sm:pt-0 shrink-0">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-bold">{totalOpen}</span>
              <span className="text-emerald-200 text-xs">Открыто</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-bold">{totalInProgress}</span>
              <span className="text-emerald-200 text-xs">В работе</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-bold">{totalResolved}</span>
              <span className="text-emerald-200 text-xs">Выполнено</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs (List vs Calendar) */}
      <div className="flex border-b border-border mb-2">
        <button
          onClick={() => setActiveViewTab("list")}
          className={cn(
            "px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2",
            activeViewTab === "list"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          📋 Список заявок
        </button>
        <button
          onClick={() => setActiveViewTab("calendar")}
          className={cn(
            "px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2",
            activeViewTab === "calendar"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          📅 SLA Календарь
        </button>
      </div>

      {activeViewTab === "list" ? (
        <>
          {/* ===== Filters Bar ===== */}
          <div className="flex flex-wrap items-center gap-4">
        {/* Building Filter */}
        <div className="flex items-center gap-2 bg-card p-4 rounded-xl border border-border shadow-sm flex-1 min-w-[200px]">
          <Building className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Корпус:</span>
          <select
            value={buildingFilter}
            onChange={(e) => handleBuildingChange(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-emerald-500 focus:outline-none w-full truncate cursor-pointer"
          >
            <option value="all">Все корпуса</option>
            {Object.keys(BUILDING_ADDRESSES).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-card p-4 rounded-xl border border-border shadow-sm flex-1 min-w-[200px]">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-emerald-500 focus:outline-none w-full truncate cursor-pointer"
          >
            <option value="all">Все</option>
            <option value="open">Новые</option>
            <option value="in_progress">В работе</option>
            <option value="resolved">Решённые</option>
          </select>
        </div>
      </div>

      {/* ===== Ticket List & SLA statistics Side-by-Side ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: SLA Deadlines Card */}
        <div className="lg:col-span-3 space-y-4 self-start order-2 lg:order-1">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-foreground text-sm tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Сроки решения АХЧ
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Регламент выполнения заявок АХЧ по типам</p>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <span className="font-semibold text-orange-600 dark:text-orange-400">Ремонт</span>
                <span className="font-bold text-orange-700 dark:text-orange-300">3–5 дней</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Оснащение</span>
                <span className="font-bold text-indigo-700 dark:text-indigo-300">5–10 дней</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Ticket listing */}
        <div className="lg:col-span-6 order-1 lg:order-2">
          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl bg-card p-12 shadow-sm border border-border text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Заявок не найдено
              </h3>
              <p className="text-sm text-muted-foreground">
                Все заявки в данной категории обработаны. Отличная работа!
              </p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto pr-1 custom-scrollbar space-y-3">
              {filteredRequests.map((req) => {
                const isOpen = req.status === "open";
                const isInProgress = req.status === "in_progress";
                const isResolved = req.status === "resolved";
                const isActionPending = pendingId === req.id;

                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={cn(
                      "rounded-2xl bg-card p-5 shadow-sm border transition-all duration-150 cursor-pointer hover:shadow-md hover:border-muted-foreground/30",
                      isOpen ? "border-yellow-500/30" : isInProgress ? "border-blue-500/30" : "border-emerald-500/30"
                    )}
                  >
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Status Icon */}
                        <div
                          className={cn(
                            "flex items-center justify-center w-9 h-9 rounded-full shrink-0",
                            isOpen ? "bg-yellow-500/10" : isInProgress ? "bg-blue-500/10" : "bg-emerald-500/10"
                          )}
                        >
                          {isOpen ? (
                            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                          ) : isInProgress ? (
                            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>

                        {/* Text labels */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-mono text-muted-foreground">{getShortId(req.id)}</span>
                            <span className="font-semibold text-sm text-foreground truncate">
                              Кабинет {req.room}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-muted-foreground" />
                              {req.employee?.full_name ?? "—"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-muted-foreground" />
                              {req.employee?.building ?? "—"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Wrench className="w-3 h-3 text-muted-foreground" />
                              {typeLabels[req.type] || req.type}
                            </span>
                            <span>{formatDateTimeRu(req.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap pl-12 sm:pl-0">
                        <Badge variant="outline" className={cn("text-xs font-semibold", typeColors[req.type])}>
                          {typeLabels[req.type] || req.type}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs font-medium", statusColors[req.status])}>
                          {statusLabels[req.status] || req.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Description preview */}
                    {req.description && (
                      <p className="text-sm text-foreground/80 mb-3 line-clamp-2 pl-12">
                        <DecompressedText text={req.description} truncate={150} />
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pl-12">
                      {isOpen && (
                        <Button
                          size="sm"
                          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                          disabled={isActionPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTakeToWork(req.id);
                          }}
                        >
                          {isActionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                          Взять в работу
                        </Button>
                      )}
                      {isInProgress && (
                        <Button
                          size="sm"
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          disabled={isActionPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolveClick(req.id);
                          }}
                        >
                          {isActionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Решено
                        </Button>
                      )}
                      {isResolved && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium flex-wrap">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Выполнено</span>
                          {(() => {
                            const resolver = extractJoinObject(req.assignee) as { full_name: string | null } | null;
                            if (resolver?.full_name) {
                              return (
                                <>
                                  <span>·</span>
                                  <span>Исполнитель: {resolver.full_name}</span>
                                </>
                              );
                            }
                            return null;
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 3: Statistics Card */}
        <div className="lg:col-span-3 space-y-4 self-start order-3 lg:order-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-foreground text-sm tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Статистика по месяцам
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Показатели по корпусу: <span className="font-semibold text-emerald-600">{buildingFilter === "all" ? "Все корпуса" : buildingFilter}</span>
              </p>
            </div>

            {stats.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Нет данных</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {stats.map((row) => {
                  const resolutionRate = row.total > 0 ? Math.round((row.resolved / row.total) * 100) : 0;
                  return (
                    <div key={row.monthKey} className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                      <div className="flex justify-between items-center border-b border-border/50 pb-1.5">
                        <span className="font-bold text-sm text-foreground/95">{row.monthName}</span>
                        <span className="text-xs font-bold text-foreground bg-muted px-2.5 py-0.5 rounded-full">
                          {row.total} всего
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Выполнено: {row.resolved}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Активно: {row.open}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                          <span>Выполнение задач</span>
                          <span>{resolutionRate}%</span>
                        </div>
                        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                            style={{ width: `${resolutionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      ) : (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <TaskCalendar
            tasks={calendarTasks}
            onTaskClick={(id) => {
              const matched = requests.find((r) => r.id === id);
              if (matched) setSelectedRequest(matched);
            }}
          />
        </div>
      )}

      {/* Resolve Request Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Выполнение заявки АХЧ</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Укажите подробности выполненной работы
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResolveSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resolve-desc" className="text-xs font-bold text-muted-foreground uppercase">Описание решения *</Label>
              <Textarea
                id="resolve-desc"
                placeholder="Укажите, что именно было сделано..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                required
                rows={4}
                className="rounded-xl border-border"
              />
            </div>

            {/* Resolution Photos Attach */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-muted-foreground" />
                Прикрепить фото проделанной работы (опционально)
              </Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-center border border-dashed border-border rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleResolutionPhotoChange}
                    className="hidden"
                  />
                  <div className="text-center space-y-1">
                    <ImageIcon className="w-5 h-5 text-muted-foreground mx-auto" />
                    <span className="text-xs text-muted-foreground block">Нажмите для выбора фото решения</span>
                  </div>
                </label>

                {resolutionPhotoPreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {resolutionPhotoPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg border border-border overflow-hidden group">
                        <img src={preview} alt="Решение" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => removeResolutionPhoto(index)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 cursor-pointer transition-colors"
                          title="Удалить"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setResolveDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Выполнить
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-3xl mx-auto bg-transparent border-none shadow-none p-0 flex items-center justify-center">
          {previewImageUrl && (
            <div className="relative max-w-full max-h-[85vh] rounded-xl overflow-hidden bg-black/50 p-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 text-white rounded-full p-2 cursor-pointer transition-colors z-[100] focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={previewImageUrl}
                alt="Просмотр изображения"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
