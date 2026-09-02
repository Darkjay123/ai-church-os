import { LiveOutputScreen } from "@/features/live-output/components/live-output-screen";
import { getLiveOutputContent } from "@/features/live-output/services/live-output";

export const dynamic = "force-dynamic";

export default async function OutputPage() {
  return <LiveOutputScreen initialContent={await getLiveOutputContent()} />;
}
