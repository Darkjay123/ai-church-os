type ServerLogContext = {
  operation: string;
  requestId?: string;
  userId?: string;
  organizationId?: string;
  category?: string;
  code?: string;
  status?: number;
  message?: string;
};

export function logServerEvent(level: "error" | "info", context: ServerLogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (level === "error") console.error("[server]", entry);
  else console.info("[server]", entry);
}
