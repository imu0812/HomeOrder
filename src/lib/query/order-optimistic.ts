import type { QueryClient } from "@tanstack/react-query";
import type { OrderDetail, OrderItem, OrderListItem, OrderProgress, ScheduleItem } from "@/domain/types";
import { deriveOrderProgress } from "@/services/orderService";

type QuerySnapshot = {
  orderDetail?: OrderDetail;
  orders?: OrderListItem[];
  schedules: Array<[readonly unknown[], ScheduleItem[] | undefined]>;
};

function sortScheduleItems(items: ScheduleItem[]) {
  return [...items].sort((a, b) => a.orderNo.localeCompare(b.orderNo) || a.item.id.localeCompare(b.item.id));
}

function getNextPlannedFulfillDate(items: OrderItem[]) {
  return [...items]
    .filter((item) => item.itemStatus === "pending")
    .sort((a, b) => a.plannedFulfillDate.localeCompare(b.plannedFulfillDate))[0]?.plannedFulfillDate;
}

export function captureOrderQuerySnapshot(queryClient: QueryClient, orderId: string): QuerySnapshot {
  return {
    orderDetail: queryClient.getQueryData<OrderDetail>(["order", orderId]),
    orders: queryClient.getQueryData<OrderListItem[]>(["orders"]),
    schedules: queryClient.getQueriesData<ScheduleItem[]>({ queryKey: ["schedule"] })
  };
}

export function restoreOrderQuerySnapshot(queryClient: QueryClient, orderId: string, snapshot: QuerySnapshot) {
  if (snapshot.orderDetail) queryClient.setQueryData(["order", orderId], snapshot.orderDetail);
  if (snapshot.orders) queryClient.setQueryData(["orders"], snapshot.orders);
  for (const [key, data] of snapshot.schedules) {
    queryClient.setQueryData(key, data);
  }
}

function patchOrderSummary(
  rows: OrderListItem[] | undefined,
  orderId: string,
  updater: (row: OrderListItem) => OrderListItem
) {
  if (!rows) return rows;
  return rows.map((row) => (row.order.orderId === orderId ? updater(row) : row));
}

function patchScheduleEntries(
  entries: Array<[readonly unknown[], ScheduleItem[] | undefined]>,
  updater: (items: ScheduleItem[]) => ScheduleItem[]
) {
  return entries.map(([key, items]) => [key, items ? updater(items) : items] as const);
}

function replaceScheduleCaches(queryClient: QueryClient, entries: ReadonlyArray<readonly [readonly unknown[], ScheduleItem[] | undefined]>) {
  for (const [key, items] of entries) {
    queryClient.setQueryData(key, items);
  }
}

function updateOrderDetailProgress(detail: OrderDetail): OrderDetail {
  const orderProgress = deriveOrderProgress(detail.items);
  const hasFulfilledItems = detail.items.some((item) => item.itemStatus === "fulfilled");
  return { ...detail, orderProgress, hasFulfilledItems };
}

export function optimisticFulfillOrderItem(queryClient: QueryClient, orderId: string, itemId: string, fulfilledAt: string) {
  const currentDetail = queryClient.getQueryData<OrderDetail>(["order", orderId]);
  const targetItem = currentDetail?.items.find((item) => item.id === itemId);
  if (!currentDetail || !targetItem) return;

  const updatedItems: OrderItem[] = currentDetail.items.map((item) =>
    item.id === itemId ? { ...item, itemStatus: "fulfilled" as const, fulfilledAt } : item
  );
  const updatedDetail = updateOrderDetailProgress({ ...currentDetail, items: updatedItems });
  queryClient.setQueryData(["order", orderId], updatedDetail);

  const updatedOrders = patchOrderSummary(queryClient.getQueryData<OrderListItem[]>(["orders"]), orderId, (row) => ({
    ...row,
    orderProgress: updatedDetail.orderProgress,
    pendingItemCount: Math.max(0, row.pendingItemCount - 1),
    fulfilledItemCount: row.fulfilledItemCount + 1,
    nextPlannedFulfillDate: getNextPlannedFulfillDate(updatedItems)
  }));
  if (updatedOrders) queryClient.setQueryData(["orders"], updatedOrders);

  const updatedSchedules = patchScheduleEntries(
    queryClient.getQueriesData<ScheduleItem[]>({ queryKey: ["schedule"] }),
    (items) =>
      sortScheduleItems(
        items.map((row) =>
          row.orderId === orderId
            ? {
                ...row,
                orderProgress:
                  row.item.id === itemId || updatedDetail.items.some((item) => item.id === row.item.id)
                    ? updatedDetail.orderProgress
                    : row.orderProgress,
                item:
                  row.item.id === itemId ? { ...row.item, itemStatus: "fulfilled", fulfilledAt } : row.item
              }
            : row
        )
      )
  );
  replaceScheduleCaches(queryClient, updatedSchedules);
}

