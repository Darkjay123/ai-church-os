export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
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
        };
        Insert: {
          id?: string;
          name: string;
          denomination?: string | null;
          logo_url?: string | null;
          timezone?: string;
          country?: string | null;
          default_language?: string;
          subscription_plan?: "starter" | "growth" | "pro" | "enterprise";
          subscription_status?: "trial" | "active" | "past_due" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
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
        };
        Insert: {
          id: string;
          organization_id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          status?: "active" | "invited" | "suspended";
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          actor_id: string | null;
          event_type: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          actor_id?: string | null;
          event_type: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
