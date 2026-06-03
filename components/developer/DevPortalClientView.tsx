"use client";

import { useState, useTransition } from "react";
import { cn, formatDateTimeRu } from "@/lib/utils";
import { AlertTriangle, Clock, CheckCircle2, User, Mail, Building, Loader2, MessageSquare, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { takeSupportRequestToWork, resolveSupportRequest } from "@/lib/actions/support";
import { toast } from "sonner";

interface SupportRequestRow {
  id: string;
  message: string;
  status: string;
  created_at: string;
  author_id: string;
  employee: {
    id: string;
    full_name: string;
    position: string | null;
    room: string | null;
    building: string | null;
    email: string;
  } | null;
}

interface DevPortalClientViewProps {
  requests: SupportRequestRow[];
}

const statusLabels: Record<string, string> = {
  open: "Открыто",
  in_progress: "В работе",
  resolved: "Решено",
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
};

const tabs = [
  { value: "active", label: "Активные" },
  { value: "open", label: "Открытые" },
  { value: "in_progress", label: "В работе" },
  { value: "resolved", label: "Решённые" },
];

export default function DevPortalClientView({ requests }: DevPortalClientViewProps) {
  const [activeTab, setActiveTab] = useState<string>("active");
  const [selectedRequest, setSelectedRequest] = useState<SupportRequestRow | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleTakeToWork = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      const result = await takeSupportRequestToWork(id);
      if (result.error) {
        toast.error("Не удалось взять в работу: " + result.error);
      } else {
        toast.success("Обращение взято в работу");
      }
      setPendingId(null);
    });
  };

  const handleResolve = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      const result = await resolveSupportRequest(id);
      if (result.error) {
        toast.error("Не удалось закрыть обращение: " + result.error);
      } else {
        toast.success("Обращение отмечено как выполненное");
      }
      setPendingId(null);
    });
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus =
      activeTab === "active" ? req.status !== "resolved" : req.status === activeTab;
    return matchesStatus;
  });

  const getCounts = (tabValue: string) => {
    if (tabValue === "active") return requests.filter((r) => r.status !== "resolved").length;
    if (tabValue === "open") return requests.filter((r) => r.status === "open").length;
    if (tabValue === "in_progress") return requests.filter((r) => r.status === "in_progress").length;
    if (tabValue === "resolved") return requests.filter((r) => r.status === "resolved").length;
    return 0;
  };

  const getShortId = (id: string) => {
    return `#S${id.substring(0, 4).toUpperCase()}`;
  };

  const totalOpen = requests.filter((r) => r.status === "open").length;
  const totalInProgress = requests.filter((r) => r.status === "in_progress").length;
  const totalResolved = requests.filter((r) => r.status === "resolved").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-indigo-600 p-6 text-white shadow-sm dark:bg-indigo-900/30 dark:border dark:border-indigo-500/20">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">Портал Разработчика</h1>
            <p className="text-indigo-100 text-sm">
              Панель управления внутренними обращениями пользователей и баг-репортами.
            </p>
          </div>
          <div className="flex flex-row items-center justify-around sm:justify-end gap-4 sm:gap-6 border-t border-indigo-500/30 sm:border-t-0 pt-4 sm:pt-0 shrink-0">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-bold">{totalOpen}</span>
              <span className="text-indigo-200 text-xs">Открыто</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-bold">{totalInProgress}</span>
              <span className="text-indigo-200 text-xs">В работе</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-bold">{totalResolved}</span>
              <span className="text-indigo-200 text-xs">Решено</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-1 overflow-x-auto max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 whitespace-nowrap cursor-pointer",
                activeTab === tab.value
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
              )}
            >
              {tab.label} {getCounts(tab.value)}
            </button>
          ))}
        </div>
      </div>

      {/* List of Requests */}
      <div className="max-h-[600px] overflow-y-auto pr-1 custom-scrollbar space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-gray-500 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm">
            <MessageSquare className="w-10 h-10 mx-auto opacity-40 mb-3 text-indigo-500" />
            <p className="text-sm">Обращений в поддержку не найдено</p>
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
                  "rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border transition-all duration-150 cursor-pointer hover:shadow-md hover:border-indigo-300 dark:border-slate-800",
                  isOpen ? "border-yellow-200" : isInProgress ? "border-blue-200" : "border-emerald-200"
                )}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-full shrink-0",
                        isOpen ? "bg-yellow-100 dark:bg-yellow-500/10" : isInProgress ? "bg-blue-100 dark:bg-blue-50/10" : "bg-emerald-100 dark:bg-emerald-50/10"
                      )}
                    >
                      {isOpen ? (
                        <HelpCircle className="w-4 h-4 text-yellow-600" />
                      ) : isInProgress ? (
                        <Clock className="w-4 h-4 text-blue-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400">
                          {getShortId(req.id)}
                        </span>
                        <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          Обращение от {req.employee?.full_name ?? "Сотрудник"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {req.employee?.position ?? "Сотрудник"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {req.employee?.email ?? "—"}
                        </span>
                        {req.employee?.room && (
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-gray-400" />
                            Каб. {req.employee.room}
                          </span>
                        )}
                        <span>·</span>
                        <span>{formatDateTimeRu(req.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pl-12 sm:pl-0">
                    <Badge variant="outline" className={cn("text-xs font-medium px-2 py-0.5", statusColors[req.status])}>
                      {statusLabels[req.status] || req.status}
                    </Badge>
                  </div>
                </div>

                {/* Message text */}
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 pl-12">
                  {req.message}
                </p>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pl-12">
                  {isOpen && (
                    <Button
                      size="sm"
                      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer rounded-lg text-xs"
                      disabled={isActionPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTakeToWork(req.id);
                      }}
                    >
                      {isActionPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                      Взять в работу
                    </Button>
                  )}
                  {isInProgress && (
                    <Button
                      size="sm"
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer rounded-lg text-xs"
                      disabled={isActionPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolve(req.id);
                      }}
                    >
                      {isActionPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Выполнено
                    </Button>
                  )}
                  {isResolved && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Обращение успешно решено
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6">
          {selectedRequest && (
            <>
              <DialogHeader className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 font-mono bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {getShortId(selectedRequest.id)}
                  </span>
                  <Badge variant="outline" className={cn("text-xs font-medium px-2 py-0.5", statusColors[selectedRequest.status])}>
                    {statusLabels[selectedRequest.status] || selectedRequest.status}
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  Обращение в поддержку
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-400">
                  Создано: {formatDateTimeRu(selectedRequest.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                {/* Message */}
                <div className="space-y-1 bg-gray-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Текст обращения</h4>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {selectedRequest.message}
                  </p>
                </div>

                {/* Author Info */}
                <div className="space-y-2 bg-gray-50/50 dark:bg-slate-950/50 p-4 rounded-xl border border-gray-100/50 dark:border-slate-800/50">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Информация об авторе</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 block">ФИО:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{selectedRequest.employee?.full_name ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Должность:</span>
                      <span className="text-gray-700 dark:text-gray-300">{selectedRequest.employee?.position ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Email:</span>
                      <span className="text-gray-700 dark:text-gray-300">{selectedRequest.employee?.email ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Кабинет:</span>
                      <span className="text-gray-700 dark:text-gray-300">{selectedRequest.employee?.room ?? "—"}</span>
                    </div>
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
                    Выполнено
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
