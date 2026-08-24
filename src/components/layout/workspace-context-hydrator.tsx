"use client";

import { useEffect } from "react";

import { useAppStore } from "@/store/app-store";

export function WorkspaceContextHydrator({
  organization,
}: {
  organization: { id: string; name: string; timezone: string } | null;
}) {
  const setOrganization = useAppStore((state) => state.setOrganization);
  useEffect(() => {
    setOrganization(organization);
  }, [organization, setOrganization]);
  return null;
}
