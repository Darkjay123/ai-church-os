"use server";

import { createHash, randomBytes } from "node:crypto";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  invitationSchema,
  organizationSettingsSchema,
  profileSettingsSchema,
  roleAssignmentSchema,
  teamSchema,
} from "@/features/workspace/services/validation";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceActionState } from "@/features/workspace/types";

function validationError(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}) {
  return { fieldErrors: error.flatten().fieldErrors };
}

function refreshWorkspace() {
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

async function getWorkspaceScope() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Your session has ended. Please sign in again.");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .eq("id", user.id)
    .single();
  if (error || !profile) throw new Error("Your workspace could not be loaded.");

  return { supabase, profile };
}

export async function updateOrganization(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = organizationSettingsSchema.safeParse({
    name: formData.get("name"),
    denomination: formData.get("denomination") || undefined,
    timezone: formData.get("timezone"),
    country: formData.get("country") || undefined,
    defaultLanguage: formData.get("defaultLanguage"),
  });
  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, profile } = await getWorkspaceScope();
    const { error } = await supabase
      .from("organizations")
      .update({
        name: parsed.data.name,
        denomination: parsed.data.denomination || null,
        timezone: parsed.data.timezone,
        country: parsed.data.country || null,
        default_language: parsed.data.defaultLanguage,
      })
      .eq("id", profile.organization_id);
    if (error) throw error;
    await supabase.rpc("record_audit_event", {
      target_organization_id: profile.organization_id,
      new_event_type: "workspace.organization_updated",
      new_entity_type: "organization",
      new_entity_id: profile.organization_id,
    });
    refreshWorkspace();
    return { success: "Church profile updated." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "We could not update the church profile.",
    };
  }
}

export async function updateMyProfile(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = profileSettingsSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, profile } = await getWorkspaceScope();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null })
      .eq("id", profile.id);
    if (error) throw error;
    await supabase.rpc("record_audit_event", {
      target_organization_id: profile.organization_id,
      new_event_type: "workspace.profile_updated",
      new_entity_type: "profile",
      new_entity_id: profile.id,
    });
    refreshWorkspace();
    return { success: "Your profile updated." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "We could not update your profile.",
    };
  }
}

export async function createTeam(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase, profile } = await getWorkspaceScope();
    const { error } = await supabase.from("teams").insert({
      organization_id: profile.organization_id,
      name: parsed.data.name,
      description: parsed.data.description || null,
    });
    if (error) throw error;
    await supabase.rpc("record_audit_event", {
      target_organization_id: profile.organization_id,
      new_event_type: "workspace.team_created",
      new_entity_type: "team",
    });
    refreshWorkspace();
    return { success: "Team created." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "We could not create this team.",
    };
  }
}

export async function createInvitation(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = invitationSchema.safeParse({
    email: formData.get("email"),
    roleId: formData.get("roleId"),
    teamId: formData.get("teamId") || "",
  });
  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase } = await getWorkspaceScope();
    const invitationToken = randomBytes(32).toString("base64url");
    const tokenDigest = createHash("sha256").update(invitationToken).digest("hex");
    const { error } = await supabase.rpc("create_workspace_invitation", {
      invitee_email: parsed.data.email,
      target_role_id: parsed.data.roleId,
      target_team_id: parsed.data.teamId || null,
      token_digest: tokenDigest,
    });
    if (error) throw error;

    const origin = (await headers()).get("origin");
    if (!origin) throw new Error("We could not create a secure invite URL.");
    refreshWorkspace();
    return {
      success: "Secure invitation link created. Copy and send it to your teammate.",
      inviteLink: `${origin}/sign-up?invite=${invitationToken}`,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "We could not create this invitation.",
    };
  }
}

export async function assignRole(
  _: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = roleAssignmentSchema.safeParse({
    profileId: formData.get("profileId"),
    roleId: formData.get("roleId"),
  });
  if (!parsed.success) return validationError(parsed.error);

  try {
    const { supabase } = await getWorkspaceScope();
    const { error } = await supabase.rpc("assign_workspace_role", {
      target_profile_id: parsed.data.profileId,
      target_role_id: parsed.data.roleId,
    });
    if (error) throw error;
    refreshWorkspace();
    return { success: "Role assigned." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "We could not assign this role.",
    };
  }
}
