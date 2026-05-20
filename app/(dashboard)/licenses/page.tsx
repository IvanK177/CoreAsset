import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import PageHeader from "@/components/layout/PageHeader";
import { deleteLicensePool } from "@/lib/actions/licenses";
import { daysUntilExpiry, formatDate } from "@/lib/utils";
import { Trash2, BookOpen } from "lucide-react";

export default async function LicensesPage() {
  const supabase = await createClient();
  const { data: pools } = await supabase
    .from("license_pools")
    .select("*, software(name, version)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Лицензии"
        description="Пулы лицензий на программное обеспечение"
        action={{ label: "Добавить пул", href: "/licenses/new" }}
      />
      <div className="flex justify-end mb-4">
        <Link href="/licenses/software" className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}>
          <BookOpen className="w-4 h-4" /> Справочник ПО
        </Link>
      </div>
      {!pools?.length ? (
        <EmptyState message="Пулы лицензий не добавлены" />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>ПО</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Использовано</TableHead>
                <TableHead>Истекает</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pools.map((p) => {
                const sw = p.software as { name: string; version: string | null } | null;
                const days = daysUntilExpiry(p.expires_at);
                const expiring = days !== null && days <= 30;

                return (
                  <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      {sw?.name ?? "—"}{sw?.version ? ` v${sw.version}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {p.license_type === "subscription" ? "Подписка" : "Бессрочная"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={p.used_seats >= p.total_seats ? "text-destructive font-semibold" : ""}>
                        {p.used_seats} / {p.total_seats}
                      </span>
                    </TableCell>
                    <TableCell>
                      {p.expires_at ? (
                        <span className={expiring ? "text-amber-400 font-medium" : "text-muted-foreground"}>
                          {formatDate(p.expires_at)}
                          {expiring && ` (${days} дн.)`}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <form action={async () => { "use server"; await deleteLicensePool(p.id); }}>
                        <Button variant="ghost" size="icon" type="submit">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
