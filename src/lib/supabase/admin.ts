import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Supabase invitation delivery is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the server environment.",
    );
  }

  const { url } = getSupabaseConfig();
  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
