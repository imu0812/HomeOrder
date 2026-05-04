import type {
  ConfirmOrderResult,
  ExpandedRequirement,
  InventoryTransaction,
  Order,
  OrderActionResult,
  OrderDetail,
  OrderItem,
  OrderItemComponent,
  OrderListItem,
  OrderMixItem,
  OrderProgress,
  Packaging,
  Product,
  ScheduleItem,
  UpdateOrderItemResult
} from "@/domain/types";
import { createOrderItemInputSchema, createOrderRequestSchema, updateOrderItemInputSchema } from "@/domain/schemas";
import { mockSession } from "@/lib/auth/session";
import { createId, nowIso } from "@/lib/utils";
import type { Repositories } from "@/repositories/interfaces";
import { findShortages } from "./inventoryService";
import { buildPackagingShortageSummary } from "./shortageService";

type RequirementAccumulator = Map<
  string,
  {
    itemName: string;
    qty: number;
    sourceType: OrderItemComponent["sourceType"];
  }
>;

type PackagingSnapshot = Pick<OrderItemComponent, "itemId" | "itemNameSnapshot" | "qty" | "itemType">;

export function deriveOrderProgress(items: OrderItem[]): OrderProgress {
  const activeItems = items.filter((item) => item.itemStatus !== "cancelled");
  if (activeItems.length === 0) return "not_started";
  const fulfilledCount = activeItems.filter((item) => item.itemStatus === "fulfilled").length;
  if (fulfilledCount === 0) return "not_started";
  if (fulfilledCount === activeItems.length) return "completed";
  return "partial";
}

function addRequirement(
  acc: RequirementAccumulator,
  itemId: string,
  itemName: string,
  qty: number,
  sourceType: OrderItemComponent["sourceType"]
) {
  const existing = acc.get(itemId);
  acc.set(itemId, {
    itemName,
    qty: (existing?.qty ?? 0) + qty,
    sourceType: existing?.sourceType ?? sourceType
  });
}

function mergeRequirementMaps(target: RequirementAccumulator, source: RequirementAccumulator) {
  for (const [itemId, requirement] of source) {
    addRequirement(target, itemId, requirement.itemName, requirement.qty, requirement.sourceType);
  }
}

function toApiError(orderId: string, message: string): ConfirmOrderResult {
  return {
    success: false,
    message,
    orderId,
    expandedProducts: [],
    expandedPackagings: [],
    shortagePackagings: [],
    snapshots: []
  };
}

function buildOrderActionResult(
  orderId: string,
  success: boolean,
  message: string,
  snapshots: OrderItemComponent[]
): OrderActionResult {
  return { success, message, orderId, snapshots };
}

function roundAmount(value: number) {
  return Math.round(value);
}

function calculateOrderAmounts(
  items: Pick<OrderItem, "subtotal">[],
  discountType: Order["discountType"],
  discountRate: number
) {
  const subtotalBeforeDiscount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const normalizedRate = discountType === "percentage" ? discountRate || 0.95 : 1;
  const totalAmount =
    discountType === "percentage" ? roundAmount(subtotalBeforeDiscount * normalizedRate) : subtotalBeforeDiscount;
  const discountAmount = Math.max(0, subtotalBeforeDiscount - totalAmount);
  return { subtotalBeforeDiscount, discountRate: normalizedRate, discountAmount, totalAmount };
}

function recalculateOrderTotals(order: Order, items: OrderItem[]): Order {
  const amounts = calculateOrderAmounts(
    items.filter((item) => item.itemStatus !== "cancelled"),
    order.discountType,
    order.discountRate
  );
  return { ...order, ...amounts };
}

