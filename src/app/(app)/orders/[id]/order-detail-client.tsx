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
import { cn, formatDateTime, formatNumber, nowIso } from "@/lib/utils";
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
  mixItems: EditableMixItem[];
};

type AddItemForm = EditItemForm & {
  productId: string;
};

type EditableMixItem = {
  productId: string;
  qty: string;
};

type EditOrderForm = {
  discountType: "none" | "percentage";
  discountRate: string;
  paidAmount: string;
  note: string;
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
  if (!response.ok) throw new Error(json.message ?? "讀取包材失敗");
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

async function recheckPackagingApi(orderId: string): Promise<ConfirmOrderResult> {
  const response = await fetch(`/api/orders/${orderId}/packaging-check`, { method: "POST" });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "包材檢查失敗");
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

async function updateOrderApi(orderId: string, input: Record<string, unknown>) {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "更新訂單失敗");
  return json.data;
}

export function OrderDetailClient({
  orderId,
  initialData,
  initialProducts,
  initialPackagings
}: {
  orderId: string;
  initialData: OrderDetail;
  initialProducts: Product[];
  initialPackagings: Packaging[];
}) {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(initialData.items[0]?.id ?? "");
  const [editForm, setEditForm] = useState<EditItemForm>({
    qty: "",
    packagingId: "",
    plannedFulfillDate: "",
    remark: "",
    mixItems: []
  });
  const [addForm, setAddForm] = useState<AddItemForm>({
    productId: "",
    qty: "1",
    packagingId: "",
    plannedFulfillDate: new Date().toISOString().slice(0, 10),
    remark: "",
    mixItems: []
  });
  const [editOrderForm, setEditOrderForm] = useState<EditOrderForm>({
    discountType: initialData.order.discountType,
    discountRate: String(initialData.order.discountRate),
    paidAmount: String(initialData.order.paidAmount ?? 0),
    note: initialData.order.note ?? ""
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
    initialData: initialPackagings,
    staleTime: 60_000
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    initialData: initialProducts,
    staleTime: 60_000
  });
  const scheduleDates = relevantScheduleDates(data);
  const singleProducts = products.filter((product) => product.productType === "single");

  function isCustomProduct(productId: string) {
    return products.find((product) => product.productId === productId)?.productType === "custom_bundle_template";
  }

  function makeDefaultMixItems(): EditableMixItem[] {
    const preferredIds = ["p_yolk", "p_pineapple", "p_taro"];
    const preferredProducts = preferredIds
      .map((productId) => singleProducts.find((product) => product.productId === productId))
      .filter(Boolean) as Product[];
    const defaults = preferredProducts.length > 0 ? preferredProducts : singleProducts.slice(0, 3);
    return defaults.map((product, index) => ({
      productId: product.productId,
      qty: String([3, 5, 4][index] ?? 1)
    }));
  }

  function toMixPayload(mixItems: EditableMixItem[]) {
    return mixItems
      .filter((mixItem) => mixItem.productId && Number(mixItem.qty) > 0)
      .map((mixItem) => ({ productId: mixItem.productId, qty: Number(mixItem.qty) }));
  }

  function invalidateRelatedQueries(orderIdToRefresh: string, dates: string[]) {
    queryClient.invalidateQueries({ queryKey: ["order", orderIdToRefresh] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    for (const date of dates) {
      queryClient.invalidateQueries({ queryKey: ["schedule", date] });
    }
  }

  function openEditDialog(item: OrderItem) {
    const currentMixItems = data.mixItems.find((group) => group.orderItemId === item.id)?.items ?? [];
    setEditingItem(item);
    setEditForm({
      qty: String(item.qty),
      packagingId: item.packagingId ?? "",
      plannedFulfillDate: item.plannedFulfillDate,
      remark: item.remark ?? "",
      mixItems: currentMixItems.map((mixItem) => ({
        productId: mixItem.productId,
        qty: String(mixItem.qty)
      }))
    });
  }

  function openAddDialog() {
    setAddForm((form) => ({
      ...form,
      productId: form.productId || products[0]?.productId || "",
      packagingId: form.packagingId || packagings[0]?.packagingId || "",
      mixItems:
        isCustomProduct(form.productId || products[0]?.productId || "") && form.mixItems.length === 0
          ? makeDefaultMixItems()
          : form.mixItems
    }));
    setIsAddDialogOpen(true);
  }

  function openEditOrderDialog() {
    setEditOrderForm({
      discountType: data.order.discountType,
      discountRate: String(data.order.discountRate),
      paidAmount: String(data.order.paidAmount ?? 0),
      note: data.order.note ?? ""
    });
    setIsEditOrderDialogOpen(true);
  }

  function renderMixItemsEditor(
    mixItems: EditableMixItem[],
    updateMixItem: (index: number, patch: Partial<EditableMixItem>) => void,
    addMixItem: () => void,
    removeMixItem: (index: number) => void
  ) {
    return (
      <div className="grid gap-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">自選內容</p>
          <Button type="button" variant="outline" size="sm" onClick={addMixItem}>
            <Plus className="mr-2 h-4 w-4" />
            新增內容
          </Button>
        </div>
        {mixItems.map((mixItem, index) => (
          <div key={index} className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={mixItem.productId}
              onChange={(event) => updateMixItem(index, { productId: event.target.value })}
            >
              {singleProducts.map((product) => (
                <option key={product.productId} value={product.productId}>
                  {product.productName}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min="1"
              value={mixItem.qty}
              onChange={(event) => updateMixItem(index, { qty: event.target.value })}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => removeMixItem(index)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {mixItems.length === 0 ? <p className="text-sm text-muted-foreground">尚未設定自選內容</p> : null}
      </div>
    );
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

  const recheckPackagingMutation = useMutation({
    mutationFn: () => recheckPackagingApi(orderId),
    onSuccess: (result) => toast.success(result.message),
    onError: (error) => toast.error(error.message),
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

  const updateOrderMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => updateOrderApi(orderId, input),
    onSuccess: () => {
      toast.success("Order updated");
      setIsEditOrderDialogOpen(false);
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => invalidateRelatedQueries(orderId, scheduleDates)
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
      if (result.item) setSelectedItemId(result.item.id);
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

  const { order, items, mixItems, orderProgress, hasFulfilledItems } = data;
  const isSavingItem = updateItemMutation.isPending || cancelItemMutation.isPending;
  const activeItemCount = items.filter((item) => item.itemStatus !== "cancelled").length;
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0] ?? null;
  const selectedMixItems = selectedItem ? (mixItems.find((group) => group.orderItemId === selectedItem.id)?.items ?? []) : [];
  const displayedShortagePackagings =
    recheckPackagingMutation.data?.shortagePackagings ??
    confirmMutation.data?.shortagePackagings ??
    order.confirmedShortagePackagings;
  const shortageAlertTitle = recheckPackagingMutation.data
    ? "目前包材檢查"
    : confirmMutation.data
      ? "確認時包材提醒"
      : "上次包材提醒";

  return (
    <div className="grid gap-6">
      <OrderSummaryCard
        order={order}
        progress={orderProgress}
        actions={
          <>
            <Button variant="outline" onClick={openEditOrderDialog} disabled={order.orderStatus === "cancelled"}>
              <Edit2 className="mr-2 h-4 w-4" />
              編輯訂單
            </Button>
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
              返回 Draft
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

      {displayedShortagePackagings ? (
        <div className="grid gap-3">
          <ShortageAlert
            shortagePackagings={displayedShortagePackagings}
            checkedAt={order.packagingCheckedAt}
            title={shortageAlertTitle}
          />
          {order.orderStatus !== "cancelled" ? (
            <div>
              <Button
                variant="outline"
                size="sm"
                disabled={recheckPackagingMutation.isPending}
                onClick={() => recheckPackagingMutation.mutate()}
              >
                重新檢查包材
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasFulfilledItems ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            訂單已有 fulfilled 明細，整張訂單不可返回 draft 或 void；pending 明細仍可編輯或取消。
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={isEditOrderDialogOpen} onOpenChange={setIsEditOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯訂單金額</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              折扣類型
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editOrderForm.discountType}
                onChange={(event) =>
                  setEditOrderForm((form) => ({
                    ...form,
                    discountType: event.target.value as EditOrderForm["discountType"],
                    discountRate: event.target.value === "none" ? "1" : form.discountRate
                  }))
                }
              >
                <option value="none">無折扣</option>
                <option value="percentage">折扣倍率</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              折扣倍率
              <Input
                type="number"
                step="0.01"
                min="0"
                disabled={editOrderForm.discountType === "none"}
                value={editOrderForm.discountRate}
                onChange={(event) => setEditOrderForm((form) => ({ ...form, discountRate: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm">
              已付金額
              <Input
                type="number"
                step="1"
                min="0"
                value={editOrderForm.paidAmount}
                onChange={(event) => setEditOrderForm((form) => ({ ...form, paidAmount: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm">
              備註
              <textarea
                className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editOrderForm.note}
                onChange={(event) => setEditOrderForm((form) => ({ ...form, note: event.target.value }))}
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOrderDialogOpen(false)}>
                取消
              </Button>
              <Button
                disabled={updateOrderMutation.isPending}
                onClick={() =>
                  updateOrderMutation.mutate({
                    discountType: editOrderForm.discountType,
                    discountRate: editOrderForm.discountType === "none" ? 1 : Number(editOrderForm.discountRate),
                    paidAmount: Number(editOrderForm.paidAmount),
                    note: editOrderForm.note || null
                  })
                }
              >
                儲存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              {items.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                <TableRow
                  key={item.id}
                  aria-selected={isSelected}
                  className={cn(
                    "cursor-pointer border-l-4 border-l-transparent",
                    isSelected && "border-l-primary bg-muted/70 hover:bg-muted/70"
                  )}
                  onClick={() => setSelectedItemId(item.id)}
                >
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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>組合內容</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {[mixItems.find((group) => group.orderItemId === selectedItem?.id)].map((group) =>
            group && group.items.length > 0 ? (
              <div key={group.orderItemId} className="rounded-lg border p-4">
                <p className="mb-3 text-sm font-medium">
                  {selectedItem?.productNameSnapshot} / {selectedItem?.qty} {selectedItem?.unit}
                </p>
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
          {selectedMixItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">此明細沒有自訂組合內容</p>
          ) : null}
        </CardContent>
      </Card>


      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增訂單明細</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              產品
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={addForm.productId}
                onChange={(event) => {
                  const productId = event.target.value;
                  setAddForm((form) => ({
                    ...form,
                    productId,
                    mixItems: isCustomProduct(productId) ? makeDefaultMixItems() : []
                  }));
                }}
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
                <option value="">不指定包裝</option>
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
            {isCustomProduct(addForm.productId)
              ? renderMixItemsEditor(
                  addForm.mixItems,
                  (index, patch) =>
                    setAddForm((form) => ({
                      ...form,
                      mixItems: form.mixItems.map((mixItem, mixIndex) =>
                        mixIndex === index ? { ...mixItem, ...patch } : mixItem
                      )
                    })),
                  () =>
                    setAddForm((form) => ({
                      ...form,
                      mixItems: [...form.mixItems, { productId: singleProducts[0]?.productId ?? "", qty: "1" }]
                    })),
                  (index) =>
                    setAddForm((form) => ({
                      ...form,
                      mixItems: form.mixItems.filter((_, mixIndex) => mixIndex !== index)
                    }))
                )
              : null}
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
                    remark: addForm.remark || undefined,
                    mixItems: isCustomProduct(addForm.productId) ? toMixPayload(addForm.mixItems) : []
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
                <option value="">不指定包裝</option>
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
            {editingItem && isCustomProduct(editingItem.productId)
              ? renderMixItemsEditor(
                  editForm.mixItems,
                  (index, patch) =>
                    setEditForm((form) => ({
                      ...form,
                      mixItems: form.mixItems.map((mixItem, mixIndex) =>
                        mixIndex === index ? { ...mixItem, ...patch } : mixItem
                      )
                    })),
                  () =>
                    setEditForm((form) => ({
                      ...form,
                      mixItems: [...form.mixItems, { productId: singleProducts[0]?.productId ?? "", qty: "1" }]
                    })),
                  (index) =>
                    setEditForm((form) => ({
                      ...form,
                      mixItems: form.mixItems.filter((_, mixIndex) => mixIndex !== index)
                    }))
                )
              : null}
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
                      remark: editForm.remark || null,
                      mixItems: isCustomProduct(editingItem.productId) ? toMixPayload(editForm.mixItems) : []
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
