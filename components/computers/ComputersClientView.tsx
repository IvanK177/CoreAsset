"use client";

import { useState } from "react";
import { ComputerFilterBar } from "@/components/computers/ComputerFilterBar";
import { ComputerStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import dynamic from "next/dynamic";

const LinkEmployeeDialog = dynamic(
  () => import("@/components/computers/LinkEmployeeDialog").then((mod) => mod.LinkEmployeeDialog),
  { ssr: false }
);
const EditComputerDialog = dynamic(
  () => import("@/components/computers/EditComputerDialog").then((mod) => mod.EditComputerDialog),
  { ssr: false }
);
const InstallSoftwareDialog = dynamic(
  () => import("@/components/computers/InstallSoftwareDialog").then((mod) => mod.InstallSoftwareDialog),
  { ssr: false }
);
const AddIncidentDialog = dynamic(
  () => import("@/components/incidents/AddIncidentDialog").then((mod) => mod.AddIncidentDialog),
  { ssr: false }
);
import { deleteComputer, linkEmployeeToComputer } from "@/lib/actions/computers";
import { removeSoftware } from "@/lib/actions/licenses";
import { cn, formatDate, safeHardware } from "@/lib/utils";
import { ArrowLeft, Edit, Monitor, X, Plus, Key, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/types/database.types";

type Computer = Tables<"computers">;
type ComputerStatus = "active" | "repair" | "decommissioned" | "storage";

interface EmployeeJoin {
  id: string;
  full_name: string;
  position: string | null;
  email: string | null;
  room: string | null;
}

/** Computer row with joined employees relation from Supabase query */
export interface ComputerWithEmployee extends Computer {
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
  computer_id: string;
  license_id: string;
  installed_at: string;
  licenses: unknown;
}

interface IncidentRow {
  id: string;
  computer_id: string | null;
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

interface ComputersClientViewProps {
  computers: ComputerWithEmployee[];
  activeEmployees: ActiveEmployee[];
  installations: InstallRow[];
  incidents: IncidentRow[];
  licenseOptions: LicenseOption[];
  initialFilter?: string;
  templates: Tables<"computer_templates">[];
}

export function ComputersClientView({ computers, activeEmployees, installations, incidents, licenseOptions, initialFilter = "all", templates }: ComputersClientViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ComputerStatus | "all">(initialFilter as ComputerStatus | "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [removeLicenseDialogOpen, setRemoveLicenseDialogOpen] = useState(false);
  const [removeLicenseInstallId, setRemoveLicenseInstallId] = useState<string | null>(null);
  const [removeEmployeeDialogOpen, setRemoveEmployeeDialogOpen] = useState(false);

  const filteredComputers = computers.filter((c) => {
    const matchesFilter = activeFilter === "all" || c.lifecycle_status === activeFilter;
    const matchesSearch = !searchQuery || c.inventory_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selectedComputer = selectedId ? computers.find((c) => c.id === selectedId) : null;

  const selectedEmployee = selectedComputer
    ? (Array.isArray(selectedComputer.employees) ? selectedComputer.employees[0] : selectedComputer.employees) as EmployeeJoin | null
    : null;

  const selectedInstalls = selectedId
    ? installations.filter((i) => i.computer_id === selectedId)
    : [];
  const selectedIncidents = selectedId
    ? incidents.filter((i) => i.computer_id === selectedId)
    : [];

  const hw = selectedComputer ? safeHardware(selectedComputer.hardware) : {};

  const normalizedInstalls = selectedInstalls.map((inst) => {
    const lic = (Array.isArray(inst.licenses) ? inst.licenses[0] : inst.licenses) as { id: string; software_name: string; version: string | null; license_type: string; total_seats: number; used_seats: number; price_per_unit: number | null; expires_at: string | null } | null;
    return {
      id: inst.id,
      installed_at: inst.installed_at,
      license: lic,
    };
  });

  if (selectedComputer) {
    return (
      <div className="flex gap-4">
        <div className="w-1/3 space-y-3">
          <ComputerFilterBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            resultCount={filteredComputers.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            compact
          />
          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            {filteredComputers.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-b-0",
                  c.id === selectedId ? "bg-blue-50" : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-sm font-medium text-gray-900 truncate">{c.inventory_number}</span>
                  <span className="text-xs text-gray-500">{c.room ?? "—"}</span>
                </div>
                <ComputerStatusBadge status={c.lifecycle_status} />
              </button>
            ))}
          </div>
        </div>

        <div className="w-2/3 rounded-xl bg-white shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedId(null)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#dbeafe]">
                <Monitor className="w-5 h-5 text-[#2563eb]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{selectedComputer.inventory_number}</h2>
                  <ComputerStatusBadge status={selectedComputer.lifecycle_status} />
                </div>
                <p className="text-sm text-gray-500">{selectedComputer.computer_type}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="w-4 h-4" /> Редактировать
              </Button>
              <DeleteConfirmDialog
                onConfirm={async () => { await deleteComputer(selectedId!); }}
                description="Будут удалены все связанные тикеты инцидентов."
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Основные данные / Железо</h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Серийный номер" value={selectedComputer.serial_number} />
              <InfoRow label="Кабинет" value={selectedComputer.room} />
              <InfoRow label="MAC-адрес" value={hw.mac_address} />
              <InfoRow label="Тип" value={selectedComputer.computer_type} />
              <InfoRow label="CPU" value={hw.cpu} />
              <InfoRow label="RAM" value={hw.ram} />
              <InfoRow label="Накопитель" value={hw.storage} />
              <InfoRow label="GPU" value={hw.gpu} />
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
                      {selectedEmployee.position ?? "—"} · Каб. {selectedEmployee.room ?? selectedComputer.room ?? "—"}
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
          computerId={selectedComputer.id}
          currentEmployeeId={selectedComputer.employee_id ?? null}
          activeEmployees={activeEmployees}
        />
        <EditComputerDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          computer={selectedComputer}
          templates={templates}
        />
        <InstallSoftwareDialog
          open={installDialogOpen}
          onOpenChange={setInstallDialogOpen}
          computerId={selectedComputer.id}
          licenseOptions={licenseOptions}
        />
        <AddIncidentDialog
          open={ticketDialogOpen}
          onOpenChange={setTicketDialogOpen}
          computers={computers.map((c) => ({ id: c.id, inventory_number: c.inventory_number }))}
          employees={activeEmployees.map((e) => ({ id: e.id, full_name: e.full_name, room: e.room ?? null }))}
          defaultComputerId={selectedComputer.id}
          defaultEmployeeId={selectedComputer.employee_id ?? undefined}
        />
        <ConfirmActionDialog
          open={removeLicenseDialogOpen}
          onOpenChange={setRemoveLicenseDialogOpen}
          onConfirm={async () => { await removeSoftware(removeLicenseInstallId!, selectedComputer.id); }}
          title="Удаление лицензии"
          description="Вы уверены, что хотите удалить эту лицензию с компьютера? Это действие освободит одно место в лицензии."
          confirmLabel="Удалить"
        />
        <ConfirmActionDialog
          open={removeEmployeeDialogOpen}
          onOpenChange={setRemoveEmployeeDialogOpen}
          onConfirm={async () => { await linkEmployeeToComputer(selectedComputer.id, null); }}
          title="Открепление сотрудника"
          description="Вы уверены, что хотите открепить сотрудника от этого компьютера?"
          confirmLabel="Открепить"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ComputerFilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        resultCount={filteredComputers.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        {filteredComputers.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Monitor className="w-10 h-10 mx-auto opacity-40 mb-3" />
            <p className="text-sm">Компьютеры не найдены</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Инв. номер</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Тип</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Кабинет</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Статус</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {filteredComputers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">{c.inventory_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.computer_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.room ?? "—"}</td>
                  <td className="px-4 py-3">
                    <ComputerStatusBadge status={c.lifecycle_status} />
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