import { createClient } from "@/lib/supabase/server";

export type LivePresentationScope = {
  organizationId: string | null;
  activeServiceTitle: string | null;
  canSendMedia: boolean;
  canSendScripture: boolean;
};

export async function getLivePresentationScope(): Promise<LivePresentationScope> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return emptyScope();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return emptyScope();

  const organizationId = profile.organization_id;
  const [serviceResult, mediaPermission, scripturePermission] = await Promise.all([
    supabase
      .from("services")
      .select("title")
      .eq("organization_id", organizationId)
      .eq("status", "live")
      .maybeSingle(),
    supabase.rpc("has_organization_permission", {
      target_organization_id: organizationId,
      required_permission_key: "presentations.manage",
    }),
    supabase.rpc("has_organization_permission", {
      target_organization_id: organizationId,
      required_permission_key: "scriptures.display",
    }),
  ]);

  return {
    organizationId,
    activeServiceTitle: serviceResult.data?.title ?? null,
    canSendMedia: Boolean(mediaPermission.data),
    canSendScripture: Boolean(scripturePermission.data),
  };
}

function emptyScope(): LivePresentationScope {
  return {
    organizationId: null,
    activeServiceTitle: null,
    canSendMedia: false,
    canSendScripture: false,
  };
}
