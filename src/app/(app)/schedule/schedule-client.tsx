"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OrderItemStatusBadge, OrderProgressBadge } from "@/components/domain/status-badge";
import {
  captureOrderQuerySnapshot,
  optimisticFulfillOrderItem,
  restoreOrderQuerySnapshot
} from "@/lib/query/order-optimistic";
import { nowIso } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OrderActionResult, ScheduleItem } from "@/domain/types";

async function fetchSchedule(date: string): Promise<ScheduleItem[]> {
  const response = await fetch(`/api/schedule?date=${date}`);
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "載入排程失敗");
  return json.data;
}

async function fulfillItemApi(orderId: string, itemId: string): Promise<OrderActionResult> {
  const response = await fetch(`/api/orders/${orderId}/items/${itemId}/fulfill`, { method: "POST" });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "明細交付失敗");
  return json.data;
}

export function ScheduleClient({
  initialDate,
  initialItems
}: {
  initialDate: string;
  initialItems: ScheduleItem[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(initialDate);
  const queryKey = useMemo(() => ["schedule", date], [date]);
  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchSchedule(date),
    initialData: date === initialDate ? initialItems : undefined,
    staleTime: 30_000
  });

  const fulfillMutation = useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: string; itemId: string }) => fulfillItemApi(orderId, itemId),
    onMutate: async ({ orderId, itemId }) => {
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      await queryClient.cancelQueries({ queryKey: ["order", orderId] });
      const snapshot = captureOrderQuerySnapshot(queryClient, orderId);
      optimisticFulfillOrderItem(queryClient, orderId, itemId, nowIso());
      return { snapshot, orderId };
    },
    onSuccess: (result) => {
      toast.success(result.message);
    },
    onError: (error, _variables, context) => {
      if (context?.snapshot) restoreOrderQuerySnapshot(queryClient, context.orderId, context.snapshot);
      toast.error(error.message);
    },
    onSettled: (_result, _error, variables) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
    }
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>排程 / {date}</CardTitle>
        <Input
          type="date"
          value={date}
          onChange={(event) => {
            const nextDate = event.target.value;
            setDate(nextDate);
            router.replace(`/schedule?date=${nextDate}`);
          }}
          className="w-[180px]"
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客戶名稱</TableHead>
              <TableHead>訂單編號</TableHead>
              <TableHead>商品名稱</TableHead>
              <TableHead>數量</TableHead>
              <TableHead>包裝</TableHead>
              <TableHead>plannedFulfillDate</TableHead>
              <TableHead>itemStatus</TableHead>
              <TableHead>訂單進度</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9}>載入中...</TableCell>
              </TableRow>
            ) : null}
            {items.map((row) => (
              <TableRow key={row.item.id}>
                <TableCell>{row.customerName}</TableCell>
                <TableCell>
                  <Link href={`/orders/${row.orderId}`} className="underline underline-offset-4">
                    {row.orderNo}
                  </Link>
                </TableCell>
                <TableCell>{row.item.productNameSnapshot}</TableCell>
                <TableCell>
                  {row.item.qty} {row.item.unit}
                </TableCell>
                <TableCell>{row.item.packagingNameSnapshot ?? "-"}</TableCell>
                <TableCell>{row.item.plannedFulfillDate}</TableCell>
                <TableCell>
                  <OrderItemStatusBadge status={row.item.itemStatus} />
                </TableCell>
                <TableCell>
                  <OrderProgressBadge progress={row.orderProgress} />
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={row.item.itemStatus !== "pending" || fulfillMutation.isPending}
                    onClick={() => fulfillMutation.mutate({ orderId: row.orderId, itemId: row.item.id })}
                  >
                    Fulfill
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>這一天沒有 confirmed 訂單明細。</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