async function expandProductRequirement(
  repos: Repositories,
  orderItem: OrderItem,
  product: Product,
  snapshots: OrderItemComponent[]
) {
  const requirements: RequirementAccumulator = new Map();

  if (product.productType === "custom_bundle_template") {
    const mixItems = await repos.orders.listMixItems(orderItem.id);
    for (const mixItem of mixItems) {
      const childProduct = await repos.products.findById(mixItem.productId);
      const itemName = childProduct?.productName ?? mixItem.productNameSnapshot;
      addRequirement(requirements, mixItem.productId, itemName, mixItem.qty, "custom_mix");
      snapshots.push({
        id: createId("oic"),
        orderItemId: orderItem.id,
        itemType: "product",
        itemId: mixItem.productId,
        itemNameSnapshot: itemName,
        qty: mixItem.qty,
        sourceType: "custom_mix"
      });
    }
    return requirements;
  }

  if (product.productType === "single") {
    addRequirement(requirements, product.productId, product.productName, orderItem.qty, "single");
    snapshots.push({
      id: createId("oic"),
      orderItemId: orderItem.id,
      itemType: "product",
      itemId: product.productId,
      itemNameSnapshot: product.productName,
      qty: orderItem.qty,
      sourceType: "single"
    });
    return requirements;
  }

  const bomItems = await repos.bom.listProductBom(product.productId);
  for (const bomItem of bomItems) {
    const childProduct = await repos.products.findById(bomItem.childProductId);
    if (!childProduct) continue;
    const qty = orderItem.qty * bomItem.qty;
    addRequirement(requirements, childProduct.productId, childProduct.productName, qty, "product_bom");
    snapshots.push({
      id: createId("oic"),
      orderItemId: orderItem.id,
      itemType: "product",
      itemId: childProduct.productId,
      itemNameSnapshot: childProduct.productName,
      qty,
      sourceType: "product_bom"
    });
  }

  return requirements;
}

async function expandPackagingRequirement(
  repos: Repositories,
  orderItem: OrderItem,
  packaging: Packaging,
  snapshots: OrderItemComponent[]
) {
  const requirements: RequirementAccumulator = new Map();

  if (!packaging.isComposite) {
    addRequirement(requirements, packaging.packagingId, packaging.packagingName, orderItem.qty, "single");
    snapshots.push({
      id: createId("oic"),
      orderItemId: orderItem.id,
      itemType: "packaging",
      itemId: packaging.packagingId,
      itemNameSnapshot: packaging.packagingName,
      qty: orderItem.qty,
      sourceType: "single"
    });
    return requirements;
  }

  const bomItems = await repos.bom.listPackagingBom(packaging.packagingId);
  for (const bomItem of bomItems) {
    const childPackaging = await repos.packagings.findById(bomItem.childPackagingId);
    if (!childPackaging) continue;
    const qty = orderItem.qty * bomItem.qty;
    addRequirement(requirements, childPackaging.packagingId, childPackaging.packagingName, qty, "packaging_bom");
    snapshots.push({
      id: createId("oic"),
      orderItemId: orderItem.id,
      itemType: "packaging",
      itemId: childPackaging.packagingId,
      itemNameSnapshot: childPackaging.packagingName,
      qty,
      sourceType: "packaging_bom"
    });
  }

  return requirements;
}

async function collectRequirementsForOrderItem(
  repos: Repositories,
  orderItem: OrderItem
): Promise<{
  productRequirements: RequirementAccumulator;
  packagingRequirements: RequirementAccumulator;
  snapshots: OrderItemComponent[];
}> {
  const snapshots: OrderItemComponent[] = [];
  const productRequirements: RequirementAccumulator = new Map();
  const packagingRequirements: RequirementAccumulator = new Map();
  const [product, packaging] = await Promise.all([
    repos.products.findById(orderItem.productId),
    orderItem.packagingId ? repos.packagings.findById(orderItem.packagingId) : Promise.resolve(undefined)
  ]);

  if (!product) throw new Error(`找不到商品 ${orderItem.productId}`);
  mergeRequirementMaps(productRequirements, await expandProductRequirement(repos, orderItem, product, snapshots));

  if (orderItem.packagingId) {
    if (!packaging) throw new Error(`找不到包材 ${orderItem.packagingId}`);
    mergeRequirementMaps(packagingRequirements, await expandPackagingRequirement(repos, orderItem, packaging, snapshots));
  }

  return { productRequirements, packagingRequirements, snapshots };
}

async function enrichProductRequirements(repos: Repositories, requirements: RequirementAccumulator) {
  const expanded = await Promise.all(
    [...requirements].map(async ([itemId, item]) => {
      const [product, inventory] = await Promise.all([
        repos.products.findById(itemId),
        repos.inventory.getProductInventory(itemId)
      ]);
      return {
        itemId,
        itemName: product?.productName ?? item.itemName,
        qty: item.qty,
        availableStock: inventory?.availableStock ?? 0,
        safeStock: product?.safeStock ?? 0
      } satisfies ExpandedRequirement;
    })
  );
  return expanded;
}

