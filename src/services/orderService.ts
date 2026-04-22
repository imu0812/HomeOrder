import type {
  ConfirmOrderResult,
  ExpandedRequirement,
  InventoryTransaction,
  Order,
  OrderActionResult,
  OrderItem,
  OrderItemComponent,
  OrderMixItem,
  Packaging,
  Product
} from "@/domain/types";
import { createOrderRequestSchema } from "@/domain/schemas";
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

async function expandProductRequirement(
  repos: Repositories,
  order: Order,
  orderItem: OrderItem,
  product: Product,
  snapshots: OrderItemComponent[]
) {
  const requirements: RequirementAccumulator = new Map();

  if (order.orderMode === "custom_mix" || product.productType === "custom_bundle_template") {
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

async function enrichProductRequirements(repos: Repositories, requirements: RequirementAccumulator) {
  const expanded: ExpandedRequirement[] = [];
  for (const [itemId, item] of requirements) {
    const product = await repos.products.findById(itemId);
    const inventory = await repos.inventory.getProductInventory(itemId);
    expanded.push({
      itemId,
      itemName: product?.productName ?? item.itemName,
      qty: item.qty,
      availableStock: inventory?.availableStock ?? 0,
      safeStock: product?.safeStock ?? 0
    });
  }
  return expanded;
}

async function enrichPackagingRequirements(repos: Repositories, requirements: RequirementAccumulator) {
  const expanded: ExpandedRequirement[] = [];
  for (const [itemId, item] of requirements) {
    const packaging = await repos.packagings.findById(itemId);
    const inventory = await repos.inventory.getPackagingInventory(itemId);
    expanded.push({
      itemId,
      itemName: packaging?.packagingName ?? item.itemName,
      qty: item.qty,
      availableStock: inventory?.availableStock ?? 0,
      safeStock: packaging?.safeStock ?? 0
    });
  }
  return expanded;
}

function makeTransactions(
  order: Order,
  txnType: InventoryTransaction["txnType"],
  snapshots: OrderItemComponent[],
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

export async function getOrderDetail(repos: Repositories, orderId: string) {
  const order = await repos.orders.findOrder(orderId);
  if (!order) return undefined;
  const items = await repos.orders.listOrderItems(orderId);
  const mixItems = await Promise.all(
    items.map(async (item) => ({
      orderItemId: item.id,
      items: await repos.orders.listMixItems(item.id)
    }))
  );
  const components = await repos.orders.listComponents(orderId);
  return { order, items, mixItems, components };
}

export async function confirmOrder(repos: Repositories, orderId: string): Promise<ConfirmOrderResult> {
  const order = await repos.orders.findOrder(orderId);
  if (!order) return toApiError(orderId, "找不到訂單。");
  if (order.orderStatus !== "draft") return toApiError(orderId, "只有 draft 訂單可以執行 Confirm 預留。");

  const orderItems = await repos.orders.listOrderItems(orderId);
  const productRequirements: RequirementAccumulator = new Map();
  const packagingRequirements: RequirementAccumulator = new Map();
  const snapshots: OrderItemComponent[] = [];

  for (const orderItem of orderItems) {
    const product = await repos.products.findById(orderItem.productId);
    if (!product) continue;

    const itemProductRequirements = await expandProductRequirement(repos, order, orderItem, product, snapshots);
    for (const [itemId, requirement] of itemProductRequirements) {
      addRequirement(productRequirements, itemId, requirement.itemName, requirement.qty, requirement.sourceType);
    }

    if (!orderItem.packagingId) continue;
    const packaging = await repos.packagings.findById(orderItem.packagingId);
    if (!packaging) continue;

    const itemPackagingRequirements = await expandPackagingRequirement(repos, orderItem, packaging, snapshots);
    for (const [itemId, requirement] of itemPackagingRequirements) {
      addRequirement(packagingRequirements, itemId, requirement.itemName, requirement.qty, requirement.sourceType);
    }
  }

  const expandedProducts = await enrichProductRequirements(repos, productRequirements);
  const expandedPackagings = await enrichPackagingRequirements(repos, packagingRequirements);
  const shortagePackagings = findShortages(expandedPackagings);

  await repos.orders.replaceComponents(orderId, snapshots);
  await repos.transactions.appendMany(makeTransactions(order, "reserve", snapshots, `Reserve for ${order.orderNo}`));

  for (const item of expandedProducts) await repos.inventory.addReservedStock("product", item.itemId, item.qty);
  for (const item of expandedPackagings) await repos.inventory.addReservedStock("packaging", item.itemId, item.qty);
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

export async function shipOrder(repos: Repositories, orderId: string): Promise<OrderActionResult> {
  const order = await repos.orders.findOrder(orderId);
  if (!order) return { success: false, message: "找不到訂單。", orderId, snapshots: [] };
  if (order.orderStatus !== "confirmed") {
    return { success: false, message: "只有 confirmed 訂單可以出貨。", orderId, snapshots: [] };
  }

  const snapshots = await repos.orders.listComponents(orderId);
  if (snapshots.length === 0) {
    return { success: false, message: "找不到 OrderItemComponents 快照，無法出貨。", orderId, snapshots: [] };
  }

  for (const snapshot of snapshots) {
    await repos.inventory.deductReservedStock(snapshot.itemType, snapshot.itemId, snapshot.qty);
  }
  await repos.transactions.appendMany(makeTransactions(order, "deduct", snapshots, `Ship and deduct for ${order.orderNo}`));
  await repos.orders.updateOrder({ ...order, orderStatus: "shipped" });

  return { success: true, message: "已依快照完成出貨扣庫。", orderId, snapshots };
}

export async function cancelOrder(repos: Repositories, orderId: string): Promise<OrderActionResult> {
  const order = await repos.orders.findOrder(orderId);
  if (!order) return { success: false, message: "找不到訂單。", orderId, snapshots: [] };
  if (order.orderStatus !== "confirmed") {
    return { success: false, message: "只有 confirmed 訂單可以取消並釋放預留。", orderId, snapshots: [] };
  }

  const snapshots = await repos.orders.listComponents(orderId);
  if (snapshots.length === 0) {
    return { success: false, message: "找不到 OrderItemComponents 快照，無法取消。", orderId, snapshots: [] };
  }

  for (const snapshot of snapshots) {
    await repos.inventory.releaseReservedStock(snapshot.itemType, snapshot.itemId, snapshot.qty);
  }
  await repos.transactions.appendMany(makeTransactions(order, "release", snapshots, `Cancel and release for ${order.orderNo}`));
  await repos.orders.updateOrder({ ...order, orderStatus: "cancelled" });

  return { success: true, message: "已依快照釋放預留庫存。", orderId, snapshots };
}

export async function createMockOrderFromTemplate(repos: Repositories, rawInput: unknown): Promise<Order> {
  const input = createOrderRequestSchema.parse(rawInput);
  const now = nowIso();
  const orderId = createId("o");
  const orderNo = `ORD-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.floor(Math.random() * 900 + 100)}`;

  const fallbackItems =
    input.items ??
    ({
      single: [{ productId: "p_pineapple", qty: 10, packagingId: "pkg_pineapple_bag" }],
      bundle: [{ productId: "p_combo_a", qty: 2, packagingId: "pkg_mid_12" }],
      custom_mix: [
        {
          productId: "p_custom_12",
          qty: 1,
          packagingId: "pkg_mid_12",
          mixItems: [
            { productId: "p_yolk", qty: 3 },
            { productId: "p_pineapple", qty: 5 },
            { productId: "p_taro", qty: 4 }
          ]
        }
      ]
    }[input.template ?? "bundle"]);

  const orderItems: OrderItem[] = [];
  const orderMixItems: OrderMixItem[] = [];
  let totalAmount = 0;
  let hasCustomMix = false;
  let hasBundle = false;

  for (const [index, item] of fallbackItems.entries()) {
    const product = await repos.products.findById(item.productId);
    if (!product) throw new Error("找不到訂單商品。");
    const packaging = item.packagingId ? await repos.packagings.findById(item.packagingId) : undefined;
    const orderItemId = createId("oi");
    const subtotal = product.price * item.qty;

    if (product.productType === "custom_bundle_template") hasCustomMix = true;
    if (product.productType === "bundle") hasBundle = true;
    totalAmount += subtotal;

    orderItems.push({
      id: orderItemId,
      orderId,
      productId: product.productId,
      productNameSnapshot: product.productName,
      qty: item.qty,
      unitPrice: product.price,
      subtotal,
      packagingId: packaging?.packagingId,
      packagingNameSnapshot: packaging?.packagingName
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

    if (index === 0 && product.productType === "single") {
      // no-op: keeps the branch explicit for order mode inference.
    }
  }

  const order: Order = {
    orderId,
    orderNo,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    pickupDate: input.pickupDate,
    orderStatus: "draft",
    paymentStatus: "unpaid",
    totalAmount,
    orderMode: hasCustomMix ? "custom_mix" : hasBundle ? "fixed_bundle" : "normal",
    note: input.note,
    createdAt: now,
    createdBy: mockSession.userId
  };

  return repos.orders.createOrder({ order, items: orderItems, mixItems: orderMixItems });
}
