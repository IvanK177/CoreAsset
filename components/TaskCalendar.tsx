"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, differenceInCalendarDays, startOfDay, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, AlertTriangle, Calendar, MapPin, User, ChevronLeft, ChevronRight } from "lucide-react";
import "react-day-picker/style.css";

const TIMEZONE = "Europe/Moscow";

export interface CalendarTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  deadline: Date;
  type: "incident" | "room_request";
  room?: string | null;
  employeeName?: string;
  deviceInfo?: string;
}

interface TaskCalendarProps {
  tasks: CalendarTask[];
  onTaskClick?: (taskId: string, type: "incident" | "room_request") => void;
}

function getSlaStatus(deadline: Date) {
  const now = toZonedTime(new Date(), TIMEZONE);
  const today = startOfDay(now);
  const target = startOfDay(deadline);
  
  const diff = differenceInCalendarDays(target, today);
  
  if (diff < 0) {
    return {
      text: `Просрочено на ${Math.abs(diff)} дн.`,
      color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
      indicator: "bg-red-500",
    };
  } else if (diff === 0) {
    return {
      text: "Срок истекает СЕГОДНЯ!",
      color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
      indicator: "bg-amber-500",
    };
  } else if (diff === 1) {
    return {
      text: "Остался 1 день",
      color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
      indicator: "bg-blue-500",
    };
  } else {
    return {
      text: `Осталось дней: ${diff}`,
      color: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700",
      indicator: "bg-gray-400",
    };
  }
}

export function TaskCalendar({ tasks, onTaskClick }: TaskCalendarProps) {
  const moscowNow = toZonedTime(new Date(), TIMEZONE);
  const [selectedDate, setSelectedDate] = useState<Date>(moscowNow);

  // Group tasks by deadline date
  const criticalDates: Date[] = [];
  const highDates: Date[] = [];
  const mediumDates: Date[] = [];
  const lowDates: Date[] = [];

  tasks.forEach((task) => {
    const d = new Date(task.deadline);
    const p = task.priority.toLowerCase();
    if (p === "critical") criticalDates.push(d);
    else if (p === "high") highDates.push(d);
    else if (p === "medium") mediumDates.push(d);
    else if (p === "low") lowDates.push(d);
  });

  // Filter tasks for selected date
  const selectedTasks = tasks.filter((task) => isSameDay(new Date(task.deadline), selectedDate));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Calendar wrapper */}
      <div className="lg:col-span-5 bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white self-start mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          Календарь дедлайнов (SLA)
        </h3>
        
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          locale={ru}
          className="p-0 m-0 w-full flex justify-center"
          classNames={{
            months: "w-full",
            month: "space-y-4 w-full",
            month_caption: "flex justify-between pt-1 items-center px-1 mb-2",
            caption_label: "text-sm font-semibold text-gray-800 dark:text-gray-100",
            nav: "space-x-1 flex items-center gap-1.5",
            button_previous: "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 transition-opacity rounded-md border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300 cursor-pointer",
            button_next: "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 transition-opacity rounded-md border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300 cursor-pointer",
            month_grid: "w-full border-collapse space-y-1",
            weekdays: "flex w-full justify-between border-b border-gray-100 dark:border-slate-800 pb-2",
            weekday: "text-gray-400 dark:text-slate-500 rounded-md w-9 font-medium text-[0.75rem] text-center uppercase",
            week: "flex w-full mt-2 justify-between",
            day: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20 w-9 h-9 flex items-center justify-center",
            day_button: "h-9 w-9 p-0 font-normal rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer text-gray-900 dark:text-gray-100 text-sm relative",
            selected: "[&_button]:bg-blue-600 [&_button]:hover:bg-blue-700 [&_button]:text-white [&_button]:dark:bg-blue-600 [&_button]:dark:text-white [&_button]:rounded-lg",
            today: "[&_button]:border [&_button]:border-blue-500 [&_button]:text-blue-600 [&_button]:dark:border-blue-400 [&_button]:dark:text-blue-400 [&_button]:font-bold",
            outside: "text-gray-300 dark:text-slate-700 opacity-40 pointer-events-none",
            disabled: "text-gray-300 opacity-40 cursor-not-allowed",
            hidden: "invisible",
          }}
          components={{
            Chevron: ({ orientation, className, ...props }) => {
              if (orientation === "left") {
                return <ChevronLeft className={cn("w-4 h-4", className)} {...props} />;
              }
              if (orientation === "right") {
                return <ChevronRight className={cn("w-4 h-4", className)} {...props} />;
              }
              return <span />;
            }
          }}
          modifiers={{
            critical: criticalDates,
            high: highDates,
            medium: mediumDates,
            low: lowDates,
          }}
          modifiersClassNames={{
            critical: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-red-500 font-bold",
            high: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-orange-500 font-semibold",
            medium: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-blue-500",
            low: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-gray-400",
          }}
        />

        {/* Legend */}
        <div className="w-full mt-5 pt-4 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
            <span>Критический (1 дн)</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
            <span>Высокий (2 дн)</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span>Средний (4 дн)</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" />
            <span>Низкий (7 дн)</span>
          </div>
        </div>
      </div>

      {/* Right: Agenda List */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm min-h-[350px] flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Дедлайны на выбранный день
            </h3>
            <span className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-1 rounded-full font-medium">
              {format(selectedDate, "dd MMMM yyyy", { locale: ru })}
            </span>
          </div>

          {selectedTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-gray-300 dark:text-slate-700 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Нет дедлайнов на эту дату</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
              {selectedTasks.map((task) => {
                const sla = getSlaStatus(task.deadline);
                const isRoomReq = task.type === "room_request";
                
                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick && onTaskClick(task.id, task.type)}
                    className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-gray-50/30 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer flex flex-col gap-2.5 shadow-sm hover:shadow-md"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-mono bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {isRoomReq ? `#R${task.id.slice(0, 4).toUpperCase()}` : `#T${task.id.slice(0, 4)}`}
                        </span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border uppercase",
                          task.priority === "critical" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" :
                          task.priority === "high" ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800" :
                          task.priority === "medium" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" :
                          "bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        )}>
                          {task.priority === "critical" ? "Критический" :
                           task.priority === "high" ? "Высокий" :
                           task.priority === "medium" ? "Средний" : "Низкий"}
                        </span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase",
                          task.status === "open" ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-450 dark:border-yellow-900" :
                          task.status === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-900" :
                          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900"
                        )}>
                          {task.status === "open" ? "Новая" :
                           task.status === "in_progress" ? "В работе" : "Решена"}
                        </span>
                      </div>

                      {/* SLA Badge */}
                      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold border", sla.color)}>
                        {sla.text}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {task.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    </div>

                    {/* Metadata footer */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-50 dark:border-slate-800 pt-2.5 mt-0.5 flex-wrap">
                      {task.employeeName && (
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {task.employeeName}
                        </span>
                      )}
                      {task.room && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          Каб. {task.room}
                        </span>
                      )}
                      {task.deviceInfo && (
                        <span className="flex items-center gap-1.5">
                          <span>🔌</span>
                          <span className="truncate max-w-[180px]">{task.deviceInfo}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
