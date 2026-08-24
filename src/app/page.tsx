import { redirect } from "next/navigation";

import { hasSupabaseConfig } from "@/lib/env";

export default function Home() {
  redirect(hasSupabaseConfig() ? "/dashboard" : "/sign-up");
}
