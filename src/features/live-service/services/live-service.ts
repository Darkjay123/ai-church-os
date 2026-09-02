import type {
  LiveServiceData,
  LiveServiceWithTimeline,
} from "@/features/live-service/types";
import { logServerEvent } from "@/lib/server-logger";
import { createClient } from "@/lib/supabase/server";

type SupabaseFailure = {
  code?: string;
  message: string;
  status?: number;
};

export async function getLiveServiceData(): Promise<LiveServiceData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return emptyLiveServiceData();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile) {
    if (profileError) logLiveServiceFailure("load-profile", profileError, user.id);
    return emptyLiveServiceData();
  }

  const organizationId = profile.organization_id;
  const [servicesResult, managePermissionResult, operatePermissionResult] =
    await Promise.all([
      supabase
        .from("services")
        .select(
          "id, title, service_type, scheduled_for, speaker, status, started_at, ended_at, created_at",
        )
        .eq("organization_id", organizationId)
        .in("status", ["scheduled", "live"])
        .order("scheduled_for", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase.rpc("has_organization_permission", {
        target_organization_id: organizationId,
        required_permission_key: "services.manage",
      }),
      supabase.rpc("has_organization_permission", {
        target_organization_id: organizationId,
        required_permission_key: "services.operate",
      }),
    ]);

  if (servicesResult.error) {
    logLiveServiceFailure(
      "load-services",
      servicesResult.error,
      user.id,
      organizationId,
    );
  }
  if (managePermissionResult.error) {
    logLiveServiceFailure(
      "check-manage-permission",
      managePermissionResult.error,
      user.id,
      organizationId,
    );
  }
  if (operatePermissionResult.error) {
    logLiveServiceFailure(
      "check-operate-permission",
      operatePermissionResult.error,
      user.id,
      organizationId,
    );
  }

  const rows = servicesResult.data ?? [];
  const permissions = {
    canManageServices: Boolean(managePermissionResult.data),
    canOperateServices: Boolean(operatePermissionResult.data),
  };

  if (rows.length === 0) {
    return { activeService: null, scheduledServices: [], permissions };
  }

  const timelineResult = await supabase
    .from("service_timeline_events")
    .select("id, service_id, event_type, label, details, created_at")
    .in(
      "service_id",
      rows.map((service) => service.id),
    )
    .order("created_at", { ascending: false });

  if (timelineResult.error) {
    logLiveServiceFailure(
      "load-timeline",
      timelineResult.error,
      user.id,
      organizationId,
    );
  }

  const timelineByService = new Map<string, LiveServiceWithTimeline["timeline"]>();
  for (const event of timelineResult.data ?? []) {
    timelineByService.set(event.service_id, [
      ...(timelineByService.get(event.service_id) ?? []),
      {
        id: event.id,
        eventType: event.event_type,
        label: event.label,
        details: event.details,
        createdAt: event.created_at,
      },
    ]);
  }

  const toService = (service: (typeof rows)[number]): LiveServiceWithTimeline => ({
    id: service.id,
    title: service.title,
    serviceType: service.service_type,
    scheduledFor: service.scheduled_for,
    speaker: service.speaker,
    status: service.status,
    startedAt: service.started_at,
    endedAt: service.ended_at,
    createdAt: service.created_at,
    timeline: timelineByService.get(service.id) ?? [],
  });

  const activeService = rows.find((service) => service.status === "live");
  const scheduledServices = rows.filter((service) => service.status === "scheduled");

  return {
    activeService: activeService ? toService(activeService) : null,
    scheduledServices: scheduledServices.map(toService),
    permissions,
  };
}

function emptyLiveServiceData(): LiveServiceData {
  return {
    activeService: null,
    scheduledServices: [],
    permissions: { canManageServices: false, canOperateServices: false },
  };
}

function logLiveServiceFailure(
  operation: string,
  error: SupabaseFailure,
  userId: string,
  organizationId?: string,
) {
  logServerEvent("error", {
    operation,
    category: "live-service",
    userId,
    organizationId,
    code: error.code,
    status: error.status,
    message: error.message,
  });
}
