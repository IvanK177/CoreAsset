"use client";

import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphql-client";

const USERS_QUERY = `
  query {
    users {
      items {
        id
        employeeId
        fullName
        email
        department
        position
        workplaces {
          id
          hardware {
            name
          }
        }
      }
      total
    }
  }
`;

export default function UsersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => graphqlRequest(USERS_QUERY),
  });

  if (isLoading) return <div className="py-20 text-center text-[var(--muted-foreground)]">Loading users...</div>;
  if (error) return <div className="py-10 text-center text-[var(--destructive)]">Error: {error.message}</div>;

  const items = data?.users?.items || [];

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-[var(--foreground)]">Users</h1>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Employee ID</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Full Name</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Email</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Department</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Position</th>
              <th className="px-4 py-3 text-[var(--muted-foreground)]">Hardware</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                <td className="px-4 py-3 text-[var(--foreground)]">{item.employeeId}</td>
                <td className="px-4 py-3 text-[var(--primary)] font-medium">{item.fullName}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{item.email}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{item.department || "—"}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{item.position || "—"}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">
                  {item.workplaces?.[0]?.hardware?.name || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-[var(--muted-foreground)]">Total: {data?.users?.total || 0} users</p>
    </div>
  );
}