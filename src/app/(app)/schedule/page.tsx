import { ScheduleClient } from "./schedule-client";
import { getRepositories } from "@/repositories/provider";
import { listScheduleItems } from "@/services/orderService";

export default async function SchedulePage({
  searchParams
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const initialDate = params.date ?? new Date().toISOString().slice(0, 10);
  const repos = getRepositories();
  const initialItems = await listScheduleItems(repos, initialDate);
  return <ScheduleClient initialDate={initialDate} initialItems={initialItems} />;
}
