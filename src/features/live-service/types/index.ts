export type LiveServiceStatus = "scheduled" | "live" | "ended";

export type LiveService = {
  id: string;
  title: string;
  serviceType: string;
  scheduledFor: string | null;
  speaker: string | null;
  status: LiveServiceStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
};

export type LiveServiceTimelineEntry = {
  id: string;
  eventType: "service.created" | "service.started" | "service.ended";
  label: string;
  details: string | null;
  createdAt: string;
};

export type LiveServiceWithTimeline = LiveService & {
  timeline: LiveServiceTimelineEntry[];
};

export type LiveServiceData = {
  activeService: LiveServiceWithTimeline | null;
  scheduledServices: LiveServiceWithTimeline[];
  permissions: {
    canManageServices: boolean;
    canOperateServices: boolean;
  };
};

export type LiveServiceActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};
