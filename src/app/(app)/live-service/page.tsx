import { LiveServiceWorkspace } from "@/features/live-service/components/live-service-workspace";
import { getLiveServiceData } from "@/features/live-service/services/live-service";

export default async function LiveServicePage() {
  const data = await getLiveServiceData();
  return <LiveServiceWorkspace data={data} />;
}
