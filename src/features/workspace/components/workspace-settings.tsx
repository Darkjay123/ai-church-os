"use client";

import { useActionState, useState } from "react";
import { Check, Copy, MailPlus, Plus, ShieldCheck, UsersRound } from "lucide-react";

import { ActionFeedback } from "@/features/workspace/components/action-feedback";
import {
  assignRole,
  createInvitation,
  createTeam,
  updateMyProfile,
  updateOrganization,
} from "@/features/workspace/services/actions";
import type { WorkspaceSettingsData } from "@/features/workspace/types";

const initialState: import("@/features/workspace/types").WorkspaceActionState = {};
const sections = [
  { id: "profile", label: "Church profile" },
  { id: "team", label: "Team & invitations" },
  { id: "roles", label: "Roles & permissions" },
] as const;

export function WorkspaceSettings({ data }: { data: WorkspaceSettingsData }) {
  const [activeSection, setActiveSection] =
    useState<(typeof sections)[number]["id"]>("profile");

  return (
    <div className="mx-auto w-full max-w-7xl p-5 sm:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-primary text-sm font-medium">Church Workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            Keep your church identity, people, roles, and service workspace aligned.
          </p>
        </div>
        <span className="border-border bg-card text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          Organisation-scoped and permission-checked
        </span>
      </div>

      {!data.isConfigured ? <ConfigurationNotice /> : null}
      <div className="mt-8 grid gap-6 xl:grid-cols-[13rem_minmax(0,1fr)]">
        <nav
          aria-label="Settings sections"
          className="border-border bg-card flex h-fit gap-1 rounded-xl border p-2 xl:flex-col"
        >
          {sections.map((section) => (
            <button
              className={
                activeSection === section.id
                  ? "bg-primary/10 text-primary rounded-lg px-3 py-2 text-left text-sm font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-3 py-2 text-left text-sm font-medium transition"
              }
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              type="button"
            >
              {section.label}
            </button>
          ))}
        </nav>
        <div>
          {activeSection === "profile" ? <ProfileSection data={data} /> : null}
          {activeSection === "team" ? <TeamSection data={data} /> : null}
          {activeSection === "roles" ? <RolesSection data={data} /> : null}
        </div>
      </div>
    </div>
  );
}

function ConfigurationNotice() {
  return (
    <div className="border-primary/25 bg-primary/5 mt-6 rounded-xl border p-4">
      <p className="text-sm font-medium">Supabase connection required</p>
      <p className="text-muted-foreground mt-1 text-sm leading-6">
        This production workspace interface is ready, but live church data appears after
        the Supabase environment and migrations are configured.
      </p>
    </div>
  );
}

