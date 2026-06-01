"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeNotificationsProps {
  role: "admin" | "it_specialist" | "facilities";
}

interface DeviceRecord {
  inventory_number?: string;
}

interface LicenseRecord {
  software_name?: string;
}

interface EmployeeRecord {
  full_name?: string;
}

interface IncidentRecord {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
}

interface RoomRequestRecord {
  id?: string;
  room?: string;
  status?: string;
  type?: string;
  description?: string;
}

export function RealtimeNotifications({ role }: RealtimeNotificationsProps) {
  useEffect(() => {
    const supabase = createClient();
    const channels: RealtimeChannel[] = [];

    if (role === "admin") {
      // Admin tracks ALL tables for INSERT, UPDATE, DELETE
      const tables = ["devices", "licenses", "employees", "incidents", "room_requests"];
      
      tables.forEach((table) => {
        const channel = supabase
          .channel(`admin-tracker-${table}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: table },
            (payload) => {
              const { eventType, new: newRecord, old: oldRecord } = payload;
              
              let msg = "";
              let title = "";
              
              if (table === "devices") {
                const newDev = newRecord as DeviceRecord | null;
                const oldDev = oldRecord as DeviceRecord | null;
                const inv = newDev?.inventory_number || oldDev?.inventory_number || "";
                title = `Устройства: ${inv}`;
                if (eventType === "INSERT") msg = `Добавлено новое устройство: ${inv}`;
                if (eventType === "UPDATE") msg = `Обновлена информация об устройстве: ${inv}`;
                if (eventType === "DELETE") msg = `Удалено устройство`;
              } else if (table === "licenses") {
                const newLic = newRecord as LicenseRecord | null;
                const oldLic = oldRecord as LicenseRecord | null;
                const software = newLic?.software_name || oldLic?.software_name || "";
                title = `Лицензии: ${software}`;
                if (eventType === "INSERT") msg = `Добавлена новая лицензия: ${software}`;
                if (eventType === "UPDATE") msg = `Обновлена лицензия: ${software}`;
                if (eventType === "DELETE") msg = `Удалена лицензия`;
              } else if (table === "employees") {
                const newEmp = newRecord as EmployeeRecord | null;
                const oldEmp = oldRecord as EmployeeRecord | null;
                const name = newEmp?.full_name || oldEmp?.full_name || "";
                title = `Сотрудники: ${name}`;
                if (eventType === "INSERT") msg = `Добавлен новый сотрудник: ${name}`;
                if (eventType === "UPDATE") msg = `Обновлен профиль сотрудника: ${name}`;
                if (eventType === "DELETE") msg = `Удален сотрудник`;
              } else if (table === "incidents") {
                const newInc = newRecord as IncidentRecord | null;
                const t = newInc?.title || newInc?.description || "";
                title = `Инцидент IT`;
                const displayTitle = t.length > 50 ? t.substring(0, 50) + "..." : t;
                if (eventType === "INSERT") msg = `Создан новый инцидент: "${displayTitle}"`;
                if (eventType === "UPDATE") msg = `Инцидент #${newInc?.id?.substring(0, 4)} изменен (Статус: ${newInc?.status})`;
                if (eventType === "DELETE") msg = `Удален инцидент`;
              } else if (table === "room_requests") {
                const newReq = newRecord as RoomRequestRecord | null;
                const room = newReq?.room || "";
                title = `Заявка АХЧ: каб. ${room}`;
                if (eventType === "INSERT") msg = `Создана новая заявка АХЧ для кабинета ${room}`;
                if (eventType === "UPDATE") msg = `Заявка АХЧ #${newReq?.id?.substring(0, 4)} изменена (Статус: ${newReq?.status})`;
                if (eventType === "DELETE") msg = `Удалена заявка АХЧ`;
              }

              if (msg) {
                if (eventType === "INSERT") {
                  toast.success(msg, { description: title });
                } else if (eventType === "UPDATE") {
                  toast.info(msg, { description: title });
                } else {
                  toast.warning(msg, { description: title });
                }
              }
            }
          )
          .subscribe();
          
        channels.push(channel);
      });
      
    } else if (role === "it_specialist") {
      // IT Specialist tracks ONLY new incidents (INSERT)
      const channel = supabase
        .channel("it-new-incidents")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "incidents" },
          (payload) => {
            const newRecord = payload.new as IncidentRecord;
            const t = newRecord.title || newRecord.description || "";
            const displayTitle = t.length > 50 ? t.substring(0, 50) + "..." : t;
            toast.success(`Поступила новая заявка IT: "${displayTitle}"`, {
              description: `Приоритет: ${newRecord.priority}`,
              duration: 8000,
            });
          }
        )
        .subscribe();
        
      channels.push(channel);
      
    } else if (role === "facilities") {
      // Facilities employee tracks ONLY new room requests (INSERT)
      const channel = supabase
        .channel("facilities-new-requests")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "room_requests" },
          (payload) => {
            const newRecord = payload.new as RoomRequestRecord;
            toast.success(`Поступила новая заявка АХЧ для кабинета ${newRecord.room}`, {
              description: `Тип: ${newRecord.type}. Описание: ${newRecord.description?.substring(0, 50)}...`,
              duration: 8000,
            });
          }
        )
        .subscribe();
        
      channels.push(channel);
    }

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [role]);

  return null;
}