async function enrichPackagingRequirements(repos: Repositories, requirements: RequirementAccumulator) {
  const expanded = await Promise.all(
    [...requirements].map(async ([itemId, item]) => {
      const [packaging, inventory] = await Promise.all([
        repos.packagings.findById(itemId),
        repos.inventory.getPackagingInventory(itemId)
      ]);
      return {
        itemId,
        itemName: packaging?.packagingName ?? item.itemName,
        qty: item.qty,
        availableStock: inventory?.availableStock ?? 0,
        safeStock: packaging?.safeStock ?? 0
      } satisfies ExpandedRequirement;
    })
  );
  return expanded;
}

function makeTransactions(
  order: Order,
  txnType: InventoryTransaction["txnType"],
  snapshots: PackagingSnapshot[],
  note: string
): InventoryTransaction[] {
  const now = nowIso();
  return snapshots.map((snapshot) => ({
    txnId: createId("txn"),
    itemType: snapshot.itemType,
    itemId: snapshot.itemId,
    txnType,
    qty: snapshot.qty,
    refType: "order",
    refId: order.orderId,
    note,
    createdAt: now,
    createdBy: mockSession.userId
  }));
}

function toPackagingSnapshots(snapshots: OrderItemComponent[]) {
  return snapshots.filter((snapshot) => snapshot.itemType === "packaging");
}

async function releasePackagingReservations(
  repos: Repositories,
  order: Order,
  snapshots: PackagingSnapshot[],
  note: string
) {
  await Promise.all(
    snapshots.map((snapshot) => repos.inventory.releaseReservedStock("packaging", snapshot.itemId, snapshot.qty))
  );
  if (snapshots.length > 0) {
    await repos.transactions.appendMany(makeTransactions(order, "release", snapshots, note));
  }
}

async function deductPackagingReservations(
  repos: Repositories,
  order: Order,
  snapshots: PackagingSnapshot[],
  note: string
) {
  await Promise.all(
    snapshots.map((snapshot) => repos.inventory.deductReservedStock("packaging", snapshot.itemId, snapshot.qty))
  );
  if (snapshots.length > 0) {
    await repos.transactions.appendMany(makeTransactions(order, "deduct", snapshots, note));
  }
}

async function listOrderMixBundles(repos: Repositories, items: OrderItem[]) {
  return Promise.all(
    items.map(async (item) => ({
      orderItemId: item.id,
      items: await repos.orders.listMixItems(item.id)
    }))
  );
}

export async function getOrderDetail(repos: Repositories, orderId: string): Promise<OrderDetail | undefined> {
  const order = await repos.orders.findOrder(orderId);
  if (!order) return undefined;
  const [items, components] = await Promise.all([
    repos.orders.listOrderItems(orderId),
    repos.orders.listComponents(orderId)
  ]);
  const mixItems = await listOrderMixBundles(repos, items);
  return {
    order,
    items,
    mixItems,
    components,
    orderProgress: deriveOrderProgress(items),
    hasFulfilledItems: items.some((item) => item.itemStatus === "fulfilled")
  };
}

export async function listOrderItemsSummary(repos: Repositories): Promise<OrderListItem[]> {
  const orders = await repos.orders.listOrders();
  const orderWithItems = await Promise.all(
    orders.map(async (order) => ({
      order,
      items: await repos.orders.listOrderItems(order.orderId)
    }))
  );

  return orderWithItems.map(({ order, items }) => {
    const activeItems = items.filter((item) => item.itemStatus !== "cancelled");
    const pendingItems = activeItems.filter((item) => item.itemStatus === "pending");
    const fulfilledItems = activeItems.filter((item) => item.itemStatus === "fulfilled");
    const nextPlannedFulfillDate = [...pendingItems]
      .sort((a, b) => a.plannedFulfillDate.localeCompare(b.plannedFulfillDate))[0]?.plannedFulfillDate;

    return {
      order,
      orderProgress: deriveOrderProgress(items),
      itemCount: items.length,
      pendingItemCount: pendingItems.length,
      fulfilledItemCount: fulfilledItems.length,
      nextPlannedFulfillDate
    };
  });
}

