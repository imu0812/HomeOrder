"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmOrderDialog } from "@/components/orders/confirm-order-dialog";
import { OrderSummaryCard } from "@/components/orders/order-summary-card";
import { ShortageAlert } from "@/components/orders/shortage-alert";
import { OrderItemStatusBadge } from "@/components/domain/status-badge";
import {
  captureOrderQuerySnapshot,
  findOrderItemDate,
  optimisticConfirmOrder,
  optimisticFulfillOrderItem,
  optimisticUnconfirmOrder,
  optimisticVoidOrder,
  relevantScheduleDates,
  restoreOrderQuerySnapshot
} from "@/lib/query/order-optimistic";
import { formatDateTime, formatNumber, nowIso } from "@/lib/utils";
import type {
  ConfirmOrderResult,
  OrderActionResult,
  OrderDetail,
  OrderItem,
  Packaging,
  Product,
  UpdateOrderItemResult
} from "@/domain/types";

type EditItemForm = {
  qty: string;
  packagingId: string;
  plannedFulfillDate: string;
  remark: string;
};

type AddItemForm = EditItemForm & {
  productId: string;
};

async function fetchOrder(orderId: string): Promise<OrderDetail> {
  const response = await fetch(`/api/orders/${orderId}`);
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "讀取訂單失敗");
  return json.data;
}

async function fetchPackagings(): Promise<Packaging[]> {
  const response = await fetch("/api/packagings");
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "讀取包裝失敗");
  return json;
}

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch("/api/products");
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "讀取商品失敗");
  return json;
}

async function confirmOrderApi(orderId: string): Promise<ConfirmOrderResult> {
  const response = await fetch(`/api/orders/${orderId}/confirm`, { method: "POST" });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "確認訂單失敗");
  return json.data;
}

async function orderActionApi(orderId: string, action: "unconfirm" | "void"): Promise<OrderActionResult> {
  const response = await fetch(`/api/orders/${orderId}/${action}`, { method: "POST" });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "訂單操作失敗");
  return json.data;
}

async function fulfillItemApi(orderId: string, itemId: string): Promise<OrderActionResult> {
  const response = await fetch(`/api/orders/${orderId}/items/${itemId}/fulfill`, { method: "POST" });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "Fulfill 明細失敗");
  return json.data;
}

async function updateItemApi(orderId: string, itemId: string, input: Record<string, unknown>): Promise<UpdateOrderItemResult> {
  const response = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "更新明細失敗");
  return json.data;
}

async function cancelItemApi(orderId: string, itemId: string): Promise<UpdateOrderItemResult> {
  const response = await fetch(`/api/orders/${orderId}/items/${itemId}`, { method: "DELETE" });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "取消明細失敗");
  return json.data;
}

