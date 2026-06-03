"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EmployeeStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { cn, formatDateTimeRu, BUILDING_ADDRESSES } from "@/lib/utils";
import { restoreEmployeeDialog, dismissEmployeeDialog, deleteEmployeeDialog } from "@/lib/actions/employees";
import { clearCache } from "@/lib/actions/revalidate";
import { ArrowLeft, Users, Mail, Phone, MessageSquare, MapPin, Monitor, AlertTriangle, Search, X, UserCheck, UserX, Loader2, Edit, Building, Cpu, Keyboard, Mouse, Printer, HelpCircle, type LucideIcon } from "lucide-react";
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

interface DeviceRow {
  id: string;
  inventory_number: string;
  computer_type: string | null; // DB column name used as Subtype/Model name
  lifecycle_status: string;
  employee_id: string | null;
  room: string | null;
  device_type: string;
}

interface IncidentRow {
  id: string;
  title: string | null;
  device_id: string | null;
  employee_id: string | null;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

interface EmployeesClientViewProps {
  employees: Employee[];
  devices: DeviceRow[];
  incidents: IncidentRow[];
  buildingFilter: string;
  onBuildingFilterChange: (val: string) => void;
}

const deviceIconMap: Record<string, LucideIcon> = {
  pc: Cpu,
  monitor: Monitor,
  keyboard: Keyboard,
  mouse: Mouse,
  printer: Printer,
  other: HelpCircle,
};

const deviceTypeRussianLabels: Record<string, string> = {
  pc: "Компьютер",
  monitor: "Монитор",
  keyboard: "Клавиатура",
  mouse: "Мышь",
  printer: "Принтер",
  other: "Устройство",
};

export function EmployeesClientView({
  employees,
  devices,
  incidents,
  buildingFilter,
  onBuildingFilterChange,
}: EmployeesClientViewProps) {
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
    const matchesBuilding = buildingFilter === "all" || e.building === buildingFilter;
    return matchesStatus && matchesSearch && matchesBuilding;
  });

  const selectedEmployee = selectedId ? employees.find((e) => e.id === selectedId) : null;

  // Devices directly assigned to this employee
  const selectedDevices = selectedId
    ? devices.filter((d) => d.employee_id === selectedId)
    : [];

  const assignedDeviceIds = selectedDevices.map((d) => d.id);

  const selectedIncidents = selectedId
    ? incidents.filter((i) =>
        i.employee_id === selectedId ||
        (i.device_id && assignedDeviceIds.includes(i.device_id))
      )
    : [];

  if (selectedEmployee) {
    // Master-Detail mode
    return (
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Narrow list */}
        <div className="hidden lg:block lg:w-1/3 space-y-3">
          <div className="bg-card p-3 rounded-xl border border-border shadow-sm flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select
              value={buildingFilter}
              onValueChange={(v) => onBuildingFilterChange(v || "all")}
            >
              <SelectTrigger className="w-full h-8 text-xs bg-card border border-border">
                {buildingFilter === "all" ? "Все корпуса" : buildingFilter}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все корпуса</SelectItem>
                {Object.keys(BUILDING_ADDRESSES).map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Search + Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по имени..."
                className="pl-9 h-8 text-xs rounded-lg border-border bg-card text-foreground"
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

          <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
            {filteredEmployees.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border last:border-b-0",
                  e.id === selectedId ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
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
        <div className="w-full lg:w-2/3 rounded-xl bg-card border border-border shadow-sm p-4 md:p-6 space-y-6">
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
              <Link
                href={`/employees/${selectedEmployee.id}/edit`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
              >
                <Edit className="w-4 h-4" /> Изменить
              </Link>
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
                      await clearCache('/devices');
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
                        await clearCache('/devices');
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
          <div className="rounded-xl border border-border bg-slate-50 dark:bg-slate-900/20 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Контактная информация</h3>
            <div className="grid grid-cols-2 gap-3">
              <ContactRow icon={Mail} label="Email" value={selectedEmployee.email} />
              <ContactRow icon={MessageSquare} label="Telegram" value={selectedEmployee.telegram} />
              <ContactRow icon={Phone} label="Телефон" value={selectedEmployee.phone} />
              <ContactRow icon={MapPin} label="Кабинет" value={selectedEmployee.room} />
            </div>
          </div>

          {/* Block 2: Assigned Devices */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Закреплённые устройства</h3>
            {selectedDevices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Нет привязанных устройств</p>
            ) : (
              <div className="space-y-2">
                {selectedDevices.map((dev) => {
                  const DeviceIcon = deviceIconMap[dev.device_type] || HelpCircle;
                  const typeLabel = deviceTypeRussianLabels[dev.device_type] || "Устройство";
                  return (
                    <Link
                      key={dev.id}
                      href={`/devices/${dev.id}`}
                      className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/20 dark:hover:bg-slate-900/40 border border-border transition-colors font-mono"
                    >
                      <DeviceIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-900">
                        {dev.inventory_number}
                      </span>
                      <span className="text-xs text-gray-500 font-sans">
                        [{typeLabel}] {dev.computer_type ?? "—"}
                      </span>
                      {dev.room && (
                        <span className="text-xs text-gray-400 font-sans">· Каб. {dev.room}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Block 3: Incident History */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">История заявок</h3>
            {selectedIncidents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Инцидентов нет</p>
            ) : (
              <div className="space-y-2">
                {selectedIncidents.map((inc) => (
                  <Link
                    key={inc.id}
                    href={`/incidents?selectedId=${inc.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/20 dark:hover:bg-slate-900/40 border border-border transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-900 truncate">{inc.title ?? inc.description}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={inc.priority as "low" | "medium" | "high" | "critical"} />
                      <IncidentStatusBadge status={inc.status as "open" | "in_progress" | "resolved"} />
                      <span className="text-xs text-gray-400">{formatDateTimeRu(inc.created_at)}</span>
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
      {/* Search + Status Filter + Building Filter */}
      <div className="flex items-center gap-3 flex-wrap bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени..."
            className="pl-9 h-9 rounded-lg border-border bg-card text-foreground"
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
          <SelectTrigger className="w-[150px] h-9 bg-card">
            {statusFilterLabels[statusFilter]}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="dismissed">Уволенные</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={buildingFilter}
          onValueChange={(v) => onBuildingFilterChange(v || "all")}
        >
          <SelectTrigger className="w-[180px] h-9 bg-card border border-border text-sm gap-2">
            <Building className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="truncate">{buildingFilter === "all" ? "Все корпуса" : buildingFilter}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все корпуса</SelectItem>
            {Object.keys(BUILDING_ADDRESSES).map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filteredEmployees.length} сотрудников
        </span>
      </div>

      <div className="rounded-xl bg-card border border-border shadow-sm overflow-x-auto">
        {filteredEmployees.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto opacity-40 mb-3" />
            <p className="text-sm">Сотрудники не найдены</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Сотрудник</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Должность / Отдел</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Кабинет</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Статус</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer border-b border-border last:border-b-0"
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