export async function listScheduleItems(repos: Repositories, date: string): Promise<ScheduleItem[]> {
  const confirmedOrders = (await repos.orders.listOrders()).filter((order) => order.orderStatus === "confirmed");
  const groupedResults = await Promise.all(
    confirmedOrders.map(async (order) => {
      const items = await repos.orders.listOrderItems(order.orderId);
      const orderProgress = deriveOrderProgress(items);
      return items
        .filter((item) => item.plannedFulfillDate === date)
        .map((item) => ({
          orderId: order.orderId,
          orderNo: order.orderNo,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          orderStatus: order.orderStatus,
          orderProgress,
          item
        }));
    })
  );

  return groupedResults
    .flat()
    .sort((a, b) => a.orderNo.localeCompare(b.orderNo) || a.item.id.localeCompare(b.item.id));
}

export async function confirmOrder(repos: Repositories, orderId: string): Promise<ConfirmOrderResult> {
  const order = await repos.orders.findOrder(orderId);
  if (!order) return toApiError(orderId, "找不到訂單。");
  if (order.orderStatus !== "draft") return toApiError(orderId, "只有 draft 訂單可以確認。");

  const orderItems = await repos.orders.listOrderItems(orderId);
  if (orderItems.length === 0) return toApiError(orderId, "訂單至少需要一筆明細。");

  const productRequirements: RequirementAccumulator = new Map();
  const packagingRequirements: RequirementAccumulator = new Map();
  const snapshots: OrderItemComponent[] = [];

  try {
    const itemResults = await Promise.all(
      orderItems
        .filter((orderItem) => orderItem.itemStatus !== "cancelled")
        .map((orderItem) => collectRequirementsForOrderItem(repos, orderItem))
    );

    for (const itemResult of itemResults) {
      snapshots.push(...itemResult.snapshots);
      mergeRequirementMaps(productRequirements, itemResult.productRequirements);
      mergeRequirementMaps(packagingRequirements, itemResult.packagingRequirements);
    }
  } catch (error) {
    return toApiError(orderId, error instanceof Error ? error.message : "確認訂單時發生錯誤。");
  }

  const [expandedProducts, expandedPackagings] = await Promise.all([
    enrichProductRequirements(repos, productRequirements),
    enrichPackagingRequirements(repos, packagingRequirements)
  ]);
  const shortagePackagings = findShortages(expandedPackagings);
  const packagingSnapshots = toPackagingSnapshots(snapshots);

  await repos.orders.replaceComponents(orderId, snapshots);
  await Promise.all(
    expandedPackagings.map((item) => repos.inventory.addReservedStock("packaging", item.itemId, item.qty))
  );
  if (packagingSnapshots.length > 0) {
    await repos.transactions.appendMany(makeTransactions(order, "reserve", packagingSnapshots, `Reserve for ${order.orderNo}`));
  }
  await repos.orders.updateOrder({ ...order, orderStatus: "confirmed" });

  return {
    success: true,
    message: buildPackagingShortageSummary(expandedPackagings),
    orderId,
    expandedProducts,
    expandedPackagings,
    shortagePackagings,
    snapshots
  };
}

