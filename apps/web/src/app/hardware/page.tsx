"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql-client";

const HARDWARE_QUERY = `
  query($skip: Int, $take: Int, $lifecycleState: String, $type: String, $search: String) {
    hardwareAssets(skip: $skip, take: $take, lifecycleState: $lifecycleState, type: $type, search: $search) {
      items {
        id
        serialNumber
        name
        type
        brand
        model
        lifecycleState
        purchaseDate
        warrantyEndDate
        createdAt
        workplaces {
          id
          user {
            fullName
          }
        }
      }
      total
    }
  }
`;

export default function HardwarePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["hardwareAssets"],
    queryFn: () => graphqlRequest(HARDWARE_QUERY),
  });

  if (isLoading) return <div className="py-20 text-center text-[var(--muted-foreground)]">Loading hardware...</div>;
  if (error) return <div className="py-10 text-center text-[var(--destructive)]">Error: {error.message}</div>;

  const items = data?.hardwareAssets?.items || [];

  const stateColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    in_repair: "bg-yellow-100 text-yellow-800",
    in_storage: "bg-gray-100 text-gray-800",
    decommissioned: "bg-red-100 text-red-800",
    disposed: "bg-purple-100 text-purple-800",
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Hardware Assets</h1>
        <a
          href="/hardware/new"
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          + Add Hardware
        </a>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Name</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Serial Number</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Type</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Brand / Model</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Status</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Assigned To</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                <td className="px-4 py-3 text-[var(--foreground)]">
                  <a href={`/hardware/${item.id}`} className="font-medium text-[var(--primary)] hover:underline">
                    {item.name}
                  </a>
                </td>
                <td className="px-4 py-3 text-[var(--foreground)]">{item.serialNumber}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{item.type}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{item.brand} {item.model}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${stateColors[item.lifecycleState] || "bg-gray-100 text-gray-800"}`}>
                    {item.lifecycleState}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--foreground)]">
                  {item.workplaces?.[0]?.user?.fullName || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <a href={`/hardware/${item.id}`} className="text-[var(--primary)] hover:underline text-xs">View</a>
                    <a href={`/hardware/${item.id}/edit`} className="text-[var(--primary)] hover:underline text-xs">Edit</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-[var(--muted-foreground)]">
        Total: {data?.hardwareAssets?.total || 0} items
      </p>
    </div>
  );
}