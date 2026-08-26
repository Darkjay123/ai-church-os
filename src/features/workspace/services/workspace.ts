import { canUsePreviewFallback, getSupabaseConfig, hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  WorkspaceInvitation,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceSettingsData,
  WorkspaceTeam,
} from "@/features/workspace/types";

const fallbackData: WorkspaceSettingsData = {
  isConfigured: false,
  organization: {
    id: "foundation-preview",
    name: "Your Church Workspace",
    denomination: null,
    timezone: "Africa/Lagos",
    country: null,
    defaultLanguage: "en",
    subscriptionPlan: "starter",
  },
  currentProfile: {
    id: "foundation-preview-user",
    fullName: "Workspace owner",
    email: "owner@example.com",
  },
  roles: [],
  teams: [],
  members: [],
  invitations: [],
  permissions: {
    manageOrganization: false,
    manageMembers: false,
    manageTeams: false,
    manageRoles: false,
  },
};

export type WorkspaceShellContext = {
  organization: { id: string; name: string; timezone: string } | null;
  profile: { id: string; fullName: string | null; email: string } | null;
};

export async function getWorkspaceShellContext(): Promise<WorkspaceShellContext> {
  if (!hasSupabaseConfig()) {
    getSupabaseConfig();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { organization: null, profile: null };

  const profileResult = await supabase
    .from("profiles")
    .select("id, organization_id, full_name, email")
    .eq("id", user.id)
    .maybeSingle();
  if (profileResult.error) {
    logWorkspaceFailure("load-profile", profileResult.error);
    return { organization: null, profile: null };
  }
  const profile = profileResult.data;
  if (!profile) return { organization: null, profile: null };

  const organizationResult = await supabase
    .from("organizations")
    .select("id, name, timezone")
    .eq("id", profile.organization_id)
    .maybeSingle();
  if (organizationResult.error) {
    logWorkspaceFailure("load-organization", organizationResult.error);
    return { organization: null, profile: null };
  }
  const organization = organizationResult.data;
  if (!organization) return { organization: null, profile: null };

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      timezone: organization.timezone,
    },
    profile: { id: profile.id, fullName: profile.full_name, email: profile.email },
  };
}

export async function getWorkspaceSettingsData(): Promise<WorkspaceSettingsData> {
  if (!hasSupabaseConfig()) {
    if (canUsePreviewFallback()) return fallbackData;
    getSupabaseConfig();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fallbackData;

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("id, organization_id, full_name, email")
    .eq("id", user.id)
    .single();
  if (!currentProfile) return fallbackData;

  const organizationId = currentProfile.organization_id;
  const [
    organizationResult,
    profilesResult,
    rolesResult,
    assignmentsResult,
    rolePermissionsResult,
    permissionsResult,
    teamsResult,
    membershipsResult,
    invitationsResult,
    invitationTeamsResult,
    authorizationResults,
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select(
        "id, name, denomination, timezone, country, default_language, subscription_plan",
      )
      .eq("id", organizationId)
      .single(),
    supabase
      .from("profiles")
      .select("id, email, full_name, status")
      .eq("organization_id", organizationId)
      .order("created_at"),
    supabase
      .from("roles")
      .select("id, key, label, description")
      .eq("organization_id", organizationId)
      .order("label"),
    supabase
      .from("organization_role_assignments")
      .select("profile_id, role_id")
      .eq("organization_id", organizationId),
    supabase
      .from("role_permissions")
      .select("role_id, permission_id")
      .eq("organization_id", organizationId),
    supabase.from("permissions").select("id, key, label"),
    supabase
      .from("teams")
      .select("id, name, description")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase
      .from("team_memberships")
      .select("profile_id, team_id")
      .eq("organization_id", organizationId),
    supabase
      .from("invitations")
      .select("id, email, role_id, expires_at")
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("invitation_teams")
      .select("invitation_id, team_id")
      .eq("organization_id", organizationId),
    Promise.all(
      ["organization.manage", "members.manage", "teams.manage", "roles.manage"].map(
        async (permission) => {
          const { data } = await supabase.rpc("has_organization_permission", {
            target_organization_id: organizationId,
            required_permission_key: permission,
          });
          return Boolean(data);
        },
      ),
    ),
  ]);

  const organization = organizationResult.data;
  if (!organization) return fallbackData;
  const permissionsById = new Map(
    (permissionsResult.data ?? []).map((item) => [item.id, item]),
  );
  const rolePermissionIds = new Map<string, string[]>();
  for (const item of rolePermissionsResult.data ?? [])
    rolePermissionIds.set(item.role_id, [
      ...(rolePermissionIds.get(item.role_id) ?? []),
      item.permission_id,
    ]);
  const roles: WorkspaceRole[] = (rolesResult.data ?? []).map((role) => ({
    ...role,
    permissions: (rolePermissionIds.get(role.id) ?? []).map(
      (id) => permissionsById.get(id)?.label ?? "Unknown permission",
    ),
  }));
  const roleIdsByProfile = new Map<string, string[]>();
  for (const item of assignmentsResult.data ?? [])
    roleIdsByProfile.set(item.profile_id, [
      ...(roleIdsByProfile.get(item.profile_id) ?? []),
      item.role_id,
    ]);
  const teamIdsByProfile = new Map<string, string[]>();
  const memberCounts = new Map<string, number>();
  for (const item of membershipsResult.data ?? []) {
    teamIdsByProfile.set(item.profile_id, [
      ...(teamIdsByProfile.get(item.profile_id) ?? []),
      item.team_id,
    ]);
    memberCounts.set(item.team_id, (memberCounts.get(item.team_id) ?? 0) + 1);
  }
  const members: WorkspaceMember[] = (profilesResult.data ?? []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    status: profile.status,
    roleIds: roleIdsByProfile.get(profile.id) ?? [],
    teamIds: teamIdsByProfile.get(profile.id) ?? [],
  }));
  const teams: WorkspaceTeam[] = (teamsResult.data ?? []).map((team) => ({
    ...team,
    memberCount: memberCounts.get(team.id) ?? 0,
  }));
  const invitedTeamIds = new Map<string, string[]>();
  for (const item of invitationTeamsResult.data ?? [])
    invitedTeamIds.set(item.invitation_id, [
      ...(invitedTeamIds.get(item.invitation_id) ?? []),
      item.team_id,
    ]);
  const invitations: WorkspaceInvitation[] = (invitationsResult.data ?? []).map(
    (invite) => ({
      id: invite.id,
      email: invite.email,
      roleId: invite.role_id,
      teamIds: invitedTeamIds.get(invite.id) ?? [],
      expiresAt: invite.expires_at,
    }),
  );

  return {
    isConfigured: true,
    organization: {
      id: organization.id,
      name: organization.name,
      denomination: organization.denomination,
      timezone: organization.timezone,
      country: organization.country,
      defaultLanguage: organization.default_language,
      subscriptionPlan: organization.subscription_plan,
    },
    currentProfile: {
      id: currentProfile.id,
      fullName: currentProfile.full_name,
      email: currentProfile.email,
    },
    roles,
    teams,
    members,
    invitations,
    permissions: {
      manageOrganization: authorizationResults[0],
      manageMembers: authorizationResults[1],
      manageTeams: authorizationResults[2],
      manageRoles: authorizationResults[3],
    },
  };
}

function logWorkspaceFailure(
  operation: "load-profile" | "load-organization",
  error: {
    code?: string;
    message: string;
    details?: string | null;
    hint?: string | null;
  },
) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[workspace] Supabase request failed", {
      operation,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }
}
