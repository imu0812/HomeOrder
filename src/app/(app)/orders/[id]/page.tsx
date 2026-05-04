import { OrderDetailClient } from "./order-detail-client";
import { getRepositories } from "@/repositories/provider";
import { getOrderDetail } from "@/services/orderService";
import { notFound } from "next/navigation";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repos = getRepositories();
  const initialData = await getOrderDetail(repos, id);
  if (!initialData) notFound();
  return <OrderDetailClient orderId={id} initialData={initialData} />;
}
