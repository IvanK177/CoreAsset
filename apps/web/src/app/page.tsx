"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql-client";

const DASHBOARD_QUERY = `
  query {
    dashboardStats {
      hardware {
        total
        byState {
          state
          count
        }
        byType {
          type
          count
        }
      }
      users {
        total
      }
      workplaces {
        total
      }
      software {
        total
      }
      licenses {
        total
        stats {
          id
          softwareName
          version
          concurrencyLimit
          usedCount
          availableCount
          isOverLimit
          expiryDate
        }
        expiringSoon {
          id
          softwareName
          expiryDate
        }
      }
      faults {
        total
        byStatus {
          status
          count
        }
        bySeverity {
          severity
          count
        }
      }
    }
  }
`;

interface DashboardStats {
  hardware: {
    total: number;
    byState: Array<{ state: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
  };
  users: { total: number };
  workplaces: { total: number };
  software: { total: number };
  licenses: {
    total: number;
    stats: Array<{
      id: string;
      softwareName: string;
      version: string;
      concurrencyLimit: number;
      usedCount: number;
      availableCount: number;
      isOverLimit: boolean;
      expiryDate: string | null;
    }>;
    expiringSoon: Array<{ id: string; softwareName: string; expiryDate: string }>;
  };
  faults: {
    total: number;
    byStatus: Array<{ status: string; count: number }>;
    bySeverity: Array<{ severity: string; count: number }>;
  };
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<{ dashboardStats: DashboardStats }>({
    queryKey: ["dashboardStats"],
    queryFn: () => graphqlRequest(DASHBOARD_QUERY),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[var(--muted-foreground)]">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <div className="text-[var(--destructive)]">Error loading dashboard: {error.message}</div>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Make sure the GraphQL API is running at {process.env.NEXT_PUBLIC_GRAPHQL_API_URL || "http://localhost:4000/graphql"}
        </p>
      </div>
    );
  }

  const stats = data?.dashboardStats;

  if (!stats) return null;

  const stateColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    in_repair: "bg-yellow-100 text-yellow-800",
    in_storage: "bg-gray-100 text-gray-800",
    decommissioned: "bg-red-100 text-red-800",
    disposed: "bg-purple-100 text-purple-800",
  };

  const severityColors: Record<string, string> = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-[var(--foreground)]">Dashboard — CoreAsset ITAM</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="text-sm font-medium text-[var(--muted-foreground)]">Total Hardware</h3>
          <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{stats.hardware.total}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="text-sm font-medium text-[var(--muted-foreground)]">Total Users</h3>
          <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{stats.users.total}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="text-sm font-medium text-[var(--muted-foreground)]">Total Workplaces</h3>
          <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{stats.workplaces.total}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="text-sm font-medium text-[var(--muted-foreground)]">Open Incidents</h3>
          <p className="mt-2 text-3xl font-bold text-[var(--destructive)]">
            {stats.faults.byStatus.find((s) => s.status === "open")?.count || 0}
          </p>
        </div>
      </div>

      {/* Hardware by State */}
      <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">Hardware by Lifecycle State</h2>
        <div className="flex gap-4">
          {stats.hardware.byState.map((item) => (
            <div
              key={item.state}
              className={`rounded-full px-4 py-2 text-sm font-medium ${stateColors[item.state] || "bg-gray-100 text-gray-800"}`}
            >
              {item.state}: {item.count}
            </div>
          ))}
        </div>
      </div>

      {/* Hardware by Type */}
      <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">Hardware by Type</h2>
        <div className="flex gap-4">
          {stats.hardware.byType.map((item) => (
            <div key={item.type} className="rounded-lg bg-[var(--secondary)] px-4 py-2 text-sm font-medium text-[var(--secondary-foreground)]">
              {item.type}: {item.count}
            </div>
          ))}
        </div>
      </div>

      {/* License Usage */}
      <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">License Usage ({stats.licenses.total} total)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-[var(--muted-foreground)]">Software</th>
                <th className="px-4 py-3 text-[var(--muted-foreground)]">Version</th>
                <th className="px-4 py-3 text-[var(--muted-foreground)]">Limit</th>
                <th className="px-4 py-3 text-[var(--muted-foreground)]">Used</th>
                <th className="px-4 py-3 text-[var(--muted-foreground)]">Available</th>
                <th className="px-4 py-3 text-[var(--muted-foreground)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.licenses.stats.map((license) => (
                <tr key={license.id} className="border-b border-[var(--border)]">
                  <td className="px-4 py-3 text-[var(--foreground)]">{license.softwareName}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{license.version}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{license.concurrencyLimit}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{license.usedCount}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">
                    {license.availableCount > 0 ? license.availableCount : "0"}
                  </td>
                  <td className="px-4 py-3">
                    {license.isOverLimit ? (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">OVER LIMIT</span>
                    ) : license.availableCount <= 2 ? (
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">LOW</span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fault Incidents */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">Incidents by Status ({stats.faults.total})</h2>
          <div className="flex gap-4">
            {stats.faults.byStatus.map((item) => (
              <div key={item.status} className="rounded-lg bg-[var(--secondary)] px-4 py-2 text-sm font-medium text-[var(--secondary-foreground)]">
                {item.status}: {item.count}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">Incidents by Severity</h2>
          <div className="flex gap-4">
            {stats.faults.bySeverity.map((item) => (
              <div
                key={item.severity}
                className={`rounded-full px-4 py-2 text-sm font-medium ${severityColors[item.severity] || "bg-gray-100 text-gray-800"}`}
              >
                {item.severity}: {item.count}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expiring Licenses */}
      {stats.licenses.expiringSoon.length > 0 && (
        <div className="mt-8 rounded-lg border border-orange-300 bg-orange-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-orange-800">⚠️ Licenses Expiring Soon (within 30 days)</h2>
          <ul className="space-y-2">
            {stats.licenses.expiringSoon.map((l) => (
              <li key={l.id} className="text-orange-700">
                {l.softwareName} — expires {new Date(l.expiryDate).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}