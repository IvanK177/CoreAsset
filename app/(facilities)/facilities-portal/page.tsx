export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getCachedRoomRequests } from "@/lib/supabase/cached";
import { extractJoinObject } from "@/lib/utils";
import FacilitiesPortalClientView from "@/components/facilities/FacilitiesPortalClientView";

export default async function FacilitiesPortalPage() {
  const roomRequests = await getCachedRoomRequests();

  type RawRoomRequest = Awaited<ReturnType<typeof getCachedRoomRequests>>[number];

  const normalized = roomRequests.map((req: RawRoomRequest) => ({
    ...req,
    employee: extractJoinObject(req.employees as unknown) as {
      id: string;
      full_name: string;
      position: string | null;
      room: string | null;
      building: string | null;
    } | null,
  }));

  return (
    <FacilitiesPortalClientView
      requests={normalized}
    />
  );
}
