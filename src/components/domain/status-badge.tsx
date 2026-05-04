import { Badge } from "@/components/ui/badge";
import type { OrderItemStatus, OrderProgress, OrderStatus } from "@/domain/types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const labelMap: Record<OrderStatus, string> = {
    draft: "草稿",
    confirmed: "已成立",
    cancelled: "已作廢"
  };
  const variant = status === "cancelled" ? "destructive" : status === "draft" ? "secondary" : "default";
  return <Badge variant={variant}>{labelMap[status]}</Badge>;
}

export function OrderItemStatusBadge({ status }: { status: OrderItemStatus }) {
  const labelMap: Record<OrderItemStatus, string> = {
    pending: "待處理",
    fulfilled: "已完成",
    cancelled: "已取消"
  };
  const variant = status === "fulfilled" ? "default" : status === "cancelled" ? "destructive" : "secondary";
  return <Badge variant={variant}>{labelMap[status]}</Badge>;
}

export function OrderProgressBadge({ progress }: { progress: OrderProgress }) {
  const labelMap: Record<OrderProgress, string> = {
    not_started: "未開始",
    partial: "部分完成",
    completed: "全部完成"
  };
  const variant = progress === "completed" ? "default" : progress === "partial" ? "outline" : "secondary";
  return <Badge variant={variant}>{labelMap[progress]}</Badge>;
}
