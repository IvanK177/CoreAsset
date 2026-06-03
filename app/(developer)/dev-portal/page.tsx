export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import { extractJoinObject } from "@/lib/utils";
import DevPortalClientView from "@/components/developer/DevPortalClientView";

export default async function DevPortalPage() {
  const supabase = createServiceClient();

  const { data: supportRequests } = await supabase
    .from("support_requests")
    .select(`
      id,
      message,
      status,
      created_at,
      author_id,
      employees!support_requests_author_id_fkey(
        id,
        full_name,
        position,
        room,
        building,
        email
      )
    `)
    .order("created_at", { ascending: false });

  const normalized = (supportRequests ?? []).map((req) => ({
    id: req.id,
    message: req.message,
    status: req.status,
    created_at: req.created_at,
    author_id: req.author_id,
    employee: extractJoinObject(req.employees) as {
      id: string;
      full_name: string;
      position: string | null;
      room: string | null;
      building: string | null;
      email: string;
    } | null,
  }));

  return (
    <DevPortalClientView
      requests={normalized}
    />
  );
}
