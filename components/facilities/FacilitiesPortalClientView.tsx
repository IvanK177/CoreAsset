"use client";

import { useState, useTransition } from "react";
import { cn, formatDateTime, BUILDING_ADDRESSES } from "@/lib/utils";
import { AlertTriangle, Clock, CheckCircle2, User, Building, Wrench, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DecompressedText } from "@/components/shared/DecompressedText";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { takeRoomRequestToWork, resolveRoomRequest } from "@/lib/actions/facilities-portal";
import { toast } from "sonner";

interface RoomRequestRow {
  id: string;
  room: string;
  type: string;
  description: string;
  status: string;
  author_id: string;
  created_at: string;
  employee: {
    id: string;
    full_name: string;
    position: string | null;
    room: string | null;
    building: string | null;
  } | null;
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

const tabs = [
  { value: "active", label: "Активные" },
  { value: "open", label: "Открытые" },
  { value: "in_progress", label: "В работе" },
  { value: "resolved", label: "Решённые" },
];

export default function FacilitiesPortalClientView({ requests }: FacilitiesPortalClientViewProps) {
  const [activeTab, setActiveTab] = useState<string>("active");
  const [buildingFilter, setBuildingFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<RoomRequestRow | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

  const handleResolve = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      const result = await resolveRoomRequest(id);
      if (result.error) {
        toast.error("Не удалось завершить заявку: " + result.error);
      } else {
        toast.success("Заявка успешно выполнена");
      }
      setPendingId(null);
    });
  };

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

  // Global counts for banner stats
  const totalOpen = requests.filter((r) => r.status === "open").length;
  const totalInProgress = requests.filter((r) => r.status === "in_progress").length;
  const totalResolved = requests.filter((r) => r.status === "resolved").length;

  return (
    <div className="space-y-6">
      {/* ===== Header Banner ===== */}
      <div className="rounded-2xl bg-emerald-600 p-6 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">Заявки АХО</h1>
            <p className="text-emerald-100 text-sm">
              Управление заявками на ремонт и оснащение кабинетов. Берите в работу и отмечайте выполнение.
            </p>
          </div>
          <div className="flex items-center gap-6 ml-6">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{totalOpen}</span>
              <span className="text-emerald-200 text-xs">Открыто</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{totalInProgress}</span>
              <span className="text-emerald-200 text-xs">В работе</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{totalResolved}</span>
              <span className="text-emerald-200 text-xs">Выполнено</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Filters Bar ===== */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 overflow-x-auto max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 whitespace-nowrap cursor-pointer",
                activeTab === tab.value
                  ? "bg-emerald-600 text-white"
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

      {/* ===== List of Requests ===== */}
      <div className="max-h-[600px] overflow-y-auto pr-1 custom-scrollbar space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-gray-500 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <AlertTriangle className="w-10 h-10 mx-auto opacity-40 mb-3" />
            <p className="text-sm">Нет доступных заявок</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isOpen = req.status === "open";
            const isInProgress = req.status === "in_progress";
            const isResolved = req.status === "resolved";
            const isActionPending = pendingId === req.id;

            return (
              <div
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className={cn(
                  "rounded-2xl bg-white p-5 shadow-sm border transition-all duration-150 cursor-pointer hover:shadow-md hover:border-slate-300",
                  isOpen ? "border-yellow-200" : isInProgress ? "border-blue-200" : "border-emerald-200"
                )}
              >
                {/* Header row */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Status Icon */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-full shrink-0",
                      isOpen ? "bg-yellow-100" : isInProgress ? "bg-blue-100" : "bg-emerald-100"
                    )}
                  >
                    {isOpen ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    ) : isInProgress ? (
                      <Clock className="w-4 h-4 text-blue-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">
                        {getShortId(req.id)}
                      </span>
                      <span className="font-semibold text-sm text-gray-900 truncate">
                        Кабинет {req.room}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        {req.employee?.full_name ?? "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-gray-400" />
                        {req.employee?.building ?? "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-gray-400" />
                        {typeLabels[req.type] || req.type}
                      </span>
                      <span>·</span>
                      <span>{formatDateTime(req.created_at)}</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={cn("text-xs font-semibold", typeColors[req.type])}>
                      {typeLabels[req.type] || req.type}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs font-medium", statusColors[req.status])}>
                      {statusLabels[req.status] || req.status}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                {req.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 pl-12">
                    <DecompressedText text={req.description} truncate={120} />
                  </p>
                )}

                {/* Action buttons */}
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
                        handleResolve(req.id);
                      }}
                    >
                      {isActionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Решено
                    </Button>
                  )}
                  {isResolved && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Выполнено
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===== Details Dialog ===== */}
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
                  Заявка АХО: Кабинет {selectedRequest.room}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-400">
                  Создана: {formatDateTime(selectedRequest.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                {/* Description */}
                <div className="space-y-1 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Описание проблемы</h4>
                  <DecompressedText text={selectedRequest.description} className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed" />
                </div>

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

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-lg h-9"
                >
                  Закрыть
                </Button>
                {selectedRequest.status === "open" && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9"
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
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9"
                    onClick={() => {
                      handleResolve(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                  >
                    Решено
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
