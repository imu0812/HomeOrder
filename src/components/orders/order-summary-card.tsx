"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderProgressBadge, OrderStatusBadge } from "@/components/domain/status-badge";
import { formatNumber } from "@/lib/utils";
import type { Order, OrderProgress } from "@/domain/types";

export function OrderSummaryCard({
  order,
  progress,
  actions
}: {
  order: Order;
  progress: OrderProgress;
  actions?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{order.orderNo}</CardTitle>
          <CardDescription>
            {order.customerName} / {order.customerPhone}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.orderStatus} />
          <OrderProgressBadge progress={progress} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-muted-foreground">
        <p>訂單小計：${formatNumber(order.subtotalBeforeDiscount)}</p>
        <p>折扣金額：${formatNumber(order.discountAmount)}</p>
        <p className="font-medium text-foreground">總額：${formatNumber(order.totalAmount)}</p>
        {order.note ? <p>備註：{order.note}</p> : null}
        {actions ? <div className="flex flex-wrap gap-3 pt-2">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
