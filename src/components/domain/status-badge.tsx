import { Badge } from "@/components/ui/badge";
import type { OrderStatus, PaymentStatus } from "@/domain/types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const labelMap: Record<OrderStatus, string> = {
    draft: "草稿",
    confirmed: "已預留",
    shipped: "已出貨",
    cancelled: "已取消"
  };
  const variant = status === "cancelled" ? "destructive" : status === "draft" ? "secondary" : "default";
  return <Badge variant={variant}>{labelMap[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={status === "paid" ? "default" : "outline"}>{status === "paid" ? "已付款" : "未付款"}</Badge>;
}
