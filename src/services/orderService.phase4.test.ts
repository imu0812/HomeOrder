import test from "node:test";
import assert from "node:assert/strict";
import { mockRepositories } from "@/repositories/mock/repositories";
import { mockDb } from "@/repositories/mock/mockData";
import {
  addDraftOrderItem,
  confirmOrder,
  fulfillOrderItem,
  getOrderDetail,
  listScheduleItems,
  unconfirmOrder,
  updatePendingOrderItem,
  voidOrder
} from "@/services/orderService";

function cloneDb() {
  return JSON.parse(JSON.stringify(mockDb)) as typeof mockDb;
}

function restoreDb(snapshot: typeof mockDb) {
  for (const key of Object.keys(mockDb) as Array<keyof typeof mockDb>) {
    mockDb[key] = snapshot[key] as never;
  }
}

test("案例 1：同客戶一張訂單有多個不同日期明細，可在 schedule 分日查到", async () => {
  const snapshot = cloneDb();
  try {
    const april = await listScheduleItems(mockRepositories, "2026-04-30");
    const may = await listScheduleItems(mockRepositories, "2026-05-02");

    assert.ok(april.some((row) => row.orderId === "o_multiday" && row.item.id === "oi_multiday_1"));
    assert.ok(may.some((row) => row.orderId === "o_multiday" && row.item.id === "oi_multiday_2"));
  } finally {
    restoreDb(snapshot);
  }
});

test("pending item can be edited after another item is fulfilled, and reservations are recalculated for pending only", async () => {
  const snapshot = cloneDb();
  try {
    const result = await updatePendingOrderItem(mockRepositories, "o_multiday", "oi_multiday_2", {
      qty: 3,
      plannedFulfillDate: "2026-05-03",
      packagingId: "pkg_cookie_bag",
      remark: "edited pending item"
    });

    assert.equal(result.success, true);
    assert.equal(result.item?.qty, 3);
    assert.equal(result.item?.plannedFulfillDate, "2026-05-03");
    assert.equal(result.item?.remark, "edited pending item");

    const fulfilledSnapshot = mockDb.orderItemComponents.find(
      (item) => item.orderItemId === "oi_multiday_1" && item.itemType === "packaging"
    );
    const pendingSnapshot = mockDb.orderItemComponents.find(
      (item) => item.orderItemId === "oi_multiday_2" && item.itemType === "packaging"
    );
    const inventory = mockDb.inventoryPackagings.find((item) => item.packagingId === "pkg_cookie_bag");

    assert.equal(fulfilledSnapshot?.qty, 4);
    assert.equal(pendingSnapshot?.qty, 3);
    assert.equal(inventory?.reservedStock, 3);
    assert.equal(result.expandedPackagings.length, 1);
    assert.equal(result.expandedPackagings[0].qty, 3);
  } finally {
    restoreDb(snapshot);
  }
});

test("fulfilled item is locked from edit and cancel", async () => {
  const snapshot = cloneDb();
  try {
    const editResult = await updatePendingOrderItem(mockRepositories, "o_multiday", "oi_multiday_1", { qty: 2 });
    const cancelResult = await updatePendingOrderItem(mockRepositories, "o_multiday", "oi_multiday_1", { cancel: true });
    const item = mockDb.orderItems.find((row) => row.id === "oi_multiday_1");

    assert.equal(editResult.success, false);
    assert.equal(cancelResult.success, false);
    assert.equal(item?.itemStatus, "fulfilled");
    assert.equal(item?.qty, 4);
  } finally {
    restoreDb(snapshot);
  }
});

test("draft order can add an item and recalculates totals", async () => {
  const snapshot = cloneDb();
  try {
    const before = mockDb.orders.find((item) => item.orderId === "o_shortage");
    assert.ok(before);

    const result = await addDraftOrderItem(mockRepositories, "o_shortage", {
      productId: "p_pineapple",
      qty: 2,
      packagingId: "pkg_cookie_bag",
      plannedFulfillDate: "2026-05-04",
      remark: "draft add"
    });
    const orderItems = mockDb.orderItems.filter((item) => item.orderId === "o_shortage");
    const order = mockDb.orders.find((item) => item.orderId === "o_shortage");

    assert.equal(result.success, true);
    assert.equal(result.item?.itemStatus, "pending");
    assert.equal(result.item?.subtotal, 100);
    assert.equal(orderItems.length, 2);
    assert.equal(order?.subtotalBeforeDiscount, 820);
    assert.equal(order?.totalAmount, 820);
  } finally {
    restoreDb(snapshot);
  }
});

