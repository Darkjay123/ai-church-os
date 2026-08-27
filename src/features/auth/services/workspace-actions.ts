"use server";

import { redirect } from "next/navigation";

import { workspaceProvisioningSchema } from "@/features/auth/services/workspace-provisioning";
import { logServerEvent } from "@/lib/server-logger";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceProvisioningState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function provisionGoogleWorkspace(
  _: WorkspaceProvisioningState,
  formData: FormData,
): Promise<WorkspaceProvisioningState> {
  const parsed = workspaceProvisioningSchema.safeParse({
    churchName: formData.get("churchName"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const requestId = crypto.randomUUID();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session has ended. Sign in again to create your workspace." };
  }

  const { error } = await supabase.rpc("provision_oauth_workspace", {
    organization_name: parsed.data.churchName,
  });
  if (error) {
    logServerEvent("error", {
      operation: "provision-oauth-workspace",
      requestId,
      userId: user.id,
      category: "database",
      code: error.code,
      message: error.message,
    });
    return { error: "We could not create your workspace. Please try again." };
  }

  logServerEvent("info", {
    operation: "provision-oauth-workspace",
    requestId,
    userId: user.id,
    category: "auth",
  });
  redirect("/dashboard");
}
