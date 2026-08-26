import { createHash } from "node:crypto";

const invitationTokenPattern = /^[A-Za-z0-9_-]{43}$/;

export function getInvitationTokenDigest(token: string | undefined) {
  const normalized = token?.trim();
  if (!normalized || !invitationTokenPattern.test(normalized)) return null;

  return createHash("sha256").update(normalized).digest("hex");
}