async function addItemApi(orderId: string, input: Record<string, unknown>): Promise<UpdateOrderItemResult> {
  const response = await fetch(`/api/orders/${orderId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "新增明細失敗");
  return json.data;
}

export function OrderDetailClient({ orderId, initialData }: { orderId: string; initialData: OrderDetail }) {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditItemForm>({
    qty: "",
    packagingId: "",
    plannedFulfillDate: "",
    remark: ""
  });
  const [addForm, setAddForm] = useState<AddItemForm>({
    productId: "",
    qty: "1",
    packagingId: "",
    plannedFulfillDate: new Date().toISOString().slice(0, 10),
    remark: ""
  });

  const { data, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId),
    initialData,
    staleTime: 30_000
  });
  const { data: packagings = [] } = useQuery({
    queryKey: ["packagings"],
    queryFn: fetchPackagings,
    staleTime: 60_000
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 60_000
  });
  const scheduleDates = relevantScheduleDates(data);

  function invalidateRelatedQueries(orderIdToRefresh: string, dates: string[]) {
    queryClient.invalidateQueries({ queryKey: ["order", orderIdToRefresh] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    for (const date of dates) {
      queryClient.invalidateQueries({ queryKey: ["schedule", date] });
    }
  }

  function openEditDialog(item: OrderItem) {
    setEditingItem(item);
    setEditForm({
      qty: String(item.qty),
      packagingId: item.packagingId ?? "",
      plannedFulfillDate: item.plannedFulfillDate,
      remark: item.remark ?? ""
    });
  }

  function openAddDialog() {
    setAddForm((form) => ({
      ...form,
      productId: form.productId || products[0]?.productId || "",
      packagingId: form.packagingId || packagings[0]?.packagingId || ""
    }));
    setIsAddDialogOpen(true);
  }

  const confirmMutation = useMutation({
    mutationFn: () => confirmOrderApi(orderId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["order", orderId] });
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const snapshot = captureOrderQuerySnapshot(queryClient, orderId);
      optimisticConfirmOrder(queryClient, orderId);
      return { snapshot };
    },
    onSuccess: (result) => toast.success(result.message),
    onError: (error, _variables, context) => {
      if (context?.snapshot) restoreOrderQuerySnapshot(queryClient, orderId, context.snapshot);
      toast.error(error.message);
    },
    onSettled: () => invalidateRelatedQueries(orderId, scheduleDates)
  });

  const unconfirmMutation = useMutation({
    mutationFn: () => orderActionApi(orderId, "unconfirm"),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["order", orderId] });
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const snapshot = captureOrderQuerySnapshot(queryClient, orderId);
      optimisticUnconfirmOrder(queryClient, orderId);
      return { snapshot };
    },
    onSuccess: (result) => toast.success(result.message),
    onError: (error, _variables, context) => {
      if (context?.snapshot) restoreOrderQuerySnapshot(queryClient, orderId, context.snapshot);
      toast.error(error.message);
    },
    onSettled: () => invalidateRelatedQueries(orderId, scheduleDates)
  });

  const voidMutation = useMutation({
    mutationFn: () => orderActionApi(orderId, "void"),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["order", orderId] });
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const snapshot = captureOrderQuerySnapshot(queryClient, orderId);
      optimisticVoidOrder(queryClient, orderId);
      return { snapshot };
    },
    onSuccess: (result) => toast.success(result.message),
    onError: (error, _variables, context) => {
      if (context?.snapshot) restoreOrderQuerySnapshot(queryClient, orderId, context.snapshot);
      toast.error(error.message);
    },
    onSettled: () => invalidateRelatedQueries(orderId, scheduleDates)
  });

  const fulfillMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => fulfillItemApi(orderId, itemId),
    onMutate: async ({ itemId }) => {
      await queryClient.cancelQueries({ queryKey: ["order", orderId] });
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const snapshot = captureOrderQuerySnapshot(queryClient, orderId);
      optimisticFulfillOrderItem(queryClient, orderId, itemId, nowIso());
      return { snapshot };
    },
    onSuccess: () => toast.success("明細已 fulfilled"),
    onError: (error, _variables, context) => {
      if (context?.snapshot) restoreOrderQuerySnapshot(queryClient, orderId, context.snapshot);
      toast.error(error.message);
    },
    onSettled: (_result, _error, variables) => {
      const itemDate = findOrderItemDate(data, variables.itemId);
      invalidateRelatedQueries(orderId, itemDate ? [itemDate] : scheduleDates);
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: Record<string, unknown> }) => updateItemApi(orderId, itemId, input),
    onSuccess: (result) => {
      toast.success(result.message);
      setEditingItem(null);
    },
    onError: (error) => toast.error(error.message),
    onSettled: (result) => {
      const dates = new Set(scheduleDates);
      if (result?.item?.plannedFulfillDate) dates.add(result.item.plannedFulfillDate);
      invalidateRelatedQueries(orderId, [...dates]);
    }
  });

  const cancelItemMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => cancelItemApi(orderId, itemId),
    onSuccess: (result) => toast.success(result.message),
    onError: (error) => toast.error(error.message),
    onSettled: (result) => {
      const dates = new Set(scheduleDates);
      if (result?.item?.plannedFulfillDate) dates.add(result.item.plannedFulfillDate);
      invalidateRelatedQueries(orderId, [...dates]);
    }
  });

  const addItemMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => addItemApi(orderId, input),
    onSuccess: (result) => {
      toast.success(result.message);
      setIsAddDialogOpen(false);
    },
    onError: (error) => toast.error(error.message),
    onSettled: (result) => {
      const dates = new Set(scheduleDates);
      if (result?.item?.plannedFulfillDate) dates.add(result.item.plannedFulfillDate);
      invalidateRelatedQueries(orderId, [...dates]);
    }
  });

  if (isLoading || !data) return <p>載入中...</p>;

  const { order, items, mixItems, components, orderProgress, hasFulfilledItems } = data;
  const isSavingItem = updateItemMutation.isPending || cancelItemMutation.isPending;
  const activeItemCount = items.filter((item) => item.itemStatus !== "cancelled").length;

  return (
    <div className="grid gap-6">
      <OrderSummaryCard
        order={order}
        progress={orderProgress}
        actions={
          <>
            <ConfirmOrderDialog
              disabled={order.orderStatus !== "draft" || confirmMutation.isPending}
              isPending={confirmMutation.isPending}
              onConfirm={() => confirmMutation.mutate()}
            />
            <Button
              variant="outline"
              disabled={order.orderStatus !== "confirmed" || hasFulfilledItems || unconfirmMutation.isPending}
              onClick={() => unconfirmMutation.mutate()}
            >
              退回 Draft
            </Button>
            <Button
              variant="destructive"
              disabled={order.orderStatus === "cancelled" || hasFulfilledItems || voidMutation.isPending}
              onClick={() => voidMutation.mutate()}
            >
              Void 訂單
            </Button>
          </>
        }
      />

      {confirmMutation.data ? <ShortageAlert shortagePackagings={confirmMutation.data.shortagePackagings} /> : null}

      {hasFulfilledItems ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            此訂單已有 fulfilled 明細，因此不能 unconfirm 或 void；pending 明細仍可編輯或取消。
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>訂單明細</CardTitle>
          <Button
            size="sm"
            variant="outline"
            disabled={order.orderStatus !== "draft" || addItemMutation.isPending}
            onClick={openAddDialog}
          >
            <Plus className="mr-2 h-4 w-4" />
            新增明細
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>產品</TableHead>
                <TableHead>數量</TableHead>
                <TableHead>單價</TableHead>
                <TableHead>小計</TableHead>
                <TableHead>包裝</TableHead>
                <TableHead>plannedFulfillDate</TableHead>
                <TableHead>itemStatus</TableHead>
                <TableHead>fulfilledAt</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.productNameSnapshot}</TableCell>
                  <TableCell>
                    {item.qty} {item.unit}
                  </TableCell>
                  <TableCell>${formatNumber(item.unitPriceSnapshot)}</TableCell>
                  <TableCell>${formatNumber(item.subtotal)}</TableCell>
                  <TableCell>{item.packagingNameSnapshot ?? "-"}</TableCell>
                  <TableCell>{item.plannedFulfillDate}</TableCell>
                  <TableCell>
                    <OrderItemStatusBadge status={item.itemStatus} />
                  </TableCell>
                  <TableCell>{item.fulfilledAt ? formatDateTime(item.fulfilledAt) : "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={item.itemStatus !== "pending" || isSavingItem}
                        onClick={() => openEditDialog(item)}
                        title="編輯明細"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={item.itemStatus !== "pending" || activeItemCount <= 1 || isSavingItem}
                        onClick={() => cancelItemMutation.mutate({ itemId: item.id })}
                        title="取消明細"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={order.orderStatus !== "confirmed" || item.itemStatus !== "pending" || fulfillMutation.isPending}
                        onClick={() => fulfillMutation.mutate({ itemId: item.id })}
                      >
                        Fulfill
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>組合內容</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {mixItems.map((group) =>
            group.items.length > 0 ? (
              <div key={group.orderItemId} className="rounded-lg border p-4">
                <p className="mb-3 text-sm font-medium">OrderItem {group.orderItemId}</p>
                <div className="grid gap-2 text-sm">
                  {group.items.map((mixItem) => (
                    <p key={mixItem.id}>
                      {mixItem.productNameSnapshot} x {mixItem.qty} {mixItem.unit}
                    </p>
                  ))}
                </div>
              </div>
            ) : null
          )}
          {mixItems.every((group) => group.items.length === 0) ? (
            <p className="text-sm text-muted-foreground">沒有自訂組合內容</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OrderItemComponents 快照</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OrderItem</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>名稱</TableHead>
                <TableHead>數量</TableHead>
                <TableHead>來源</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.orderItemId}</TableCell>
                  <TableCell>{item.itemType}</TableCell>
                  <TableCell>{item.itemNameSnapshot}</TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell>{item.sourceType}</TableCell>
                </TableRow>
              ))}
              {components.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>尚無快照</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增草稿明細</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              商品
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={addForm.productId}
                onChange={(event) => setAddForm((form) => ({ ...form, productId: event.target.value }))}
              >
                {products.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.productName}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              數量
              <Input
                type="number"
                min="1"
                value={addForm.qty}
                onChange={(event) => setAddForm((form) => ({ ...form, qty: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm">
              plannedFulfillDate
              <Input
                type="date"
                value={addForm.plannedFulfillDate}
                onChange={(event) => setAddForm((form) => ({ ...form, plannedFulfillDate: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm">
              包裝
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={addForm.packagingId}
                onChange={(event) => setAddForm((form) => ({ ...form, packagingId: event.target.value }))}
              >
                <option value="">不指定</option>
                {packagings.map((packaging) => (
                  <option key={packaging.packagingId} value={packaging.packagingId}>
                    {packaging.packagingName}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              備註
              <textarea
                className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={addForm.remark}
                onChange={(event) => setAddForm((form) => ({ ...form, remark: event.target.value }))}
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button
                disabled={!addForm.productId || !addForm.plannedFulfillDate || addItemMutation.isPending}
                onClick={() =>
                  addItemMutation.mutate({
                    productId: addForm.productId,
                    qty: Number(addForm.qty),
                    packagingId: addForm.packagingId || undefined,
                    plannedFulfillDate: addForm.plannedFulfillDate,
                    remark: addForm.remark || undefined
                  })
                }
              >
                新增
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯 pending 明細</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              數量
              <Input
                type="number"
                min="1"
                value={editForm.qty}
                onChange={(event) => setEditForm((form) => ({ ...form, qty: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm">
              plannedFulfillDate
              <Input
                type="date"
                value={editForm.plannedFulfillDate}
                onChange={(event) => setEditForm((form) => ({ ...form, plannedFulfillDate: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm">
              包裝
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editForm.packagingId}
                onChange={(event) => setEditForm((form) => ({ ...form, packagingId: event.target.value }))}
              >
                <option value="">不指定</option>
                {packagings.map((packaging) => (
                  <option key={packaging.packagingId} value={packaging.packagingId}>
                    {packaging.packagingName}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              備註
              <textarea
                className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editForm.remark}
                onChange={(event) => setEditForm((form) => ({ ...form, remark: event.target.value }))}
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                取消
              </Button>
              <Button
                disabled={!editingItem || updateItemMutation.isPending}
                onClick={() => {
                  if (!editingItem) return;
                  updateItemMutation.mutate({
                    itemId: editingItem.id,
                    input: {
                      qty: Number(editForm.qty),
                      packagingId: editForm.packagingId || null,
                      plannedFulfillDate: editForm.plannedFulfillDate,
                      remark: editForm.remark || null
                    }
                  });
                }}
              >
                儲存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
