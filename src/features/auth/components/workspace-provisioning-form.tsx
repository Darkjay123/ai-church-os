"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { provisionGoogleWorkspace } from "@/features/auth/services/workspace-actions";

export function WorkspaceProvisioningForm() {
  const [state, formAction, pending] = useActionState(provisionGoogleWorkspace, {});
  const fieldError = state.fieldErrors?.churchName?.[0];

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="church-name">
          Church or ministry
        </label>
        <input
          aria-describedby={fieldError ? "church-name-error" : undefined}
          aria-invalid={Boolean(fieldError)}
          autoComplete="organization"
          className="border-input bg-background focus:border-primary focus:ring-primary/20 h-11 w-full rounded-lg border px-3 text-sm transition outline-none focus:ring-3"
          id="church-name"
          name="churchName"
          required
        />
        {fieldError ? (
          <p className="text-destructive text-xs" id="church-name-error">
            {fieldError}
          </p>
        ) : null}
      </div>
      {state.error ? (
        <p
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <Button className="h-11 w-full" disabled={pending} type="submit">
        {pending ? "Creating secure workspace…" : "Create secure workspace"}
      </Button>
    </form>
  );
}
