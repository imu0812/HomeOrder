import { OrdersClient } from "./orders-client";
import { getRepositories } from "@/repositories/provider";
import { listOrderItemsSummary } from "@/services/orderService";

export default async function OrdersPage() {
  const repos = getRepositories();
  const initialData = await listOrderItemsSummary(repos);
  return <OrdersClient initialData={initialData} />;
}
