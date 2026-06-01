"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { compressText, decompressText } from "@/lib/compression";

/**
  * Assign a room request to "in_progress" status.
  */
export async function takeRoomRequestToWork(id: string) {
  const supabase = createServiceClient();

  const { data: current } = await supabase
    .from("room_requests")
    .select("description")
    .eq("id", id)
    .single();

  let description = current?.description ?? "";
  if (description.startsWith("gz:")) {
    description = await decompressText(description);
  }

  const { error } = await supabase
    .from("room_requests")
    .update({ status: "in_progress", description })
    .eq("id", id);

  if (error) {
    console.error("[takeRoomRequestToWork] Error:", error.message);
    return { error: error.message };
  }

  revalidateTag("room_requests", { expire: 0 });
  revalidatePath("/portal");
  revalidatePath("/incidents");
  revalidatePath("/facilities-portal");
  return { success: true };
}

export async function resolveRoomRequest(id: string, resolution: string = "", resolutionPhotoUrls: string[] = []) {
  const supabase = createServiceClient();

  const { data: current } = await supabase
    .from("room_requests")
    .select("description")
    .eq("id", id)
    .single();

  const description = current?.description ?? "";
  const plainDescription = description.startsWith("gz:") ? await decompressText(description) : description;
  const compressedDescription = await compressText(plainDescription);

  const { error } = await supabase
    .from("room_requests")
    .update({ 
      status: "resolved", 
      description: compressedDescription,
      resolution: resolution.trim() || null,
      resolution_photo_urls: resolutionPhotoUrls,
    })
    .eq("id", id);

  if (error) {
    console.error("[resolveRoomRequest] Error:", error.message);
    return { error: error.message };
  }

  revalidateTag("room_requests", { expire: 0 });
  revalidatePath("/portal");
  revalidatePath("/incidents");
  revalidatePath("/facilities-portal");
  return { success: true };
}
