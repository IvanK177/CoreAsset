"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql-client";

const LICENSES_QUERY = `
  query($skip: Int, $take: Int, $softwareId: String) {
    licenses(skip: $skip, take: $take, softwareId: $softwareId) {
      items {
        id
        licenseKey
        concurrencyLimit
        purchaseDate
        expiryDate
        price
        createdAt
        software {
          id
          softwareName
          version
          publisher
          category
        }
        installations {
          id
          status
          hardware {
            id
            name
          }
        }
        usedCount
        availableCount
        isOverLimit
      }
      total
    }
  }
`;

export default function LicensesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["licenses"],
    queryFn: () => graphqlRequest(LICENSES_QUERY),
  });

  if (isLoading) return <div className="py-20 text-center text-[var(--muted-foreground)]">Loading licenses...</div>;
  if (error) return <div className="py-10 text-center text-[var(--destructive)]">Error: {error.message}</div>;

  const items = data?.licenses?.items || [];

  const getStatusBadge = (used: number, limit: number, isOverLimit: boolean) => {
    if (isOverLimit) return "bg-red-100 text-red-800";
    if (used >= limit * 0.8) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusLabel = (used: number, limit: number, isOverLimit: boolean) => {
    if (isOverLimit) return "OVER LIMIT";
    if (used >= limit * 0.8) return "LOW";
    return "OK";
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Licenses</h1>
        <a
          href="/licenses/new"
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90"
        >
          + Add License
        </a>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Software</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Version</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Publisher</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">License Key</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Limit</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Used</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Available</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Status</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Expiry</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                  No licenses found
                </td>
              </tr>
            ) : (
              items.map((lic: any) => (
                <tr key={lic.id} className="border-b border-[var(--border)] hover:bg-[var(--accent)]/50">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{lic.software?.softwareName}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{lic.software?.version}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{lic.software?.publisher}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    <span className="font-mono text-xs">{lic.licenseKey ? `${lic.licenseKey.slice(0, 8)}...` : "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{lic.concurrencyLimit}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{lic.usedCount ?? lic.installations?.length ?? 0}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{lic.availableCount ?? (lic.concurrencyLimit - (lic.usedCount ?? 0))}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(lic.usedCount ?? 0, lic.concurrencyLimit, lic.isOverLimit ?? false)}`}>
                      {getStatusLabel(lic.usedCount ?? 0, lic.concurrencyLimit, lic.isOverLimit ?? false)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lic.expiryDate ? (
                      <span className={`text-xs ${isExpired(lic.expiryDate) ? "text-red-600 font-semibold" : isExpiringSoon(lic.expiryDate) ? "text-yellow-600 font-semibold" : "text-[var(--foreground)]"}`}>
                        {new Date(lic.expiryDate).toLocaleDateString()}
                        {isExpired(lic.expiryDate) && " (Expired)"}
                        {isExpiringSoon(lic.expiryDate) && " (Soon)"}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <a href={`/licenses/${lic.id}`} className="text-[var(--primary)] hover:underline text-xs">
                      View
                    </a>
                    <button
                      className="text-[var(--primary)] hover:underline text-xs"
                      onClick={() => {
                        /* TODO: assign license dialog */
                      }}
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-[var(--muted-foreground)]">
        Total: {data?.licenses?.total || 0} licenses
      </div>
    </div>
  );
}