"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql-client";

const WORKPLACES_QUERY = `
  query($skip: Int, $take: Int, $search: String, $location: String) {
    workplaces(skip: $skip, take: $take, search: $search, location: $location) {
      items {
        id
        name
        location
        createdAt
        user {
          id
          fullName
          department
        }
        hardware {
          id
          name
          type
          lifecycleState
        }
      }
      total
    }
  }
`;

export default function WorkplacesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["workplaces"],
    queryFn: () => graphqlRequest(WORKPLACES_QUERY),
  });

  if (isLoading) return <div className="py-20 text-center text-[var(--muted-foreground)]">Loading workplaces...</div>;
  if (error) return <div className="py-10 text-center text-[var(--destructive)]">Error: {error.message}</div>;

  const items = data?.workplaces?.items || [];

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
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Workplaces</h1>
        <a
          href="/workplaces/new"
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90"
        >
          + Add Workplace
        </a>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Name</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Location</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Assigned User</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Department</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Hardware</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">HW Status</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                  No workplaces found
                </td>
              </tr>
            ) : (
              items.map((wp: any) => (
                <tr key={wp.id} className="border-b border-[var(--border)] hover:bg-[var(--accent)]/50">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{wp.name}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{wp.location || "—"}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{wp.user?.fullName || "Unassigned"}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{wp.user?.department || "—"}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{wp.hardware?.name || "None"}</td>
                  <td className="px-4 py-3">
                    {wp.hardware?.lifecycleState ? (
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${stateColors[wp.hardware.lifecycleState] || "bg-gray-100 text-gray-800"}`}>
                        {wp.hardware.lifecycleState}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/workplaces/${wp.id}`} className="text-[var(--primary)] hover:underline text-xs">
                      View
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-[var(--muted-foreground)]">
        Total: {data?.workplaces?.total || 0} workplaces
      </div>
    </div>
  );
}