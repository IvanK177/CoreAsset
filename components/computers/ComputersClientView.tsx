"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ComputerFilterBar } from "@/components/computers/ComputerFilterBar";
import ComputerTable from "@/components/computers/ComputerTable";
import type { Tables } from "@/types/database.types";

type Computer = Tables<"computers">;
type ComputerStatus = "active" | "repair" | "decommissioned" | "storage";

const validStatuses: ComputerStatus[] = ["active", "repair", "decommissioned", "storage"];

interface ComputersClientViewProps {
  computers: Computer[];
}

export function ComputersClientView({ computers }: ComputersClientViewProps) {
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<ComputerStatus | "all">("all");

  // Initialize filter from URL search params on mount
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam && validStatuses.includes(statusParam as ComputerStatus)) {
      setActiveFilter(statusParam as ComputerStatus);
    } else {
      setActiveFilter("all");
    }
  }, [searchParams]);

  const filteredComputers =
    activeFilter === "all"
      ? computers
      : computers.filter((c) => c.lifecycle_status === activeFilter);

  return (
    <div className="space-y-4">
      <ComputerFilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        resultCount={filteredComputers.length}
      />
      <ComputerTable computers={filteredComputers} />
    </div>
  );
}