"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EmployeeStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { cn, formatDate } from "@/lib/utils";
import { restoreEmployeeDialog, dismissEmployeeDialog, deleteEmployeeDialog } from "@/lib/actions/employees";
import { clearCache } from "@/lib/actions/revalidate";
import { ArrowLeft, Users, Mail, Phone, MessageSquare, MapPin, Monitor, AlertTriangle, Search, X, UserCheck, UserX, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { Tables } from "@/types/database.types";

type Employee = Tables<"employees">;
type EmployeeStatusFilter = "all" | "active" | "dismissed";

const statusFilterLabels: Record<EmployeeStatusFilter, string> = {
  all: "Все",
  active: "Активные",
  dismissed: "Уволенные",
};

interface ComputerRow {
  id: string;
  inventory_number: string;
  computer_type: string | null;
  lifecycle_status: string;
  employee_id: string | null;
  room: string | null;
}

interface IncidentRow {
  id: string;
  title: string | null;
  computer_id: string | null;
  employee_id: string | null;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

interface EmployeesClientViewProps {
  employees: Employee[];
  computers: ComputerRow[];
  incidents: IncidentRow[];
}

export function EmployeesClientView({ employees, computers, incidents }: EmployeesClientViewProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<EmployeeStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmployees = employees.filter((e) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && e.is_active) ||
      (statusFilter === "dismissed" && !e.is_active);
    const matchesSearch =
      !searchQuery || e.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const selectedEmployee = selectedId ? employees.find((e) => e.id === selectedId) : null;

  // Computers directly assigned to this employee (via computers.employee_id)
  const selectedComputers = selectedId
    ? computers.filter((c) => c.employee_id === selectedId)
    : [];

  // Incidents linked to this employee directly (via incidents.employee_id)
  // or indirectly through their assigned computer (via incidents.computer_id)
  const assignedComputerIds = selectedComputers.map((c) => c.id);

  const selectedIncidents = selectedId
    ? incidents.filter((i) =>
        i.employee_id === selectedId ||
        (i.computer_id && assignedComputerIds.includes(i.computer_id))
      )
    : [];

  if (selectedEmployee) {
    // Master-Detail mode
    return (
      <div className="flex gap-4">
        {/* Left: Narrow list */}
        <div className="w-1/3 space-y-3">
          {/* Search + Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по имени..."
                className="pl-9 h-8 text-xs rounded-lg border-gray-200 bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as EmployeeStatusFilter)}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs">
                {statusFilterLabels[statusFilter]}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="dismissed">Уволенные</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            {filteredEmployees.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-b-0",
                  e.id === selectedId ? "bg-blue-50" : "hover:bg-gray-50"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0",
                  e.is_active ? "bg-[#2563eb] text-white" : "bg-gray-300 text-gray-600"
                )}>
                  {e.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{e.full_name}</p>
                </div>
                <EmployeeStatusBadge status={e.is_active ? "active" : "dismissed"} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="w-2/3 rounded-xl bg-white shadow-sm p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedId(null)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold",
                selectedEmployee.is_active ? "bg-[#2563eb] text-white" : "bg-gray-300 text-gray-600"
              )}>
                {selectedEmployee.full_name.split(" ").map((n) => n.charAt(0)).join("").slice(0, 2)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedEmployee.full_name}</h2>
                <p className="text-sm text-gray-500">
                  {selectedEmployee.position ?? "—"} · Каб. {selectedEmployee.room ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedEmployee.is_active ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      await dismissEmployeeDialog(selectedId!);
                      await clearCache('/employees');
                      await clearCache('/computers');
                      await clearCache('/dashboard');
                      router.refresh();
                    });
                  }}
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                  {isPending ? "Увольнение…" : "Уволить"}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        await restoreEmployeeDialog(selectedId!);
                        await clearCache('/employees');
                        await clearCache('/computers');
                        await clearCache('/dashboard');
                        router.refresh();
                        setSelectedId(null);
                      });
                    }}
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    {isPending ? "Восстановление…" : "Вернуть"}
                  </Button>
                  <DeleteConfirmDialog
                    onConfirm={async () => {
                      await deleteEmployeeDialog(selectedId!);
                      await clearCache('/employees');
                      await clearCache('/dashboard');
                      startTransition(() => { router.refresh(); });
                      setSelectedId(null);
                    }}
                    description="Сотрудник будет удалён из системы безвозвратно."
                  />
                </>
              )}
            </div>
          </div>

          {/* Block 1: Contact Info */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Контактная информация</h3>
            <div className="grid grid-cols-2 gap-3">
              <ContactRow icon={Mail} label="Email" value={selectedEmployee.email} />
              <ContactRow icon={MessageSquare} label="Telegram" value={selectedEmployee.telegram} />
              <ContactRow icon={Phone} label="Телефон" value={selectedEmployee.phone} />
              <ContactRow icon={MapPin} label="Кабинет" value={selectedEmployee.room} />
            </div>
          </div>

          {/* Block 2: Assigned Computers */}
          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Закреплённые ПК</h3>
            {selectedComputers.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">Нет привязанных ПК</p>
            ) : (
              <div className="space-y-2">
                {selectedComputers.map((comp) => (
                  <Link
                    key={comp.id}
                    href={`/computers/${comp.id}`}
                    className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <Monitor className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {comp.inventory_number}
                    </span>
                    <span className="text-xs text-gray-500">
                      {comp.computer_type ?? "—"}
                    </span>
                    {comp.room && (
                      <span className="text-xs text-gray-400">· Каб. {comp.room}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Block 3: Incident History */}
          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">История заявок</h3>
            {selectedIncidents.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">Инцидентов нет</p>
            ) : (
              <div className="space-y-2">
                {selectedIncidents.map((inc) => (
                  <Link
                    key={inc.id}
                    href={`/incidents?selectedId=${inc.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-900 truncate">{inc.title ?? inc.description}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={inc.priority as "low" | "medium" | "high" | "critical"} />
                      <IncidentStatusBadge status={inc.status as "open" | "in_progress" | "resolved"} />
                      <span className="text-xs text-gray-400">{formatDate(inc.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default mode: full-width table with search + filter
  return (
    <div className="space-y-4">
      {/* Search + Status Filter */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени..."
            className="pl-9 h-9 rounded-lg border-gray-200 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as EmployeeStatusFilter)}
        >
          <SelectTrigger className="w-[150px] h-9">
            {statusFilterLabels[statusFilter]}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="dismissed">Уволенные</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-500">
          {filteredEmployees.length} сотрудников
        </span>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Users className="w-10 h-10 mx-auto opacity-40 mb-3" />
            <p className="text-sm">Сотрудники не найдены</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Сотрудник</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Должность / Отдел</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Кабинет</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Статус</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0",
                        e.is_active ? "bg-[#2563eb] text-white" : "bg-gray-300 text-gray-600"
                      )}>
                        {e.full_name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{e.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{e.position ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{e.email ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{e.room ?? "—"}</td>
                  <td className="px-4 py-3">
                    <EmployeeStatusBadge status={e.is_active ? "active" : "dismissed"} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400">›</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value ?? "—"}</p>
      </div>
    </div>
  );
}