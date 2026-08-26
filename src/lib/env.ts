const missingSupabaseConfigurationMessage =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.";

function normalizeSupabaseUrl(value: string) {
  const url = new URL(value);
  const restPathIndex = url.pathname.indexOf("/rest/v1");

  if (restPathIndex !== -1) {
    url.pathname = url.pathname.slice(0, restPathIndex) || "/";
  }

  const normalizedPath = url.pathname.replace(/\/+$/, "");
  if (normalizedPath === "/rest/v1") {
    url.pathname = "/";
  } else if (normalizedPath.endsWith("/rest/v1")) {
    url.pathname = normalizedPath.slice(0, -"/rest/v1".length) || "/";
  }

  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}

export function getSupabaseConfig() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!configuredUrl || !publishableKey) {
    throw new Error(missingSupabaseConfigurationMessage);
  }

  let url: string;
  try {
    url = normalizeSupabaseUrl(configuredUrl);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be an absolute Supabase project URL.",
    );
  }

  return { url, publishableKey };
}

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function canUsePreviewFallback() {
  return process.env.NODE_ENV !== "production" && !hasSupabaseConfig();
}
