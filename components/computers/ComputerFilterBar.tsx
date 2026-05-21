"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type ComputerStatus = "active" | "repair" | "decommissioned" | "storage";

interface FilterOption {
  value: ComputerStatus | "all";
  label: string;
  dotColor: string;
}

const filterOptions: FilterOption[] = [
  { value: "all", label: "Все", dotColor: "" },
  { value: "active", label: "Активные", dotColor: "bg-emerald-400" },
  { value: "repair", label: "В ремонте", dotColor: "bg-amber-400" },
  { value: "storage", label: "Склад", dotColor: "bg-slate-400" },
  { value: "decommissioned", label: "Списанные", dotColor: "bg-rose-400" },
];

interface ComputerFilterBarProps {
  activeFilter: ComputerStatus | "all";
  onFilterChange: (filter: ComputerStatus | "all") => void;
  resultCount: number;
}

export function ComputerFilterBar({
  activeFilter,
  onFilterChange,
  resultCount,
}: ComputerFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (filter: ComputerStatus | "all") => {
    onFilterChange(filter);

    // Update URL to reflect the filter state
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "all") {
      params.delete("status");
    } else {
      params.set("status", filter);
    }
    const query = params.toString();
    router.replace(query ? `/computers?${query}` : "/computers", { scroll: false });
  };

  const handleClear = () => {
    handleFilterChange("all");
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-1">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleFilterChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeFilter === option.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {option.dotColor && (
              <span
                className={cn("inline-block w-2 h-2 rounded-full", option.dotColor)}
              />
            )}
            {option.label}
          </button>
        ))}
      </div>

      {activeFilter !== "all" && (
        <button
          onClick={handleClear}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Сбросить
        </button>
      )}

      <span className="text-sm text-muted-foreground">
        {resultCount} записей
      </span>
    </div>
  );
}