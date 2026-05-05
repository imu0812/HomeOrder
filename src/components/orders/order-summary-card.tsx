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
  const paidAmount = order.paidAmount ?? 0;
  const balanceDue = Math.max(0, order.totalAmount - paidAmount);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-xl">{order.orderNo}</CardTitle>
          <CardDescription className="mt-1 text-base">
            {order.customerName} / {order.customerPhone}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.orderStatus} />
          <OrderProgressBadge progress={progress} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-[repeat(2,minmax(220px,280px))]">
          <div className="rounded-md border bg-sky-50 px-4 py-3">
            <p className="text-sm font-medium text-sky-700">應收金額</p>
            <p className="mt-1 text-3xl font-semibold text-blue-700">${formatNumber(order.totalAmount)}</p>
          </div>
          <div className="rounded-md border bg-rose-50 px-4 py-3">
            <p className="text-sm font-medium text-rose-700">待收金額</p>
            <p className="mt-1 text-3xl font-semibold text-red-700">${formatNumber(balanceDue)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-2 text-base text-muted-foreground">
          <span>訂單小計：${formatNumber(order.subtotalBeforeDiscount)}</span>
          <span>折扣金額：${formatNumber(order.discountAmount)}</span>
          <span>已付金額：${formatNumber(paidAmount)}</span>
          {order.note ? <span>備註：{order.note}</span> : null}
        </div>

        {actions ? <div className="flex flex-wrap gap-3 pt-1">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
