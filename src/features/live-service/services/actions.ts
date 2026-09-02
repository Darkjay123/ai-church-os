"use server";

import { revalidatePath } from "next/cache";

import {
  liveServiceSchema,
  parseScheduledFor,
} from "@/features/live-service/services/validation";
import type { LiveServiceActionState } from "@/features/live-service/types";
import { logServerEvent } from "@/lib/server-logger";
import { createClient } from "@/lib/supabase/server";

function refreshLiveService() {
  revalidatePath("/live-service");
  revalidatePath("/dashboard");
}

export async function createLiveService(
  _: LiveServiceActionState,
  formData: FormData,
): Promise<LiveServiceActionState> {
  const parsed = liveServiceSchema.safeParse({
    title: formData.get("title"),
    serviceType: formData.get("serviceType"),
    scheduledFor: formData.get("scheduledFor") || undefined,
    speaker: formData.get("speaker") || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const scheduledFor = parseScheduledFor(parsed.data.scheduledFor);
  if ("error" in scheduledFor) {
    return {
      fieldErrors: {
        scheduledFor: [scheduledFor.error ?? "Enter a valid service date and time."],
      },
    };
  }

  try {
    const { supabase } = await getLiveServiceScope();
    const { error } = await supabase.rpc("create_live_service", {
      service_title: parsed.data.title,
      service_type_value: parsed.data.serviceType,
      scheduled_for_value: scheduledFor.data,
      speaker_value: parsed.data.speaker || null,
    });
    if (error) throw error;
    refreshLiveService();
    return { success: "Service created. Start service mode when your team is ready." };
  } catch (error) {
    logActionFailure("create-service", error);
    return { error: getSafeServiceError(error, "create") };
  }
}

export async function startLiveService(
  _: LiveServiceActionState,
  formData: FormData,
): Promise<LiveServiceActionState> {
  return changeServiceStatus(formData, "start");
}

export async function endLiveService(
  _: LiveServiceActionState,
  formData: FormData,
): Promise<LiveServiceActionState> {
  return changeServiceStatus(formData, "end");
}

async function changeServiceStatus(formData: FormData, action: "start" | "end") {
  const serviceId = formData.get("serviceId");
  if (typeof serviceId !== "string" || !isUuid(serviceId)) {
    return { error: "The selected service is unavailable. Refresh and try again." };
  }

  try {
    const { supabase } = await getLiveServiceScope();
    const { error } = await supabase.rpc(
      action === "start" ? "start_live_service" : "end_live_service",
      { target_service_id: serviceId },
    );
    if (error) throw error;
    refreshLiveService();
    return {
      success: action === "start" ? "Service mode is live." : "Service mode ended.",
    };
  } catch (error) {
    logActionFailure(`${action}-service`, error);
    return { error: getSafeServiceError(error, action) };
  }
}

async function getLiveServiceScope() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Your session has ended. Please sign in again.");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (error || !profile) throw new Error("Your workspace could not be loaded.");

  return { supabase, userId: user.id, organizationId: profile.organization_id };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getSafeServiceError(error: unknown, action: "create" | "start" | "end") {
  const message = error instanceof Error ? error.message : "";
  if (
    /permission|another service is already live|already live|cannot be restarted|only a live service|selected service/i.test(
      message,
    )
  ) {
    return message;
  }
  if (message === "Your session has ended. Please sign in again.") return message;
  if (action === "create") return "We could not create this service. Please try again.";
  return `We could not ${action} service mode. Please try again.`;
}

function logActionFailure(operation: string, error: unknown) {
  const supabaseError = error as { code?: string; status?: number; message?: string };
  logServerEvent("error", {
    operation,
    category: "live-service",
    code: supabaseError?.code,
    status: supabaseError?.status,
    message: supabaseError?.message ?? "Live Service action failed",
  });
}
