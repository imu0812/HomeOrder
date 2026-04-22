"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmOrderDialog } from "@/components/orders/confirm-order-dialog";
import { OrderSummaryCard } from "@/components/orders/order-summary-card";
import { ShortageAlert } from "@/components/orders/shortage-alert";
import type {
  ConfirmOrderResult,
  Order,
  OrderActionResult,
  OrderItem,
  OrderItemComponent,
  OrderMixItem
} from "@/domain/types";

type OrderDetail = {
  order: Order;
  items: OrderItem[];
  mixItems: { orderItemId: string; items: OrderMixItem[] }[];
  components: OrderItemComponent[];
};

async function fetchOrder(orderId: string): Promise<OrderDetail> {
  const response = await fetch(`/api/orders/${orderId}`);
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "找不到訂單");
  return json.data;
}

async function confirmOrderApi(orderId: string): Promise<ConfirmOrderResult> {
  const response = await fetch(`/api/orders/${orderId}/confirm`, { method: "POST" });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "預留失敗");
  return json.data;
}

async function orderActionApi(orderId: string, action: "ship" | "cancel"): Promise<OrderActionResult> {
  const response = await fetch(`/api/orders/${orderId}/${action}`, { method: "POST" });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "操作失敗");
  return json.data;
}

function RequirementTable({
  rows,
  shortage = false
}: {
  rows: { itemId: string; itemName: string; qty: number; availableStock: number; shortageQty?: number }[];
  shortage?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>項目</TableHead>
          <TableHead>數量</TableHead>
          <TableHead>目前可用</TableHead>
          {shortage && <TableHead>不足</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.itemId}>
            <TableCell className="font-medium">{row.itemName}</TableCell>
            <TableCell>{row.qty}</TableCell>
            <TableCell>{row.availableStock}</TableCell>
            {shortage && <TableCell className="text-destructive">{row.shortageQty ?? 0}</TableCell>}
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={shortage ? 4 : 3}>沒有資料。</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function SnapshotTable({ rows }: { rows: OrderItemComponent[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>項目</TableHead>
          <TableHead>數量</TableHead>
          <TableHead>來源</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.itemNameSnapshot}</TableCell>
            <TableCell>{item.qty}</TableCell>
            <TableCell>{item.sourceType}</TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={3}>尚未產生快照。</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["orders", orderId], queryFn: () => fetchOrder(orderId) });
  const confirmMutation = useMutation({
    mutationFn: () => confirmOrderApi(orderId),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
    },
    onError: (error) => toast.error(error.message)
  });
  const shipMutation = useMutation({
    mutationFn: () => orderActionApi(orderId, "ship"),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
    },
    onError: (error) => toast.error(error.message)
  });
  const cancelMutation = useMutation({
    mutationFn: () => orderActionApi(orderId, "cancel"),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
    },
    onError: (error) => toast.error(error.message)
  });

  if (isLoading || !data) return <Card><CardContent className="p-6">載入中...</CardContent></Card>;

  const { order, items, mixItems, components } = data;
  const lastResult = confirmMutation.data;
  const visibleSnapshots = lastResult?.snapshots ?? components;
  const productComponents = visibleSnapshots.filter((item) => item.itemType === "product");
  const packagingComponents = visibleSnapshots.filter((item) => item.itemType === "packaging");

  return (
    <div className="grid gap-6">
      <OrderSummaryCard
        order={order}
        actions={
          <>
            <ConfirmOrderDialog
              disabled={order.orderStatus !== "draft" || confirmMutation.isPending}
              isPending={confirmMutation.isPending}
              onConfirm={() => confirmMutation.mutate()}
            />
            <Button disabled={order.orderStatus !== "confirmed" || shipMutation.isPending} onClick={() => shipMutation.mutate()}>
              {shipMutation.isPending ? "出貨中..." : "Ship"}
            </Button>
            <Button
              variant="destructive"
              disabled={order.orderStatus !== "confirmed" || cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {cancelMutation.isPending ? "取消中..." : "Cancel"}
            </Button>
            {order.orderStatus !== "draft" && (
              <p className="self-center text-sm text-muted-foreground">出貨或取消都依 OrderItemComponents 快照執行。</p>
            )}
          </>
        }
      />

      {lastResult && (
        <>
          <Alert>
            <AlertTitle>Confirm 完成</AlertTitle>
            <AlertDescription>{lastResult.message}</AlertDescription>
          </Alert>
          <ShortageAlert shortagePackagings={lastResult.shortagePackagings} />
        </>
      )}

      <Tabs defaultValue="items" className="grid gap-4">
        <TabsList>
          <TabsTrigger value="items">明細</TabsTrigger>
          <TabsTrigger value="expanded">展開結果</TabsTrigger>
          <TabsTrigger value="shortage">包材缺料</TabsTrigger>
          <TabsTrigger value="snapshot">快照</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardContent className="overflow-x-auto p-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品</TableHead>
                    <TableHead>數量</TableHead>
                    <TableHead>包裝</TableHead>
                    <TableHead>小計</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.productNameSnapshot}
                        {mixItems.find((mix) => mix.orderItemId === item.id)?.items.map((mix) => (
                          <div key={mix.id} className="mt-1 text-xs text-muted-foreground">
                            {mix.productNameSnapshot} x {mix.qty}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>{item.qty}</TableCell>
                      <TableCell>{item.packagingNameSnapshot ?? "-"}</TableCell>
                      <TableCell>{item.subtotal}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expanded" className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>商品展開</CardTitle>
              <CardDescription>只作為製作與備料參考，不做缺料判斷。</CardDescription>
            </CardHeader>
            <CardContent>
              {lastResult ? (
                <RequirementTable rows={lastResult.expandedProducts} />
              ) : (
                <p className="text-sm text-muted-foreground">按下 Confirm 後顯示商品製作參考。</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>包材展開</CardTitle>
              <CardDescription>包材會檢查可用庫存並產生缺料警示。</CardDescription>
            </CardHeader>
            <CardContent>
              {lastResult ? (
                <RequirementTable rows={lastResult.expandedPackagings} />
              ) : (
                <p className="text-sm text-muted-foreground">按下 Confirm 後顯示包材展開結果。</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shortage">
          <Card>
            <CardHeader>
              <CardTitle>包材缺料</CardTitle>
              <CardDescription>本系統只針對包材顯示缺料。商品不足不會阻止訂單成立。</CardDescription>
            </CardHeader>
            <CardContent>
              {lastResult ? (
                <RequirementTable rows={lastResult.shortagePackagings} shortage />
              ) : (
                <p className="text-sm text-muted-foreground">尚未執行 Confirm。</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snapshot">
          <Card>
            <CardHeader>
              <CardTitle>OrderItemComponents 快照</CardTitle>
              <CardDescription>confirmed 後保存商品與包材展開結果，出貨或取消都依快照執行。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 overflow-x-auto">
              <div>
                <h3 className="mb-2 font-medium">商品快照</h3>
                <SnapshotTable rows={productComponents} />
              </div>
              <div>
                <h3 className="mb-2 font-medium">包材快照</h3>
                <SnapshotTable rows={packagingComponents} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
