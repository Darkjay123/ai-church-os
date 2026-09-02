export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      organizations: Table<
        {
          id: string;
          name: string;
          denomination: string | null;
          logo_url: string | null;
          timezone: string;
          country: string | null;
          default_language: string;
          subscription_plan: "starter" | "growth" | "pro" | "enterprise";
          subscription_status: "trial" | "active" | "past_due" | "cancelled";
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          denomination?: string | null;
          logo_url?: string | null;
          timezone?: string;
          country?: string | null;
          default_language?: string;
          subscription_plan?: "starter" | "growth" | "pro" | "enterprise";
          subscription_status?: "trial" | "active" | "past_due" | "cancelled";
        }
      >;
      profiles: Table<
        {
          id: string;
          organization_id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          status: "active" | "invited" | "suspended";
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          organization_id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          status?: "active" | "invited" | "suspended";
        }
      >;
      audit_logs: Table<
        {
          id: string;
          organization_id: string;
          actor_id: string | null;
          event_type: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        },
        {
          organization_id: string;
          event_type: string;
          actor_id?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
        }
      >;
      permissions: Table<{
        id: string;
        key: string;
        label: string;
        description: string;
        created_at: string;
      }>;
      roles: Table<
        {
          id: string;
          organization_id: string;
          key: string;
          label: string;
          description: string;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          organization_id: string;
          key: string;
          label: string;
          description: string;
          is_system?: boolean;
        }
      >;
      role_permissions: Table<
        {
          organization_id: string;
          role_id: string;
          permission_id: string;
          created_at: string;
        },
        { organization_id: string; role_id: string; permission_id: string }
      >;
      organization_role_assignments: Table<
        {
          organization_id: string;
          profile_id: string;
          role_id: string;
          assigned_by_profile_id: string | null;
          assigned_at: string;
        },
        {
          organization_id: string;
          profile_id: string;
          role_id: string;
          assigned_by_profile_id?: string | null;
        }
      >;
      teams: Table<
        {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        },
        { organization_id: string; name: string; description?: string | null }
      >;
      team_memberships: Table<
        {
          organization_id: string;
          team_id: string;
          profile_id: string;
          added_by_profile_id: string | null;
          created_at: string;
        },
        {
          organization_id: string;
          team_id: string;
          profile_id: string;
          added_by_profile_id?: string | null;
        }
      >;
      invitations: Table<
        {
          id: string;
          organization_id: string;
          email: string;
          role_id: string;
          invited_by_profile_id: string;
          token_hash: string;
          status: "pending" | "accepted" | "revoked" | "expired";
          expires_at: string;
          accepted_at: string | null;
          revoked_at: string | null;
          created_at: string;
        },
        {
          organization_id: string;
          email: string;
          role_id: string;
          invited_by_profile_id: string;
          token_hash: string;
        }
      >;
      invitation_teams: Table<
        { invitation_id: string; organization_id: string; team_id: string },
        { invitation_id: string; organization_id: string; team_id: string }
      >;
      services: Table<{
        id: string;
        organization_id: string;
        title: string;
        service_type: string;
        scheduled_for: string | null;
        speaker: string | null;
        status: "scheduled" | "live" | "ended";
        started_at: string | null;
        ended_at: string | null;
        created_by_profile_id: string;
        created_at: string;
        updated_at: string;
      }>;
      service_timeline_events: Table<{
        id: string;
        organization_id: string;
        service_id: string;
        actor_id: string | null;
        event_type: "service.created" | "service.started" | "service.ended";
        label: string;
        details: string | null;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      has_organization_permission: {
        Args: { target_organization_id: string; required_permission_key: string };
        Returns: boolean;
      };
      record_audit_event: {
        Args: {
          target_organization_id: string;
          new_event_type: string;
          new_entity_type?: string | null;
          new_entity_id?: string | null;
          new_metadata?: Json;
        };
        Returns: string;
      };
      create_workspace_invitation: {
        Args: {
          invitee_email: string;
          target_role_id: string;
          target_team_id: string | null;
          token_digest: string;
        };
        Returns: string;
      };
      assign_workspace_role: {
        Args: { target_profile_id: string; target_role_id: string };
        Returns: undefined;
      };
      set_workspace_member_status: {
        Args: {
          target_profile_id: string;
          target_status: "active" | "invited" | "suspended";
        };
        Returns: undefined;
      };
      validate_workspace_invitation: {
        Args: { token_digest: string };
        Returns: { email: string }[];
      };
      accept_workspace_invitation: {
        Args: { invitation_token: string };
        Returns: string;
      };
      provision_oauth_workspace: {
        Args: { organization_name: string };
        Returns: string;
      };
      create_live_service: {
        Args: {
          service_title: string;
          service_type_value: string;
          scheduled_for_value?: string | null;
          speaker_value?: string | null;
        };
        Returns: string;
      };
      start_live_service: {
        Args: { target_service_id: string };
        Returns: undefined;
      };
      end_live_service: {
        Args: { target_service_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