function applyOrderStatusToDetail(detail: OrderDetail, status: OrderDetail["order"]["orderStatus"], itemUpdater?: (item: OrderItem) => OrderItem) {
  const items = itemUpdater ? detail.items.map(itemUpdater) : detail.items;
  return updateOrderDetailProgress({
    ...detail,
    order: { ...detail.order, orderStatus: status },
    items
  });
}

function applyOrderStatusToOrders(rows: OrderListItem[] | undefined, orderId: string, status: OrderListItem["order"]["orderStatus"], items?: OrderItem[]) {
  return patchOrderSummary(rows, orderId, (row) => ({
    ...row,
    order: { ...row.order, orderStatus: status },
    orderProgress: items ? deriveOrderProgress(items) : row.orderProgress,
    pendingItemCount: items ? items.filter((item) => item.itemStatus === "pending").length : row.pendingItemCount,
    fulfilledItemCount: items ? items.filter((item) => item.itemStatus === "fulfilled").length : row.fulfilledItemCount,
    nextPlannedFulfillDate: items ? getNextPlannedFulfillDate(items) : row.nextPlannedFulfillDate
  }));
}

export function optimisticConfirmOrder(queryClient: QueryClient, orderId: string) {
  const detail = queryClient.getQueryData<OrderDetail>(["order", orderId]);
  if (!detail) return;
  const updatedDetail = applyOrderStatusToDetail(detail, "confirmed");
  queryClient.setQueryData(["order", orderId], updatedDetail);

  const orders = applyOrderStatusToOrders(queryClient.getQueryData<OrderListItem[]>(["orders"]), orderId, "confirmed", updatedDetail.items);
  if (orders) queryClient.setQueryData(["orders"], orders);
}

export function optimisticUnconfirmOrder(queryClient: QueryClient, orderId: string) {
  const detail = queryClient.getQueryData<OrderDetail>(["order", orderId]);
  if (!detail) return;
  const updatedDetail = applyOrderStatusToDetail(detail, "draft");
  queryClient.setQueryData(["order", orderId], updatedDetail);

  const orders = applyOrderStatusToOrders(queryClient.getQueryData<OrderListItem[]>(["orders"]), orderId, "draft", updatedDetail.items);
  if (orders) queryClient.setQueryData(["orders"], orders);

  const updatedSchedules = patchScheduleEntries(
    queryClient.getQueriesData<ScheduleItem[]>({ queryKey: ["schedule"] }),
    (items) => items.filter((row) => row.orderId !== orderId)
  );
  replaceScheduleCaches(queryClient, updatedSchedules);
}

export function optimisticVoidOrder(queryClient: QueryClient, orderId: string) {
  const detail = queryClient.getQueryData<OrderDetail>(["order", orderId]);
  if (!detail) return;
  const updatedDetail = applyOrderStatusToDetail(detail, "cancelled", (item) =>
    item.itemStatus === "fulfilled" ? item : { ...item, itemStatus: "cancelled", fulfilledAt: undefined }
  );
  queryClient.setQueryData(["order", orderId], updatedDetail);

  const orders = applyOrderStatusToOrders(queryClient.getQueryData<OrderListItem[]>(["orders"]), orderId, "cancelled", updatedDetail.items);
  if (orders) queryClient.setQueryData(["orders"], orders);

  const updatedSchedules = patchScheduleEntries(
    queryClient.getQueriesData<ScheduleItem[]>({ queryKey: ["schedule"] }),
    (items) => items.filter((row) => row.orderId !== orderId)
  );
  replaceScheduleCaches(queryClient, updatedSchedules);
}

export function relevantScheduleDates(detail: OrderDetail | undefined) {
  return detail ? [...new Set(detail.items.map((item) => item.plannedFulfillDate))] : [];
}

export function findOrderItemDate(detail: OrderDetail | undefined, itemId: string) {
  return detail?.items.find((item) => item.id === itemId)?.plannedFulfillDate;
}

export function progressFromItems(items: OrderItem[]): OrderProgress {
  return deriveOrderProgress(items);
}
