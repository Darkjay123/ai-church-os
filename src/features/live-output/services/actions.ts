"use server";

import { revalidatePath } from "next/cache";

import type { LiveContent } from "@/features/live-output/types";
import {
  isValidLiveContent,
  toLiveOutputPayload,
} from "@/features/live-output/services/content";
import { logServerEvent } from "@/lib/server-logger";
import { createClient } from "@/lib/supabase/server";

export async function sendLiveContent(content: LiveContent) {
  if (!isValidLiveContent(content)) {
    return { error: "That preview is not valid for live output." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has ended. Please sign in again." };

  const { error } = await supabase.rpc("set_live_output", {
    output_kind: content.kind,
    output_payload: toLiveOutputPayload(content),
  });
  if (error) {
    logServerEvent("error", {
      operation: "set-live-output",
      category: "live-output",
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    if (/start a live service|permission/i.test(error.message)) {
      return { error: error.message };
    }
    return { error: "We could not send this item live. Please try again." };
  }

  revalidatePath("/output");
  revalidatePath("/live-service");
  return { success: "Content is now live on the dedicated output." };
}
