"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { graphqlRequest } from "@/lib/graphql-client";

const HARDWARE_DETAIL_QUERY = `
  query($id: String!) {
    hardwareAsset(id: $id) {
      id
      serialNumber
      name
      type
      brand
      model
      lifecycleState
      purchaseDate
      warrantyEndDate
      discoveryMetadata
      createdAt
      updatedAt
      workplaces {
        id
        name
        location
        user {
          id
          fullName
          email
          department
          position
        }
      }
      softwareInstallations {
        id
        status
        installedAt
        license {
          id
          licenseKey
          concurrencyLimit
          software {
            softwareName
            version
            publisher
          }
        }
      }
      faultHistoryIncidents {
        id
        incidentDescription
        severity
        status
        reportedAt
        resolvedAt
      }
    }
  }
`;

const stateColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  in_repair: "bg-yellow-100 text-yellow-800",
  in_storage: "bg-gray-100 text-gray-800",
  decommissioned: "bg-red-100 text-red-800",
  disposed: "bg-purple-100 text-purple-800",
};

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
};

export default function HardwareDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["hardwareAsset", id],
    queryFn: () => graphqlRequest(HARDWARE_DETAIL_QUERY, { id }),
    enabled: !!id,
  });

  if (isLoading) return <div className="py-20 text-center text-[var(--muted-foreground)]">Loading hardware details...</div>;
  if (error) return <div className="py-10 text-center text-[var(--destructive)]">Error: {error.message}</div>;

  const hw = data?.hardwareAsset;

  if (!hw) return <div className="py-10 text-center text-[var(--muted-foreground)]">Hardware asset not found</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">{hw.name}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Serial: {hw.serialNumber}</p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/hardware/${id}/edit`}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)]"
          >
            Edit
          </a>
          <button
            className="rounded-lg bg-[var(--destructive)] px-4 py-2 text-sm font-medium text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/90"
            onClick={() => {
              if (confirm("Are you sure you want to delete this hardware asset? This action will check for dependent records.")) {
                /* TODO: delete mutation */
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">General Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[var(--muted-foreground)]">Type:</span>
            <span className="ml-2 text-[var(--foreground)]">{hw.type}</span>
          </div>
          <div>
            <span className="text-[var(--muted-foreground)]">Brand / Model:</span>
            <span className="ml-2 text-[var(--foreground)]">{hw.brand} {hw.model}</span>
          </div>
          <div>
            <span className="text-[var(--muted-foreground)]">Lifecycle State:</span>
            <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${stateColors[hw.lifecycleState] || "bg-gray-100 text-gray-800"}`}>
              {hw.lifecycleState}
            </span>
          </div>
          <div>
            <span className="text-[var(--muted-foreground)]">Purchase Date:</span>
            <span className="ml-2 text-[var(--foreground)]">{hw.purchaseDate ? new Date(hw.purchaseDate).toLocaleDateString() : "—"}</span>
          </div>
          <div>
            <span className="text-[var(--muted-foreground)]">Warranty End:</span>
            <span className="ml-2 text-[var(--foreground)]">{hw.warrantyEndDate ? new Date(hw.warrantyEndDate).toLocaleDateString() : "—"}</span>
          </div>
          <div>
            <span className="text-[var(--muted-foreground)]">Created:</span>
            <span className="ml-2 text-[var(--foreground)]">{new Date(hw.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Workplace Assignment */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Workplace Assignment</h2>
        {hw.workplaces && hw.workplaces.length > 0 ? (
          hw.workplaces.map((wp: any) => (
            <div key={wp.id} className="mb-3 p-4 rounded-md bg-[var(--accent)]/30">
              <div className="font-medium text-[var(--foreground)]">{wp.name} — {wp.location || "No location"}</div>
              {wp.user && (
                <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                  User: {wp.user.fullName} ({wp.user.department}, {wp.user.position})
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-[var(--muted-foreground)]">Not assigned to any workplace</p>
        )}
      </div>

      {/* Software Installations */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Installed Software</h2>
        {hw.softwareInstallations && hw.softwareInstallations.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="pb-2 text-[var(--muted-foreground)]">Software</th>
                <th className="pb-2 text-[var(--muted-foreground)]">Version</th>
                <th className="pb-2 text-[var(--muted-foreground)]">Publisher</th>
                <th className="pb-2 text-[var(--muted-foreground)]">Status</th>
                <th className="pb-2 text-[var(--muted-foreground)]">Installed</th>
              </tr>
            </thead>
            <tbody>
              {hw.softwareInstallations.map((inst: any) => (
                <tr key={inst.id} className="border-b border-[var(--border)]">
                  <td className="py-2 text-[var(--foreground)]">{inst.license?.software?.softwareName}</td>
                  <td className="py-2 text-[var(--foreground)]">{inst.license?.software?.version}</td>
                  <td className="py-2 text-[var(--muted-foreground)]">{inst.license?.software?.publisher}</td>
                  <td className="py-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${inst.status === "installed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="py-2 text-[var(--muted-foreground)]">{inst.installedAt ? new Date(inst.installedAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[var(--muted-foreground)]">No software installed</p>
        )}
      </div>

      {/* Fault History */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Fault History</h2>
        {hw.faultHistoryIncidents && hw.faultHistoryIncidents.length > 0 ? (
          <div className="space-y-3">
            {hw.faultHistoryIncidents.map((fault: any) => (
              <div key={fault.id} className="p-4 rounded-md border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[fault.severity] || "bg-gray-100 text-gray-800"}`}>
                    {fault.severity}
                  </span>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[fault.status] || "bg-gray-100 text-gray-800"}`}>
                    {fault.status}
                  </span>
                </div>
                <p className="text-[var(--foreground)]">{fault.incidentDescription}</p>
                <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Reported: {new Date(fault.reportedAt).toLocaleDateString()}
                  {fault.resolvedAt && ` | Resolved: ${new Date(fault.resolvedAt).toLocaleDateString()}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--muted-foreground)]">No fault incidents recorded</p>
        )}
      </div>
    </div>
  );
}