export async function updatePendingOrderItem(
  repos: Repositories,
  orderId: string,
  orderItemId: string,
  rawInput: unknown
): Promise<UpdateOrderItemResult> {
  const input = updateOrderItemInputSchema.parse(rawInput);
  const order = await repos.orders.findOrder(orderId);
  if (!order) return toApiError(orderId, "Order not found");
  if (order.orderStatus === "cancelled") return toApiError(orderId, "Cancelled order cannot be edited");

  const orderItem = await repos.orders.findOrderItem(orderItemId);
  if (!orderItem || orderItem.orderId !== orderId) return toApiError(orderId, "Order item not found");
  if (orderItem.itemStatus !== "pending") return toApiError(orderId, "Only pending order items can be edited");

  const packaging =
    input.packagingId === null
      ? undefined
      : input.packagingId
        ? await repos.packagings.findById(input.packagingId)
        : orderItem.packagingId
          ? await repos.packagings.findById(orderItem.packagingId)
          : undefined;
  if (input.packagingId && !packaging) return toApiError(orderId, "Packaging not found");

  const qty = input.qty ?? orderItem.qty;
  const updatedItem: OrderItem = input.cancel
    ? { ...orderItem, itemStatus: "cancelled", fulfilledAt: undefined }
    : {
        ...orderItem,
        qty,
        subtotal: orderItem.unitPriceSnapshot * qty,
        packagingId: input.packagingId === null ? undefined : (packaging?.packagingId ?? orderItem.packagingId),
        packagingNameSnapshot:
          input.packagingId === null ? undefined : (packaging?.packagingName ?? orderItem.packagingNameSnapshot),
        plannedFulfillDate: input.plannedFulfillDate ?? orderItem.plannedFulfillDate,
        remark: input.remark === null ? undefined : (input.remark ?? orderItem.remark)
      };

  const orderItems = await repos.orders.listOrderItems(orderId);
  const activeItems = orderItems.filter((item) => item.itemStatus !== "cancelled");
  if (input.cancel && activeItems.length <= 1) {
    return toApiError(orderId, "At least one order item is required. Delete or void the whole order instead.");
  }

  const updatedItems = orderItems.map((item) => (item.id === orderItemId ? updatedItem : item));
  const updatedOrder = recalculateOrderTotals(order, updatedItems);

  if (order.orderStatus !== "confirmed") {
    const [savedItem, savedOrder] = await Promise.all([
      repos.orders.updateOrderItem(updatedItem),
      repos.orders.updateOrder(updatedOrder)
    ]);
    return {
      ...toApiError(orderId, "Draft item updated"),
      success: true,
      message: "Draft item updated",
      item: savedItem,
      order: savedOrder
    };
  }

  const existingSnapshots = await repos.orders.listComponents(orderId);
  const fulfilledItemIds = new Set(updatedItems.filter((item) => item.itemStatus === "fulfilled").map((item) => item.id));
  const fulfilledSnapshots = existingSnapshots.filter((snapshot) => fulfilledItemIds.has(snapshot.orderItemId));
  const releasableSnapshots = existingSnapshots.filter((snapshot) => !fulfilledItemIds.has(snapshot.orderItemId));
  const productRequirements: RequirementAccumulator = new Map();
  const packagingRequirements: RequirementAccumulator = new Map();
  const pendingSnapshots: OrderItemComponent[] = [];

  try {
    const itemResults = await Promise.all(
      updatedItems
        .filter((item) => item.itemStatus === "pending")
        .map((item) => collectRequirementsForOrderItem(repos, item))
    );

    for (const itemResult of itemResults) {
      pendingSnapshots.push(...itemResult.snapshots);
      mergeRequirementMaps(productRequirements, itemResult.productRequirements);
      mergeRequirementMaps(packagingRequirements, itemResult.packagingRequirements);
    }
  } catch (error) {
    return toApiError(orderId, error instanceof Error ? error.message : "Failed to recalculate requirements");
  }

  const [expandedProducts, expandedPackagings] = await Promise.all([
    enrichProductRequirements(repos, productRequirements),
    enrichPackagingRequirements(repos, packagingRequirements)
  ]);
  const shortagePackagings = findShortages(expandedPackagings);
  const pendingPackagingSnapshots = toPackagingSnapshots(pendingSnapshots);

  await releasePackagingReservations(repos, order, toPackagingSnapshots(releasableSnapshots), `Recalculate pending items ${order.orderNo}`);
  const [savedItem, savedOrder] = await Promise.all([
    repos.orders.updateOrderItem(updatedItem),
    repos.orders.updateOrder(updatedOrder)
  ]);
  await repos.orders.replaceComponents(orderId, [...fulfilledSnapshots, ...pendingSnapshots]);
  await Promise.all(
    expandedPackagings.map((item) => repos.inventory.addReservedStock("packaging", item.itemId, item.qty))
  );
  if (pendingPackagingSnapshots.length > 0) {
    await repos.transactions.appendMany(
      makeTransactions(order, "reserve", pendingPackagingSnapshots, `Reserve pending items ${order.orderNo}`)
    );
  }

  return {
    success: true,
    message: buildPackagingShortageSummary(expandedPackagings),
    orderId,
    expandedProducts,
    expandedPackagings,
    shortagePackagings,
    snapshots: [...fulfilledSnapshots, ...pendingSnapshots],
    item: savedItem,
    order: savedOrder
  };
}