test("last active draft item cannot be cancelled; add another item then cancel is allowed", async () => {
  const snapshot = cloneDb();
  try {
    const denied = await updatePendingOrderItem(mockRepositories, "o_shortage", "oi_shortage_1", { cancel: true });
    assert.equal(denied.success, false);
    assert.match(denied.message, /At least one order item/);

    await addDraftOrderItem(mockRepositories, "o_shortage", {
      productId: "p_pineapple",
      qty: 1,
      plannedFulfillDate: "2026-05-04"
    });
    const addedItem = mockDb.orderItems.find((item) => item.orderId === "o_shortage" && item.productId === "p_pineapple");
    assert.ok(addedItem);

    const allowed = await updatePendingOrderItem(mockRepositories, "o_shortage", addedItem.id, { cancel: true });
    assert.equal(allowed.success, true);
    assert.equal(allowed.item?.itemStatus, "cancelled");
  } finally {
    restoreDb(snapshot);
  }
});

test("canceling a pending item removes only pending reservations and excludes fulfilled snapshots from shortage checks", async () => {
  const snapshot = cloneDb();
  try {
    const result = await updatePendingOrderItem(mockRepositories, "o_multiday", "oi_multiday_2", { cancel: true });
    const inventory = mockDb.inventoryPackagings.find((item) => item.packagingId === "pkg_cookie_bag");
    const fulfilledSnapshot = mockDb.orderItemComponents.find(
      (item) => item.orderItemId === "oi_multiday_1" && item.itemType === "packaging"
    );
    const pendingSnapshot = mockDb.orderItemComponents.find((item) => item.orderItemId === "oi_multiday_2");

    assert.equal(result.success, true);
    assert.equal(result.item?.itemStatus, "cancelled");
    assert.equal(inventory?.reservedStock, 0);
    assert.equal(fulfilledSnapshot?.qty, 4);
    assert.equal(pendingSnapshot, undefined);
    assert.equal(result.expandedPackagings.length, 0);
    assert.equal(result.shortagePackagings.length, 0);
  } finally {
    restoreDb(snapshot);
  }
});

test("案例 2：單筆明細 fulfilled 不會改變 Order 主狀態", async () => {
  const snapshot = cloneDb();
  try {
    mockDb.orderItems.find((item) => item.id === "oi_multiday_1")!.itemStatus = "pending";
    mockDb.orderItems.find((item) => item.id === "oi_multiday_1")!.fulfilledAt = undefined;

    const result = await fulfillOrderItem(mockRepositories, "o_multiday", "oi_multiday_1");
    const detail = await getOrderDetail(mockRepositories, "o_multiday");

    assert.equal(result.success, true);
    assert.equal(detail?.order.orderStatus, "confirmed");
    assert.equal(detail?.items.find((item) => item.id === "oi_multiday_1")?.itemStatus, "fulfilled");
  } finally {
    restoreDb(snapshot);
  }
});

test("案例 3：有 fulfilled 明細後不可 unconfirm", async () => {
  const snapshot = cloneDb();
  try {
    const result = await unconfirmOrder(mockRepositories, "o_multiday");
    assert.equal(result.success, false);
    assert.match(result.message, /fulfilled/);
  } finally {
    restoreDb(snapshot);
  }
});

test("案例 4：有 fulfilled 明細後不可 void", async () => {
  const snapshot = cloneDb();
  try {
    const result = await voidOrder(mockRepositories, "o_multiday");
    assert.equal(result.success, false);
    assert.match(result.message, /fulfilled/);
  } finally {
    restoreDb(snapshot);
  }
});

test("案例 5：整單 95 折金額正確", async () => {
  const snapshot = cloneDb();
  try {
    const order = mockDb.orders.find((item) => item.orderId === "o_multiday");
    assert.ok(order);
    assert.equal(order.subtotalBeforeDiscount, 570);
    assert.equal(order.discountType, "percentage");
    assert.equal(order.discountRate, 0.95);
    assert.equal(order.discountAmount, 29);
    assert.equal(order.totalAmount, 541);
  } finally {
    restoreDb(snapshot);
  }
});

test("案例 6：包材缺料只顯示 shortagePackagings，不顯示 shortageProducts", async () => {
  const snapshot = cloneDb();
  try {
    const result = await confirmOrder(mockRepositories, "o_shortage");
    assert.equal(result.success, true);
    assert.ok(result.expandedProducts.length > 0);
    assert.ok(result.shortagePackagings.length > 0);
    assert.equal("shortageProducts" in result, false);
  } finally {
    restoreDb(snapshot);
  }
});
