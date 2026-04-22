"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/domain/status-badge";
import type { Order } from "@/domain/types";

async function fetchOrders(): Promise<Order[]> {
  const response = await fetch("/api/orders");
  if (!response.ok) throw new Error("Failed to load orders");
  return response.json();
}

export function OrdersClient() {
  const { data: orders = [], isLoading } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>訂單</CardTitle>
        <Button asChild>
          <Link href="/orders/new"><Plus className="mr-2 h-4 w-4" />新增訂單</Link>
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>訂單編號</TableHead>
              <TableHead>客戶</TableHead>
              <TableHead>取貨日</TableHead>
              <TableHead>模式</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>付款</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7}>載入中...</TableCell></TableRow>}
            {orders.map((order) => (
              <TableRow key={order.orderId}>
                <TableCell className="font-medium">{order.orderNo}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.pickupDate}</TableCell>
                <TableCell>{order.orderMode}</TableCell>
                <TableCell><OrderStatusBadge status={order.orderStatus} /></TableCell>
                <TableCell><PaymentStatusBadge status={order.paymentStatus} /></TableCell>
                <TableCell><Button variant="outline" size="sm" asChild><Link href={`/orders/${order.orderId}`}>查看</Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