export async function addDraftOrderItem(
  repos: Repositories,
  orderId: string,
  rawInput: unknown
): Promise<UpdateOrderItemResult> {
  const input = createOrderItemInputSchema.parse(rawInput);
  const order = await repos.orders.findOrder(orderId);
  if (!order) return toApiError(orderId, "Order not found");
  if (order.orderStatus !== "draft") return toApiError(orderId, "Only draft orders can add items");

  const product = await repos.products.findById(input.productId);
  if (!product) return toApiError(orderId, `Product not found: ${input.productId}`);
  if (typeof product.price !== "number") return toApiError(orderId, `Product price is not set: ${product.productName}`);

  const packaging = input.packagingId ? await repos.packagings.findById(input.packagingId) : undefined;
  if (input.packagingId && !packaging) return toApiError(orderId, `Packaging not found: ${input.packagingId}`);

  const orderItemId = createId("oi");
  const subtotal = product.price * input.qty;
  const item: OrderItem = {
    id: orderItemId,
    orderId,
    productId: product.productId,
    productNameSnapshot: product.productName,
    qty: input.qty,
    unit: product.unit,
    unitPriceSnapshot: product.price,
    subtotal,
    packagingId: packaging?.packagingId,
    packagingNameSnapshot: packaging?.packagingName,
    plannedFulfillDate: input.plannedFulfillDate,
    itemStatus: "pending",
    remark: input.remark
  };
  const mixItems: OrderMixItem[] = [];

  for (const [mixIndex, mixItem] of (input.mixItems ?? []).entries()) {
    const mixProduct = await repos.products.findById(mixItem.productId);
    mixItems.push({
      id: createId("mix"),
      orderItemId,
      productId: mixItem.productId,
      productNameSnapshot: mixProduct?.productName ?? mixItem.productId,
      qty: mixItem.qty,
      unit: mixProduct?.unit ?? "個",
      sortOrder: mixIndex + 1
    });
  }

  const orderItems = await repos.orders.listOrderItems(orderId);
  const updatedOrder = recalculateOrderTotals(order, [...orderItems, item]);
  const [savedItem, savedOrder] = await Promise.all([
    repos.orders.createOrderItem({ item, mixItems }),
    repos.orders.updateOrder(updatedOrder)
  ]);

  return {
    ...toApiError(orderId, "Draft item added"),
    success: true,
    message: "Draft item added",
    item: savedItem,
    order: savedOrder
  };
}

export async function fulfillOrderItem(
  repos: Repositories,
  orderId: string,
  orderItemId: string
): Promise<OrderActionResult> {
  const order = await repos.orders.findOrder(orderId);
  if (!order) return buildOrderActionResult(orderId, false, "找不到訂單。", []);
  if (order.orderStatus !== "confirmed") {
    return buildOrderActionResult(orderId, false, "只有 confirmed 訂單可以執行明細出貨。", []);
  }

  const orderItem = await repos.orders.findOrderItem(orderItemId);
  if (!orderItem || orderItem.orderId !== orderId) {
    return buildOrderActionResult(orderId, false, "找不到訂單明細。", []);
  }
  if (orderItem.itemStatus !== "pending") {
    return buildOrderActionResult(orderId, false, "只有 pending 明細可以標記 fulfilled。", []);
  }

  const itemSnapshots = (await repos.orders.listComponents(orderId)).filter((snapshot) => snapshot.orderItemId === orderItemId);
  const packagingSnapshots = toPackagingSnapshots(itemSnapshots);
  await deductPackagingReservations(repos, order, packagingSnapshots, `Fulfill item ${orderItemId}`);
  await repos.orders.updateOrderItem({
    ...orderItem,
    itemStatus: "fulfilled",
    fulfilledAt: nowIso()
  });

  return buildOrderActionResult(orderId, true, "訂單明細已完成交付。", itemSnapshots);
}

export async function unconfirmOrder(repos: Repositories, orderId: string): Promise<OrderActionResult> {
  const order = await repos.orders.findOrder(orderId);
  if (!order) return buildOrderActionResult(orderId, false, "找不到訂單。", []);
  if (order.orderStatus !== "confirmed") {
    return buildOrderActionResult(orderId, false, "只有 confirmed 訂單可以回到 draft。", []);
  }

  const orderItems = await repos.orders.listOrderItems(orderId);
  if (orderItems.some((item) => item.itemStatus === "fulfilled")) {
    return buildOrderActionResult(orderId, false, "已有 fulfilled 明細，不能 unconfirm。", []);
  }

  const snapshots = await repos.orders.listComponents(orderId);
  await releasePackagingReservations(repos, order, toPackagingSnapshots(snapshots), `Unconfirm ${order.orderNo}`);
  await repos.orders.replaceComponents(orderId, []);
  await repos.orders.updateOrder({ ...order, orderStatus: "draft" });

  return buildOrderActionResult(orderId, true, "訂單已回到 draft，包材預留已釋放。", snapshots);
}

