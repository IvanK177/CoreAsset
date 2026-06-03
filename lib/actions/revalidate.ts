'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from "./auth";

export async function clearCache(path: string) {
  await requireAuth();
  revalidatePath(path, 'page')
}