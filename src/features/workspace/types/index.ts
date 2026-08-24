export type WorkspaceSection = "profile" | "team" | "roles";

export type WorkspaceRole = {
  id: string;
  key: string;
  label: string;
  description: string;
  permissions: string[];
};

export type WorkspaceTeam = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
};

export type WorkspaceMember = {
  id: string;
  email: string;
  fullName: string | null;
  status: "active" | "invited" | "suspended";
  roleIds: string[];
  teamIds: string[];
};

export type WorkspaceInvitation = {
  id: string;
  email: string;
  roleId: string;
  teamIds: string[];
  expiresAt: string;
};

export type WorkspaceSettingsData = {
  isConfigured: boolean;
  organization: {
    id: string;
    name: string;
    denomination: string | null;
    timezone: string;
    country: string | null;
    defaultLanguage: string;
    subscriptionPlan: "starter" | "growth" | "pro" | "enterprise";
  };
  currentProfile: {
    id: string;
    fullName: string | null;
    email: string;
  };
  roles: WorkspaceRole[];
  teams: WorkspaceTeam[];
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
  permissions: {
    manageOrganization: boolean;
    manageMembers: boolean;
    manageTeams: boolean;
    manageRoles: boolean;
  };
};

export type WorkspaceActionState = {
  error?: string;
  success?: string;
  inviteLink?: string;
  fieldErrors?: Record<string, string[]>;
};
