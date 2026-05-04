"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderProgressBadge, OrderStatusBadge } from "@/components/domain/status-badge";
import { formatNumber } from "@/lib/utils";
import type { OrderListItem } from "@/domain/types";

async function fetchOrders(): Promise<OrderListItem[]> {
  const response = await fetch("/api/orders");
  if (!response.ok) throw new Error("Failed to load orders");
  return response.json();
}

export function OrdersClient({ initialData }: { initialData: OrderListItem[] }) {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    initialData,
    staleTime: 30_000
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>訂單</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/schedule">
              <CalendarDays className="mr-2 h-4 w-4" />
              排程
            </Link>
          </Button>
          <Button asChild>
            <Link href="/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              新增訂單
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>訂單編號</TableHead>
              <TableHead>客戶</TableHead>
              <TableHead>主狀態</TableHead>
              <TableHead>進度</TableHead>
              <TableHead>明細數</TableHead>
              <TableHead>下個出貨日</TableHead>
              <TableHead>總額</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8}>載入中...</TableCell>
              </TableRow>
            ) : null}
            {rows.map((row) => (
              <TableRow key={row.order.orderId}>
                <TableCell className="font-medium">{row.order.orderNo}</TableCell>
                <TableCell>{row.order.customerName}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={row.order.orderStatus} />
                </TableCell>
                <TableCell>
                  <OrderProgressBadge progress={row.orderProgress} />
                </TableCell>
                <TableCell>{row.itemCount}</TableCell>
                <TableCell>{row.nextPlannedFulfillDate ?? "-"}</TableCell>
                <TableCell>${formatNumber(row.order.totalAmount)}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/orders/${row.order.orderId}`}>查看</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
