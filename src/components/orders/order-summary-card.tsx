"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/domain/status-badge";
import type { Order } from "@/domain/types";

export function OrderSummaryCard({ order, actions }: { order: Order; actions?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{order.orderNo}</CardTitle>
          <CardDescription>{order.customerName} / {order.customerPhone} / 取貨 {order.pickupDate}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.orderStatus} />
          <PaymentStatusBadge status={order.paymentStatus} />
          <Badge variant="outline">{order.orderMode}</Badge>
        </div>
      </CardHeader>
      {actions && <CardContent className="flex flex-wrap gap-3">{actions}</CardContent>}
    </Card>
  );
}
