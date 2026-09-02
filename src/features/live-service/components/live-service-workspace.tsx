"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Plus,
  Radio,
  Square,
  Volume2,
  Waves,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  createLiveService,
  endLiveService,
  startLiveService,
} from "@/features/live-service/services/actions";
import type {
  LiveServiceActionState,
  LiveServiceData,
  LiveServiceWithTimeline,
} from "@/features/live-service/types";
import { useAppStore } from "@/store/app-store";

const initialState: LiveServiceActionState = {};

export function LiveServiceWorkspace({ data }: { data: LiveServiceData }) {
  const [showCreateForm, setShowCreateForm] = useState(
    !data.activeService && !data.scheduledServices.length,
  );
  const [microphoneCueOpen, setMicrophoneCueOpen] = useState(false);
  const setActiveService = useAppStore((state) => state.setActiveService);
  const setAiStatus = useAppStore((state) => state.setAiStatus);
  const [createState, createAction, isCreating] = useActionState(
    createLiveService,
    initialState,
  );
  const [startState, startAction, isStarting] = useActionState(
    startLiveService,
    initialState,
  );
  const [endState, endAction, isEnding] = useActionState(endLiveService, initialState);

  const selectedService = data.activeService ?? data.scheduledServices[0] ?? null;
  const feedback =
    createState.error ??
    startState.error ??
    endState.error ??
    createState.success ??
    startState.success ??
    endState.success;
  const feedbackIsError = Boolean(
    createState.error || startState.error || endState.error,
  );

  useEffect(() => {
    setActiveService(
      data.activeService
        ? {
            id: data.activeService.id,
            title: data.activeService.title,
            startedAt: data.activeService.startedAt ?? data.activeService.createdAt,
          }
        : null,
    );
    setAiStatus(data.activeService ? "listening" : "ready");
  }, [data.activeService, setActiveService, setAiStatus]);

  return (
    <div className="mx-auto w-full max-w-7xl p-5 sm:p-8">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-primary flex items-center gap-2 text-sm font-medium">
            <Radio aria-hidden="true" className="size-4" />
            Live Service
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Service control room
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            Start and end service mode deliberately. Displays, streaming, and automation
            remain independently controlled as their roadmap modules arrive.
          </p>
        </div>
        {data.permissions.canManageServices ? (
          <Button
            onClick={() => setShowCreateForm((open) => !open)}
            variant={showCreateForm ? "outline" : "default"}
          >
            <Plus className="size-4" />
            {showCreateForm ? "Close service form" : "Create service"}
          </Button>
        ) : null}
      </header>

      {feedback ? <Feedback isError={feedbackIsError} message={feedback} /> : null}

      {showCreateForm ? (
        <section
          aria-labelledby="create-service-heading"
          className="border-border bg-card mt-6 rounded-xl border p-5 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-lg">
              <CalendarClock className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold" id="create-service-heading">
                Create a live service
              </h2>
              <p className="text-muted-foreground mt-1 text-xs">
                This establishes a scheduled, auditable service record. An authorised
                operator starts service mode later.
              </p>
            </div>
          </div>
          <form action={createAction} className="mt-5 grid gap-4 lg:grid-cols-2">
            <Field error={createState.fieldErrors?.title?.[0]} label="Service title">
              <input
                autoFocus
                className="field-control"
                disabled={isCreating}
                name="title"
                placeholder="Sunday Celebration Service"
                required
              />
            </Field>
            <Field
              error={createState.fieldErrors?.serviceType?.[0]}
              label="Service type"
            >
              <input
                className="field-control"
                disabled={isCreating}
                name="serviceType"
                placeholder="Sunday service"
                required
              />
            </Field>
            <Field
              error={createState.fieldErrors?.scheduledFor?.[0]}
              label="Scheduled for"
            >
              <input
                className="field-control"
                disabled={isCreating}
                name="scheduledFor"
                type="datetime-local"
              />
            </Field>
            <Field error={createState.fieldErrors?.speaker?.[0]} label="Speaker">
              <input
                className="field-control"
                disabled={isCreating}
                name="speaker"
                placeholder="Optional"
              />
            </Field>
            <div className="flex justify-end lg:col-span-2">
              <Button disabled={isCreating} type="submit">
                {isCreating ? "Creating service…" : "Create service"}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          <ServiceStatus
            canOperate={data.permissions.canOperateServices}
            endAction={endAction}
            isEnding={isEnding}
            isStarting={isStarting}
            service={selectedService}
            startAction={startAction}
          />
          <Timeline service={selectedService} />
        </div>
        <aside className="space-y-6">
          <AudioPanel
            isLive={Boolean(data.activeService)}
            microphoneCueOpen={microphoneCueOpen}
            setMicrophoneCueOpen={setMicrophoneCueOpen}
          />
          <AiPanel isLive={Boolean(data.activeService)} />
          {data.scheduledServices.length > 1 ? (
            <ScheduledServices services={data.scheduledServices.slice(1)} />
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function ServiceStatus({
  service,
  canOperate,
  isStarting,
  isEnding,
  startAction,
  endAction,
}: {
  service: LiveServiceWithTimeline | null;
  canOperate: boolean;
  isStarting: boolean;
  isEnding: boolean;
  startAction: (formData: FormData) => void;
  endAction: (formData: FormData) => void;
}) {
  const isLive = service?.status === "live";
  return (
    <section className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="border-border flex items-center justify-between border-b px-5 py-4">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Current service
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {service?.title ?? "No service selected"}
          </h2>
        </div>
        <StatusPill status={service?.status} />
      </div>
      {service ? (
        <div className="grid gap-5 p-5 md:grid-cols-3">
          <Detail label="Type" value={service.serviceType} />
          <Detail label="Schedule" value={formatDate(service.scheduledFor)} />
          <Detail label="Speaker" value={service.speaker ?? "Not set"} />
          <div className="border-border bg-background/50 flex flex-col justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-center md:col-span-3">
            <p className="text-muted-foreground max-w-lg text-sm leading-5">
              {isLive
                ? "Service mode is live. Keep every operational change intentional."
                : "Review the service details, then let an authorised operator enter service mode."}
            </p>
            {canOperate ? (
              isLive ? (
                <form action={endAction}>
                  <input name="serviceId" type="hidden" value={service.id} />
                  <Button disabled={isEnding} type="submit" variant="destructive">
                    <Square className="size-4" />
                    {isEnding ? "Ending…" : "End service"}
                  </Button>
                </form>
              ) : (
                <form action={startAction}>
                  <input name="serviceId" type="hidden" value={service.id} />
                  <Button disabled={isStarting} type="submit">
                    <Radio className="size-4" />
                    {isStarting ? "Starting…" : "Start service mode"}
                  </Button>
                </form>
              )
            ) : (
              <p className="text-muted-foreground text-xs">
                You can view this service, but an authorised operator must change
                service mode.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center p-6 text-center">
          <span className="bg-primary/10 text-primary grid size-12 place-items-center rounded-full">
            <CalendarClock className="size-5" />
          </span>
          <h2 className="mt-4 text-sm font-semibold">No services yet</h2>
          <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">
            Create a service to establish the operator-led record for the next
            gathering.
          </p>
        </div>
      )}
    </section>
  );
}

function Timeline({ service }: { service: LiveServiceWithTimeline | null }) {
  return (
    <section className="border-border bg-card rounded-xl border">
      <div className="border-border flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">Service timeline</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Operator-recorded milestones
          </p>
        </div>
        <Clock3 className="text-muted-foreground size-4" />
      </div>
      {service ? (
        <ol className="divide-border divide-y">
          {service.timeline.length ? (
            service.timeline.map((event) => (
              <li className="flex gap-3 px-5 py-4" key={event.id}>
                <span className="bg-primary/10 text-primary mt-0.5 grid size-7 shrink-0 place-items-center rounded-full">
                  <CheckCircle2 className="size-3.5" />
                </span>
                <div>
                  <p className="text-sm font-medium">{event.label}</p>
                  {event.details ? (
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      {event.details}
                    </p>
                  ) : null}
                  <time className="text-muted-foreground mt-1 block text-xs">
                    {formatDate(event.createdAt)}
                  </time>
                </div>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground px-5 py-7 text-sm">
              No timeline events have been recorded.
            </li>
          )}
        </ol>
      ) : (
        <div className="text-muted-foreground p-5 text-sm">
          Timeline events will appear once a service exists.
        </div>
      )}
    </section>
  );
}

function AudioPanel({
  microphoneCueOpen,
  setMicrophoneCueOpen,
  isLive,
}: {
  microphoneCueOpen: boolean;
  setMicrophoneCueOpen: (open: boolean) => void;
  isLive: boolean;
}) {
  return (
    <section className="border-border bg-card rounded-xl border p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold">Audio monitoring</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Local operator status only
          </p>
        </div>
        <Volume2 className="size-4 text-sky-300" />
      </div>
      <div className="mt-5 rounded-lg border border-sky-400/15 bg-sky-400/5 p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Waves className="size-4 text-sky-300" />
            Monitor bus
          </span>
          <span className="text-muted-foreground text-xs">
            {isLive ? "Standby" : "Idle"}
          </span>
        </div>
        <div
          aria-label="Audio meter, no hardware input connected"
          className="mt-4 flex h-8 items-end gap-1"
        >
          {[8, 20, 12, 28, 16, 8].map((height, index) => (
            <span
              className="w-1.5 rounded bg-sky-400/30"
              key={index}
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Microphone cue</p>
          <p className="text-muted-foreground mt-1 text-xs">
            No hardware input is connected.
          </p>
        </div>
        <button
          aria-pressed={microphoneCueOpen}
          className="bg-muted text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-xs font-medium transition"
          onClick={() => setMicrophoneCueOpen(!microphoneCueOpen)}
          type="button"
        >
          {microphoneCueOpen ? "Cue open" : "Cue closed"}
        </button>
      </div>
    </section>
  );
}

function AiPanel({ isLive }: { isLive: boolean }) {
  return (
    <section className="border-border bg-card rounded-xl border p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold">AI Brain</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Central intelligence status
          </p>
        </div>
        <Activity className="size-4 text-emerald-300" />
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-lg border border-emerald-400/15 bg-emerald-400/5 p-4">
        <span className="size-2 rounded-full bg-emerald-400" />
        <div>
          <p className="text-sm font-medium">
            {isLive ? "Monitoring service context" : "Ready when service mode starts"}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Suggestions require operator review.
          </p>
        </div>
      </div>
    </section>
  );
}

function ScheduledServices({ services }: { services: LiveServiceWithTimeline[] }) {
  return (
    <section className="border-border bg-card rounded-xl border">
      <div className="border-border border-b px-5 py-4">
        <h2 className="text-sm font-semibold">Upcoming services</h2>
      </div>
      <ul className="divide-border divide-y">
        {services.map((service) => (
          <li className="px-5 py-4" key={service.id}>
            <p className="text-sm font-medium">{service.title}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {formatDate(service.scheduledFor)} · {service.serviceType}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StatusPill({ status }: { status?: "scheduled" | "live" | "ended" }) {
  const labels = { live: "Live", scheduled: "Scheduled", ended: "Ended" };
  const classes = {
    live: "bg-rose-400/10 text-rose-300",
    scheduled: "bg-sky-400/10 text-sky-300",
    ended: "bg-muted text-muted-foreground",
  };
  const resolvedStatus = status ?? "ended";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${classes[resolvedStatus]}`}
    >
      {status ? labels[status] : "Standing by"}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function Feedback({ message, isError }: { message: string; isError: boolean }) {
  return (
    <p
      className={`mt-6 rounded-lg border px-3 py-2 text-sm ${
        isError
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      }`}
      role="status"
    >
      {message}
    </p>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      <span>{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {error ? (
        <span className="text-destructive mt-1 block text-xs">{error}</span>
      ) : null}
    </label>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
