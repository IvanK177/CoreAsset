import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import PageHeader from "@/components/layout/PageHeader";
import { deleteSoftware } from "@/lib/actions/licenses";
import { Trash2 } from "lucide-react";

export default async function SoftwareCatalogPage() {
  const supabase = await createClient();
  const { data: software } = await supabase.from("software").select("*").order("name");

  return (
    <div>
      <PageHeader
        title="Справочник ПО"
        description="Список программного обеспечения"
        action={{ label: "Добавить ПО", href: "/licenses/software/new" }}
      />
      {!software?.length ? (
        <EmptyState message="ПО не добавлено" />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Название</TableHead>
                <TableHead>Версия</TableHead>
                <TableHead>Вендор</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {software.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.version ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.vendor ?? "—"}</TableCell>
                  <TableCell>
                    <form action={async () => { "use server"; await deleteSoftware(s.id); }}>
                      <Button variant="ghost" size="icon" type="submit">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="mt-4">
        <Link href="/licenses" className={buttonVariants({ variant: "outline", size: "sm" })}>← К лицензиям</Link>
      </div>
    </div>
  );
}