export async function voidOrder(repos: Repositories, orderId: string): Promise<OrderActionResult> {
  const order = await repos.orders.findOrder(orderId);
  if (!order) return buildOrderActionResult(orderId, false, "找不到訂單。", []);
  if (order.orderStatus === "cancelled") {
    return buildOrderActionResult(orderId, false, "訂單已作廢。", []);
  }

  const orderItems = await repos.orders.listOrderItems(orderId);
  if (orderItems.some((item) => item.itemStatus === "fulfilled")) {
    return buildOrderActionResult(orderId, false, "已有 fulfilled 明細，不能 void。", []);
  }

  const snapshots = await repos.orders.listComponents(orderId);
  if (order.orderStatus === "confirmed") {
    await releasePackagingReservations(repos, order, toPackagingSnapshots(snapshots), `Void ${order.orderNo}`);
  }

  await Promise.all(
    orderItems.map((item) =>
      repos.orders.updateOrderItem({
        ...item,
        itemStatus: "cancelled",
        fulfilledAt: undefined
      })
    )
  );
  await repos.orders.replaceComponents(orderId, []);
  await repos.orders.updateOrder({ ...order, orderStatus: "cancelled" });

  return buildOrderActionResult(orderId, true, "訂單已作廢。", snapshots);
}

export async function createMockOrderFromTemplate(repos: Repositories, rawInput: unknown): Promise<Order> {
  const input = createOrderRequestSchema.parse(rawInput);
  const now = nowIso();
  const orderId = createId("o");
  const orderNo = `ORD-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.floor(Math.random() * 900 + 100)}`;

  const fallbackItems =
    input.items.length > 0
      ? input.items
      : [
          {
            productId: "p_pineapple",
            qty: 10,
            packagingId: "pkg_cookie_bag",
            plannedFulfillDate: "2026-04-30"
          }
        ];

  const orderItems: OrderItem[] = [];
  const orderMixItems: OrderMixItem[] = [];

  for (const item of fallbackItems) {
    const product = await repos.products.findById(item.productId);
    if (!product) throw new Error(`找不到商品 ${item.productId}`);
    if (typeof product.price !== "number") throw new Error(`商品 ${product.productName} 尚未設定售價`);

    const packaging = item.packagingId ? await repos.packagings.findById(item.packagingId) : undefined;
    const orderItemId = createId("oi");
    const subtotal = product.price * item.qty;

    orderItems.push({
      id: orderItemId,
      orderId,
      productId: product.productId,
      productNameSnapshot: product.productName,
      qty: item.qty,
      unit: product.unit,
      unitPriceSnapshot: product.price,
      subtotal,
      packagingId: packaging?.packagingId,
      packagingNameSnapshot: packaging?.packagingName,
      plannedFulfillDate: item.plannedFulfillDate,
      itemStatus: "pending",
      remark: item.remark
    });

    for (const [mixIndex, mixItem] of (item.mixItems ?? []).entries()) {
      const mixProduct = await repos.products.findById(mixItem.productId);
      orderMixItems.push({
        id: createId("mix"),
        orderItemId,
        productId: mixItem.productId,
        productNameSnapshot: mixProduct?.productName ?? mixItem.productId,
        qty: mixItem.qty,
        unit: mixProduct?.unit ?? "顆",
        sortOrder: mixIndex + 1
      });
    }
  }

  const amounts = calculateOrderAmounts(orderItems, input.discountType, input.discountRate);
  const order: Order = {
    orderId,
    orderNo,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    orderStatus: "draft",
    subtotalBeforeDiscount: amounts.subtotalBeforeDiscount,
    discountType: input.discountType,
    discountRate: amounts.discountRate,
    discountAmount: amounts.discountAmount,
    totalAmount: amounts.totalAmount,
    note: input.note,
    createdAt: now,
    createdBy: mockSession.userId
  };

  return repos.orders.createOrder({ order, items: orderItems, mixItems: orderMixItems });
}
