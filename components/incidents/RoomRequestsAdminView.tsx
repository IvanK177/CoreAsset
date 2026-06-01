"use client";

import { useState } from "react";
import { cn, formatDateTimeRu, BUILDING_ADDRESSES } from "@/lib/utils";
import { AlertTriangle, Clock, CheckCircle2, User, Building, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DecompressedText } from "@/components/shared/DecompressedText";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  employee: {
    id: string;
    full_name: string;
    position: string | null;
    room: string | null;
    building: string | null;
  } | null;
}

interface RoomRequestsAdminViewProps {
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

const tabs = [
  { value: "active", label: "Активные" },
  { value: "open", label: "Открытые" },
  { value: "in_progress", label: "В работе" },
  { value: "resolved", label: "Выполненные" },
];

export function RoomRequestsAdminView({ requests }: RoomRequestsAdminViewProps) {
  const [activeTab, setActiveTab] = useState<string>("active");
  const [buildingFilter, setBuildingFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<RoomRequestRow | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const filteredRequests = requests.filter((req) => {
    const matchesStatus =
      activeTab === "active" ? req.status !== "resolved" : req.status === activeTab;
    const matchesBuilding = buildingFilter === "all" || req.employee?.building === buildingFilter;
    return matchesStatus && matchesBuilding;
  });

  const getCounts = (tabValue: string) => {
    const filteredByBuilding = requests.filter(
      (req) => buildingFilter === "all" || req.employee?.building === buildingFilter
    );
    if (tabValue === "active") return filteredByBuilding.filter((r) => r.status !== "resolved").length;
    if (tabValue === "open") return filteredByBuilding.filter((r) => r.status === "open").length;
    if (tabValue === "in_progress") return filteredByBuilding.filter((r) => r.status === "in_progress").length;
    if (tabValue === "resolved") return filteredByBuilding.filter((r) => r.status === "resolved").length;
    return 0;
  };

  const getShortId = (id: string) => {
    return `#R${id.substring(0, 4).toUpperCase()}`;
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 overflow-x-auto max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 whitespace-nowrap cursor-pointer",
                activeTab === tab.value
                  ? "bg-[#2563eb] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {tab.label} {getCounts(tab.value)}
            </button>
          ))}
        </div>

        {/* Building Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Корпус:</span>
          <Select value={buildingFilter} onValueChange={(val) => setBuildingFilter(val ?? "all")}>
            <SelectTrigger className="w-[200px] h-9 bg-white text-xs">
              <SelectValue placeholder="Все корпуса" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все корпуса</SelectItem>
              {Object.keys(BUILDING_ADDRESSES).map((building) => (
                <SelectItem key={building} value={building}>
                  {building}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests List */}
      <div className="max-h-[600px] overflow-y-auto pr-1 custom-scrollbar space-y-2">
        {filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-gray-500 bg-white border border-gray-100 rounded-2xl">
            <AlertTriangle className="w-10 h-10 mx-auto opacity-40 mb-3" />
            <p className="text-sm">Заявок АХЧ не найдено</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isOpen = req.status === "open";
            const isInProgress = req.status === "in_progress";

            return (
              <button
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer text-left"
              >
                <div className="flex-1 min-w-0">
                  {/* Top tags */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs text-gray-400 font-mono">
                      {getShortId(req.id)}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-semibold px-2 py-0.5", typeColors[req.type] || "bg-gray-100")}
                    >
                      {typeLabels[req.type] || req.type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-medium px-2 py-0.5", statusColors[req.status] || "bg-gray-100")}
                    >
                      {statusLabels[req.status] || req.status}
                    </Badge>
                  </div>

                  {/* Description preview */}
                  <p className="text-sm font-semibold text-gray-900 truncate pr-4">
                    <DecompressedText text={req.description} truncate={100} />
                  </p>

                  {/* Metadata */}
                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-400" />
                      {req.employee?.full_name ?? "Сотрудник"}
                      {req.room && ` (Каб. ${req.room})`}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-gray-400" />
                      {req.employee?.building ?? "—"}
                    </span>
                    <span>·</span>
                    <span>{formatDateTimeRu(req.created_at)}</span>
                  </p>
                </div>
                <span className="text-gray-400 ml-4 shrink-0">›</span>
              </button>
            );
          })
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          {selectedRequest && (
            <>
              <DialogHeader className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {getShortId(selectedRequest.id)}
                  </span>
                  <Badge variant="outline" className={cn("text-xs font-semibold", typeColors[selectedRequest.type])}>
                    {typeLabels[selectedRequest.type] || selectedRequest.type}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs font-medium", statusColors[selectedRequest.status])}>
                    {statusLabels[selectedRequest.status] || selectedRequest.status}
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Заявка АХЧ: Кабинет {selectedRequest.room}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-400">
                  Создана: {formatDateTimeRu(selectedRequest.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                {/* Description */}
                <div className="space-y-1 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Описание проблемы</h4>
                  <DecompressedText text={selectedRequest.description} className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed" />
                </div>

                 {selectedRequest.photo_urls && selectedRequest.photo_urls.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Прикрепленные фото ({selectedRequest.photo_urls.length})
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedRequest.photo_urls.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewImageUrl(url)}
                          className="relative aspect-video rounded-lg overflow-hidden border border-gray-100 hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
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

                {selectedRequest.status === "resolved" && selectedRequest.resolution && (
                  <div className="space-y-1 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Выполненная работа</h4>
                    <p className="text-sm text-emerald-900 whitespace-pre-wrap">{selectedRequest.resolution}</p>
                  </div>
                )}

                 {selectedRequest.status === "resolved" && selectedRequest.resolution_photo_urls && selectedRequest.resolution_photo_urls.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Фотоотчет выполненной работы ({selectedRequest.resolution_photo_urls.length})
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedRequest.resolution_photo_urls.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewImageUrl(url)}
                          className="relative aspect-video rounded-lg overflow-hidden border border-emerald-100 hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
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

                {/* Author info */}
                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Автор</h5>
                    <p className="font-medium text-gray-900">{selectedRequest.employee?.full_name ?? "—"}</p>
                    <p className="text-xs text-gray-500">{selectedRequest.employee?.position ?? "—"}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Размещение</h5>
                    <p className="font-medium text-gray-900">Кабинет {selectedRequest.room}</p>
                    <p className="text-xs text-gray-500 truncate max-w-full" title={selectedRequest.employee?.building ?? ""}>
                      {selectedRequest.employee?.building ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Photo Preview Dialog */}
      <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="sm:max-w-3xl bg-transparent border-none shadow-none p-0 flex items-center justify-center">
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