function ProfileSection({ data }: { data: WorkspaceSettingsData }) {
  const [organizationState, organizationAction, organizationPending] = useActionState(
    updateOrganization,
    initialState,
  );
  const [profileState, profileAction, profilePending] = useActionState(
    updateMyProfile,
    initialState,
  );
  return (
    <div className="space-y-6">
      <SectionCard
        title="Church profile"
        description="Details shown across this church workspace."
      >
        <form action={organizationAction} className="grid gap-5 md:grid-cols-2">
          <Field
            label="Church or ministry name"
            name="name"
            defaultValue={data.organization.name}
            disabled={!data.permissions.manageOrganization}
          />
          <Field
            label="Denomination"
            name="denomination"
            defaultValue={data.organization.denomination ?? ""}
            disabled={!data.permissions.manageOrganization}
          />
          <Field
            label="Timezone"
            name="timezone"
            defaultValue={data.organization.timezone}
            disabled={!data.permissions.manageOrganization}
          />
          <Field
            label="Country"
            name="country"
            defaultValue={data.organization.country ?? ""}
            disabled={!data.permissions.manageOrganization}
          />
          <Field
            label="Default language"
            name="defaultLanguage"
            defaultValue={data.organization.defaultLanguage}
            disabled={!data.permissions.manageOrganization}
          />
          <div className="flex items-end">
            <SubmitButton
              disabled={!data.permissions.manageOrganization || organizationPending}
              label="Save church profile"
              pending={organizationPending}
            />
          </div>
          <div className="md:col-span-2">
            <ActionFeedback state={organizationState} />
          </div>
        </form>
      </SectionCard>
      <SectionCard
        title="Your profile"
        description="Your personal identity inside this church workspace."
      >
        <form action={profileAction} className="grid gap-5 md:grid-cols-2">
          <Field
            label="Full name"
            name="fullName"
            defaultValue={data.currentProfile.fullName ?? ""}
          />
          <Field
            label="Email address"
            name="email"
            defaultValue={data.currentProfile.email}
            disabled
          />
          <Field label="Phone number" name="phone" defaultValue="" />
          <div className="flex items-end">
            <SubmitButton
              disabled={profilePending}
              label="Save my profile"
              pending={profilePending}
            />
          </div>
          <div className="md:col-span-2">
            <ActionFeedback state={profileState} />
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

function TeamSection({ data }: { data: WorkspaceSettingsData }) {
  const [teamState, teamAction, teamPending] = useActionState(createTeam, initialState);
  const [inviteState, inviteAction, invitePending] = useActionState(
    createInvitation,
    initialState,
  );
  return (
    <div className="space-y-6">
      <SectionCard
        title="Ministry teams"
        description="Structure teams such as Media, Worship, Pastoral, and Admin."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {data.teams.length ? (
            data.teams.map((team) => (
              <div
                className="border-border bg-background rounded-lg border p-4"
                key={team.id}
              >
                <p className="text-sm font-medium">{team.name}</p>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  {team.description || "No description yet."}
                </p>
                <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
                  <UsersRound className="size-3.5" />
                  {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              label="No ministry teams yet"
              detail="Create the teams that organise your people behind the scenes."
            />
          )}
        </div>
        {data.permissions.manageTeams ? (
          <form
            action={teamAction}
            className="border-border mt-5 grid gap-3 border-t pt-5 md:grid-cols-[1fr_1fr_auto]"
          >
            <Field label="Team name" name="name" placeholder="e.g. Media" />
            <Field
              label="Description"
              name="description"
              placeholder="What this team owns"
            />
            <div className="flex items-end">
              <SubmitButton
                disabled={teamPending}
                label="Add team"
                pending={teamPending}
                icon={Plus}
              />
            </div>
            <div className="md:col-span-3">
              <ActionFeedback state={teamState} />
            </div>
          </form>
        ) : null}
      </SectionCard>
      <SectionCard
        title="Invite teammate"
        description="Create a secure, single-use registration link for a teammate."
      >
        <form action={inviteAction} className="grid gap-5 md:grid-cols-2">
          <Field
            label="Teammate email"
            name="email"
            type="email"
            placeholder="name@church.org"
            disabled={!data.permissions.manageMembers}
          />
          <SelectField
            label="Role"
            name="roleId"
            disabled={!data.permissions.manageMembers}
          >
            <option value="">Choose a role</option>
            {data.roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Team (optional)"
            name="teamId"
            disabled={!data.permissions.manageMembers}
          >
            <option value="">No team yet</option>
            {data.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </SelectField>
          <div className="flex items-end">
            <SubmitButton
              disabled={!data.permissions.manageMembers || invitePending}
              label="Create invite link"
              pending={invitePending}
              icon={MailPlus}
            />
          </div>
          <div className="md:col-span-2">
            <ActionFeedback state={inviteState} />
            {inviteState.inviteLink ? (
              <InviteLink link={inviteState.inviteLink} />
            ) : null}
          </div>
        </form>
        <div className="border-border mt-6 border-t pt-5">
          <p className="text-sm font-medium">Pending invitations</p>
          <div className="mt-3 space-y-2">
            {data.invitations.length ? (
              data.invitations.map((invite) => (
                <div
                  className="border-border bg-background flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm"
                  key={invite.id}
                >
                  <span>{invite.email}</span>
                  <span className="text-muted-foreground text-xs">
                    Expires{" "}
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                      new Date(invite.expiresAt),
                    )}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No pending invitations.</p>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function RolesSection({ data }: { data: WorkspaceSettingsData }) {
  const [assignmentState, assignmentAction, assignmentPending] = useActionState(
    assignRole,
    initialState,
  );
  const roleById = new Map(data.roles.map((role) => [role.id, role]));
  return (
    <div className="space-y-6">
      <SectionCard
        title="Role directory"
        description="System roles are provisioned per church. Permissions are stored separately for future custom roles."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {data.roles.length ? (
            data.roles.map((role) => (
              <div
                className="border-border bg-background rounded-lg border p-4"
                key={role.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{role.label}</p>
                  <span className="text-primary bg-primary/10 rounded-full px-2 py-0.5 text-[11px] font-medium">
                    {role.permissions.length} permissions
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 text-xs leading-5">
                  {role.description}
                </p>
                <p className="text-muted-foreground mt-3 text-xs">
                  {role.permissions.join(" · ") || "Permissions provisioning required"}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              label="Roles will appear after database provisioning"
              detail="Apply the Sprint 1 migration to create organisation-scoped system roles."
            />
          )}
        </div>
      </SectionCard>
      <SectionCard
        title="Assign a role"
        description="Role assignment is audited and checked at the database layer."
      >
        <form action={assignmentAction} className="grid gap-5 md:grid-cols-2">
          <SelectField
            label="Member"
            name="profileId"
            disabled={!data.permissions.manageRoles}
          >
            <option value="">Choose a member</option>
            {data.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName || member.email}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Role"
            name="roleId"
            disabled={!data.permissions.manageRoles}
          >
            <option value="">Choose a role</option>
            {data.roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </SelectField>
          <div className="md:col-span-2">
            <SubmitButton
              disabled={!data.permissions.manageRoles || assignmentPending}
              label="Assign role"
              pending={assignmentPending}
              icon={Check}
            />
          </div>
          <div className="md:col-span-2">
            <ActionFeedback state={assignmentState} />
          </div>
        </form>
      </SectionCard>
      <SectionCard
        title="Current members"
        description="Your team’s live access picture."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="text-muted-foreground border-border border-b text-xs">
              <tr>
                <th className="pb-3 font-medium">Member</th>
                <th className="pb-3 font-medium">Roles</th>
                <th className="pb-3 font-medium">Teams</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((member) => (
                <tr className="border-border border-b last:border-0" key={member.id}>
                  <td className="py-3">
                    <p className="font-medium">
                      {member.fullName || "Unnamed teammate"}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {member.email}
                    </p>
                  </td>
                  <td className="text-muted-foreground py-3 text-xs">
                    {member.roleIds
                      .map((id) => roleById.get(id)?.label)
                      .filter(Boolean)
                      .join(", ") || "No role"}
                  </td>
                  <td className="text-muted-foreground py-3 text-xs">
                    {member.teamIds.length || "—"}
                  </td>
                  <td className="py-3">
                    <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function InviteLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="border-primary/25 bg-primary/5 mt-4 rounded-lg border p-3">
      <p className="text-xs font-medium">Secure invitation link</p>
      <div className="mt-2 flex gap-2">
        <input
          className="border-border bg-background text-muted-foreground min-w-0 flex-1 rounded-md border px-2 py-1.5 text-xs"
          readOnly
          value={link}
        />
        <button
          className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 text-xs font-medium"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
          }}
          type="button"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-card rounded-xl border p-5 sm:p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-6">{description}</p>
      </div>
      {children}
    </section>
  );
}
function EmptyState({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="border-border bg-background col-span-full rounded-lg border border-dashed p-5">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-muted-foreground mt-1 text-sm leading-6">{detail}</p>
    </div>
  );
}
function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  disabled = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: "text" | "email";
  disabled?: boolean;
}) {
  const id = `workspace-${name}`;
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        autoComplete={type === "email" ? "email" : undefined}
        className="border-input bg-background focus:border-primary focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
        defaultValue={defaultValue}
        disabled={disabled}
        id={id}
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}
function SelectField({
  label,
  name,
  children,
  disabled = false,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <select
        className="border-input bg-background focus:border-primary focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        name={name}
      >
        {children}
      </select>
    </label>
  );
}
function SubmitButton({
  label,
  pending,
  disabled,
  icon: Icon,
}: {
  label: string;
  pending: boolean;
  disabled: boolean;
  icon?: typeof Plus;
}) {
  return (
    <button
      className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
      disabled={disabled}
      type="submit"
    >
      {Icon ? <Icon className="size-4" /> : null}
      {pending ? "Saving…" : label}
    </button>
  );
}
