"use client";

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type ComputerStatus = "active" | "repair" | "decommissioned" | "storage";

interface FilterOption {
  value: ComputerStatus | "all";
  label: string;
  dotColor: string;
}

const filterOptions: FilterOption[] = [
  { value: "all", label: "Все статусы", dotColor: "" },
  { value: "active", label: "Активен", dotColor: "bg-emerald-500" },
  { value: "repair", label: "В ремонте", dotColor: "bg-orange-500" },
  { value: "storage", label: "На складе", dotColor: "bg-blue-500" },
  { value: "decommissioned", label: "Списан", dotColor: "bg-gray-400" },
];

interface ComputerFilterBarProps {
  activeFilter: ComputerStatus | "all";
  onFilterChange: (filter: ComputerStatus | "all") => void;
  resultCount: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  compact?: boolean;
}

export function ComputerFilterBar({
  activeFilter,
  onFilterChange,
  resultCount,
  searchQuery = "",
  onSearchChange,
  compact = false,
}: ComputerFilterBarProps) {
  return (
    <div className={cn("flex items-center gap-3 flex-wrap", compact && "gap-2")}>
      {/* Search */}
      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по инв. номеру..."
            className={cn("pl-9 h-9 rounded-lg border-gray-200 bg-white", compact && "h-8 text-xs")}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 overflow-x-auto max-w-full">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 whitespace-nowrap",
              activeFilter === option.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {option.dotColor && (
              <span className={cn("w-2 h-2 rounded-full", option.dotColor)} />
            )}
            {option.label}
          </button>
        ))}
      </div>

      <span className="text-xs text-gray-500">
        {resultCount} устройств
      </span>
    </div>
  );
}