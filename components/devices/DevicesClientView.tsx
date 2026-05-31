"use client";

import { useState } from "react";
import { DeviceFilterBar } from "@/components/devices/DeviceFilterBar";
import { ComputerStatusBadge as DeviceStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import dynamic from "next/dynamic";

const LinkEmployeeDialog = dynamic(
  () => import("@/components/devices/LinkEmployeeDialog").then((mod) => mod.LinkEmployeeDialog),
  { ssr: false }
);
const EditDeviceDialog = dynamic(
  () => import("@/components/devices/EditDeviceDialog").then((mod) => mod.EditDeviceDialog),
  { ssr: false }
);
const InstallSoftwareDialog = dynamic(
  () => import("@/components/devices/InstallSoftwareDialog").then((mod) => mod.InstallSoftwareDialog),
  { ssr: false }
);
const AddIncidentDialog = dynamic(
  () => import("@/components/incidents/AddIncidentDialog").then((mod) => mod.AddIncidentDialog),
  { ssr: false }
);
import { deleteDevice, linkEmployeeToDevice } from "@/lib/actions/devices";
import { removeSoftware } from "@/lib/actions/licenses";
import { cn, formatDate, safeHardware, BUILDING_ADDRESSES } from "@/lib/utils";
import { ArrowLeft, Edit, Monitor, X, Plus, Key, AlertTriangle, Building, Cpu, Keyboard, Mouse, Printer, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/types/database.types";

type Device = Tables<"devices">;
type DeviceStatus = "active" | "repair" | "decommissioned" | "storage";

interface EmployeeJoin {
  id: string;
  full_name: string;
  position: string | null;
  email: string | null;
  room: string | null;
  building: string | null;
}

/** Device row with joined employees relation from Supabase query */
export interface DeviceWithEmployee extends Device {
  employees: EmployeeJoin | EmployeeJoin[] | null;
}

export interface ActiveEmployee {
  id: string;
  full_name: string;
  position: string | null;
  room?: string | null;
}

interface InstallRow {
  id: string;
  device_id: string | null;
  license_id: string | null;
  installed_at: string | null;
  licenses: unknown;
}

interface IncidentRow {
  id: string;
  device_id: string | null;
  description: string;
  priority: string;
  status: string;
  incident_type: string;
  created_at: string;
}

export interface LicenseOption {
  id: string;
  software_name: string;
  used_seats: number;
  total_seats: number;
}

interface DevicesClientViewProps {
  devices: DeviceWithEmployee[];
  activeEmployees: ActiveEmployee[];
  installations: InstallRow[];
  incidents: IncidentRow[];
  licenseOptions: LicenseOption[];
  initialFilter?: string;
  templates: Tables<"computer_templates">[];
  buildingFilter: string;
  onBuildingFilterChange: (val: string) => void;
}

const typeFilterOptions = [
  { value: "all", label: "Все устройства" },
  { value: "pc", label: "Компьютеры" },
  { value: "monitor", label: "Мониторы" },
  { value: "peripherals", label: "Периферия" },
  { value: "printer", label: "Оргтехника" },
  { value: "other", label: "Другое" },
];

export function getDeviceIcon(type: string) {
  switch (type) {
    case "pc":
      return Cpu;
    case "monitor":
      return Monitor;
    case "keyboard":
      return Keyboard;
    case "mouse":
      return Mouse;
    case "printer":
      return Printer;
    default:
      return HelpCircle;
  }
}

export function getDeviceTypeLabel(type: string) {
  switch (type) {
    case "pc":
      return "Компьютер";
    case "monitor":
      return "Монитор";
    case "keyboard":
      return "Клавиатура";
    case "mouse":
      return "Мышь";
    case "printer":
      return "Оргтехника / Принтер";
    default:
      return "Другое";
  }
}

export function DevicesClientView({
  devices,
  activeEmployees,
  installations,
  incidents,
  licenseOptions,
  initialFilter = "all",
  templates,
  buildingFilter,
  onBuildingFilterChange,
}: DevicesClientViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<DeviceStatus | "all">(initialFilter as DeviceStatus | "all");
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [removeLicenseDialogOpen, setRemoveLicenseDialogOpen] = useState(false);
  const [removeLicenseInstallId, setRemoveLicenseInstallId] = useState<string | null>(null);
  const [removeEmployeeDialogOpen, setRemoveEmployeeDialogOpen] = useState(false);

  const filteredDevices = devices.filter((d) => {
    const matchesFilter = activeFilter === "all" || d.lifecycle_status === activeFilter;
    const matchesSearch = !searchQuery || d.inventory_number.toLowerCase().includes(searchQuery.toLowerCase());
    const emp = Array.isArray(d.employees) ? d.employees[0] : d.employees;
    const matchesBuilding = buildingFilter === "all" || (emp && emp.building === buildingFilter);
    
    let matchesType = true;
    if (activeTypeFilter === "pc") {
      matchesType = d.device_type === "pc";
    } else if (activeTypeFilter === "monitor") {
      matchesType = d.device_type === "monitor";
    } else if (activeTypeFilter === "peripherals") {
      matchesType = d.device_type === "keyboard" || d.device_type === "mouse";
    } else if (activeTypeFilter === "printer") {
      matchesType = d.device_type === "printer";
    } else if (activeTypeFilter === "other") {
      matchesType = d.device_type === "other";
    }

    return matchesFilter && matchesSearch && matchesBuilding && matchesType;
  });

  const selectedDevice = selectedId ? devices.find((d) => d.id === selectedId) : null;

  const selectedEmployee = selectedDevice
    ? (Array.isArray(selectedDevice.employees) ? selectedDevice.employees[0] : selectedDevice.employees) as EmployeeJoin | null
    : null;

  const selectedInstalls = selectedId
    ? installations.filter((i) => i.device_id === selectedId)
    : [];
  const selectedIncidents = selectedId
    ? incidents.filter((i) => i.device_id === selectedId)
    : [];

  const hw = selectedDevice ? safeHardware(selectedDevice.hardware) as any : {};

  const normalizedInstalls = selectedInstalls.map((inst) => {
    const lic = (Array.isArray(inst.licenses) ? inst.licenses[0] : inst.licenses) as { id: string; software_name: string; version: string | null; license_type: string; total_seats: number; used_seats: number; price_per_unit: number | null; expires_at: string | null } | null;
    return {
      id: inst.id,
      installed_at: inst.installed_at,
      license: lic,
    };
  });

  const DeviceIcon = selectedDevice ? getDeviceIcon(selectedDevice.device_type) : HelpCircle;

  if (selectedDevice) {
    return (
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="hidden lg:block lg:w-1/3 space-y-3">
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={buildingFilter}
              onChange={(e) => onBuildingFilterChange(e.target.value)}
              className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 focus:border-blue-500 focus:outline-none truncate"
            >
              <option value="all">Все корпуса</option>
              {Object.keys(BUILDING_ADDRESSES).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          {/* Main type filter inside sidebar listing */}
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Тип устройства</p>
            <div className="grid grid-cols-2 gap-1">
              {typeFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setActiveTypeFilter(opt.value)}
                  className={cn(
                    "px-2 py-1.5 rounded-lg text-left text-xs font-medium transition-colors",
                    activeTypeFilter === opt.value
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-500 hover:bg-gray-50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <DeviceFilterBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            resultCount={filteredDevices.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            compact
          />
          <div className="rounded-xl bg-white shadow-sm overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
            {filteredDevices.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-b-0",
                  d.id === selectedId ? "bg-blue-50" : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-sm font-medium text-gray-900 truncate">{d.inventory_number}</span>
                  <span className="text-xs text-gray-500">{d.room ?? "—"}</span>
                </div>
                <DeviceStatusBadge status={d.lifecycle_status as any} />
              </button>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-2/3 rounded-xl bg-white shadow-sm p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setSelectedId(null)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#dbeafe] shrink-0">
                <DeviceIcon className="w-5 h-5 text-[#2563eb]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900 truncate">{selectedDevice.inventory_number}</h2>
                  <DeviceStatusBadge status={selectedDevice.lifecycle_status as any} />
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {getDeviceTypeLabel(selectedDevice.device_type)} · {selectedDevice.computer_type}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end sm:justify-start">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="w-4 h-4" /> Редактировать
              </Button>
              <DeleteConfirmDialog
                onConfirm={async () => { await deleteDevice(selectedId!); setSelectedId(null); }}
                description="Будут удалены все связанные тикеты инцидентов."
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Основные данные / Характеристики</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow label="Серийный номер" value={selectedDevice.serial_number} />
              <InfoRow label="Кабинет" value={selectedDevice.room} />
              <InfoRow label="Тип устройства" value={getDeviceTypeLabel(selectedDevice.device_type)} />
              <InfoRow label="Название / Модель" value={selectedDevice.computer_type} />
              
              {/* PC specific hardware fields */}
              {selectedDevice.device_type === "pc" && (
                <>
                  <InfoRow label="MAC-адрес" value={hw.mac_address} />
                  <InfoRow label="CPU" value={hw.cpu} />
                  <InfoRow label="RAM" value={hw.ram} />
                  <InfoRow label="Накопитель" value={hw.storage} />
                  <InfoRow label="GPU" value={hw.gpu} />
                </>
              )}

              {/* Monitor specific hardware fields */}
              {selectedDevice.device_type === "monitor" && (
                <>
                  <InfoRow label="Диагональ" value={hw.diagonal} />
                  <InfoRow label="Разрешение" value={hw.resolution} />
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Закреплён за сотрудником</h3>
              <button
                onClick={() => setLinkDialogOpen(true)}
                className="text-xs text-[#2563eb] font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Изменить
              </button>
            </div>
            {selectedEmployee ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2563eb] text-white text-sm font-bold">
                    {selectedEmployee.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedEmployee.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedEmployee.position ?? "—"} · Каб. {selectedEmployee.room ?? selectedDevice.room ?? "—"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRemoveEmployeeDialogOpen(true)}
                  className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
                  title="Открепить сотрудника"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-2">Не закреплён за сотрудником</p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Установленное ПО</h3>
              <button
                onClick={() => setInstallDialogOpen(true)}
                className="text-xs text-[#2563eb] font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Установить ПО
              </button>
            </div>
            {normalizedInstalls.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">ПО не установлено</p>
            ) : (
              <div className="space-y-2">
                {normalizedInstalls.map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        <Key className="w-3 h-3 text-gray-400 inline mr-1" />
                        {inst.license?.software_name ?? "—"}
                        {inst.license?.version ? ` v${inst.license.version}` : ""}
                      </p>
                      <p className="text-xs text-gray-500">
                        Лицензия · {formatDate(inst.installed_at)}
                        {inst.license && inst.license.price_per_unit != null && ` · ${inst.license.price_per_unit} ₽/ед.`}
                      </p>
                    </div>
                    <button
                      onClick={() => { setRemoveLicenseInstallId(inst.id); setRemoveLicenseDialogOpen(true); }}
                      className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
                      title="Удалить лицензию"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">История инцидентов</h3>
              <button
                onClick={() => setTicketDialogOpen(true)}
                className="text-xs text-[#2563eb] font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Создать тикет
              </button>
            </div>
            {selectedIncidents.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">Инцидентов нет</p>
            ) : (
              <div className="space-y-2">
                {selectedIncidents.map((inc) => (
                  <a
                    key={inc.id}
                    href={`/incidents?selectedId=${inc.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{inc.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={inc.priority as "low" | "medium" | "high" | "critical"} />
                      <IncidentStatusBadge status={inc.status as "open" | "in_progress" | "resolved"} />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dialogs */}
        <LinkEmployeeDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          deviceId={selectedDevice.id}
          currentEmployeeId={selectedDevice.employee_id ?? null}
          activeEmployees={activeEmployees}
        />
        <EditDeviceDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          device={selectedDevice}
          templates={templates}
        />
        <InstallSoftwareDialog
          open={installDialogOpen}
          onOpenChange={setInstallDialogOpen}
          deviceId={selectedDevice.id}
          licenseOptions={licenseOptions}
        />
        <AddIncidentDialog
          open={ticketDialogOpen}
          onOpenChange={setTicketDialogOpen}
          devices={devices.map((d) => ({ id: d.id, inventory_number: d.inventory_number }))}
          employees={activeEmployees.map((e) => ({ id: e.id, full_name: e.full_name, room: e.room ?? null }))}
          defaultDeviceId={selectedDevice.id}
          defaultEmployeeId={selectedDevice.employee_id ?? undefined}
        />
        <ConfirmActionDialog
          open={removeLicenseDialogOpen}
          onOpenChange={setRemoveLicenseDialogOpen}
          onConfirm={async () => { await removeSoftware(removeLicenseInstallId!, selectedDevice.id); }}
          title="Удаление лицензии"
          description="Вы уверены, что хотите удалить эту лицензию с устройства? Это действие освободит одно место в лицензии."
          confirmLabel="Удалить"
        />
        <ConfirmActionDialog
          open={removeEmployeeDialogOpen}
          onOpenChange={setRemoveEmployeeDialogOpen}
          onConfirm={async () => { await linkEmployeeToDevice(selectedDevice.id, null); }}
          title="Открепление сотрудника"
          description="Вы уверены, что хотите открепить сотрудника от этого устройства?"
          confirmLabel="Открепить"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Filter Bar with Main Types Filter */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        {/* Main Category type filter tabs */}
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 p-1 rounded-xl self-start overflow-x-auto max-w-full">
          {typeFilterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveTypeFilter(opt.value)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                activeTypeFilter === opt.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <DeviceFilterBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            resultCount={filteredDevices.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <div className="flex items-center gap-2 shrink-0">
            <Building className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={buildingFilter}
              onChange={(e) => onBuildingFilterChange(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none max-w-[240px] truncate"
            >
              <option value="all">Все корпуса</option>
              {Object.keys(BUILDING_ADDRESSES).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-x-auto">
        {filteredDevices.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Monitor className="w-10 h-10 mx-auto opacity-40 mb-3" />
            <p className="text-sm">Устройства не найдены</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Инв. номер</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Тип устройства</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Название / Модель</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Кабинет</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Статус</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">{d.inventory_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{getDeviceTypeLabel(d.device_type)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{d.computer_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{d.room ?? "—"}</td>
                  <td className="px-4 py-3">
                    <DeviceStatusBadge status={d.lifecycle_status as any} />
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

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value ?? "—"}</p>
    </div>
  );
}