import type {
  InventoryPackaging,
  InventoryProduct,
  InventoryTransaction,
  Order,
  OrderItem,
  OrderItemComponent,
  OrderMixItem,
  Packaging,
  PackagingBOMItem,
  Product,
  ProductBOMItem,
  User
} from "@/domain/types";

const now = "2026-04-22T08:00:00.000Z";

export type MockDb = {
  users: User[];
  products: Product[];
  productBomItems: ProductBOMItem[];
  packagings: Packaging[];
  packagingBomItems: PackagingBOMItem[];
  inventoryProducts: InventoryProduct[];
  inventoryPackagings: InventoryPackaging[];
  orders: Order[];
  orderItems: OrderItem[];
  orderMixItems: OrderMixItem[];
  orderItemComponents: OrderItemComponent[];
  transactions: InventoryTransaction[];
};

const initialMockDb: MockDb = {
  users: [
    {
      id: "u_admin",
      username: "admin",
      passwordHash: "mock-password-hash",
      role: "admin",
      isActive: true,
      createdAt: now
    }
  ],
  products: [
    {
      productId: "p_pineapple",
      productCode: "P-001",
      productName: "鳳梨酥",
      productType: "single",
      unit: "顆",
      price: 50,
      safeStock: 12,
      isCompositeProduct: false,
      isActive: true
    },
    {
      productId: "p_yolk",
      productCode: "P-002",
      productName: "蛋黃酥",
      productType: "single",
      unit: "顆",
      price: 55,
      safeStock: 12,
      isCompositeProduct: false,
      isActive: true
    },
    {
      productId: "p_taro",
      productCode: "P-003",
      productName: "芋頭酥",
      productType: "single",
      unit: "顆",
      price: 58,
      safeStock: 8,
      isCompositeProduct: false,
      isActive: true
    },
    {
      productId: "p_combo_a",
      productCode: "B-A12",
      productName: "綜合禮盒 A",
      productType: "bundle",
      unit: "盒",
      price: 690,
      safeStock: 0,
      isCompositeProduct: true,
      isActive: true,
      remark: "蛋黃酥 6 + 鳳梨酥 6"
    },
    {
      productId: "p_custom_12",
      productCode: "C-012",
      productName: "自選 12 入",
      productType: "custom_bundle_template",
      unit: "盒",
      price: 720,
      safeStock: 0,
      isCompositeProduct: true,
      isActive: true
    }
  ],
  productBomItems: [
    { id: "pbom_a_1", parentProductId: "p_combo_a", childProductId: "p_yolk", qty: 6, sortOrder: 1 },
    { id: "pbom_a_2", parentProductId: "p_combo_a", childProductId: "p_pineapple", qty: 6, sortOrder: 2 }
  ],
  packagings: [
    {
      packagingId: "pkg_cookie_bag",
      packagingCode: "PK-BAG",
      packagingName: "單顆包裝袋",
      packagingType: "single_packaging",
      unit: "個",
      currentStock: 60,
      reservedStock: 0,
      safeStock: 10,
      isComposite: false,
      isActive: true
    },
    {
      packagingId: "pkg_mid_12",
      packagingCode: "PK-M12",
      packagingName: "12 入禮盒",
      packagingType: "gift_box",
      unit: "盒",
      currentStock: 0,
      reservedStock: 0,
      safeStock: 0,
      isComposite: true,
      isActive: true
    },
    {
      packagingId: "pkg_lid",
      packagingCode: "PK-LID",
      packagingName: "盒蓋",
      packagingType: "accessory",
      unit: "個",
      currentStock: 30,
      reservedStock: 0,
      safeStock: 8,
      isComposite: false,
      isActive: true
    },
    {
      packagingId: "pkg_bottom",
      packagingCode: "PK-BOTTOM",
      packagingName: "盒底",
      packagingType: "accessory",
      unit: "個",
      currentStock: 30,
      reservedStock: 0,
      safeStock: 8,
      isComposite: false,
      isActive: true
    },
    {
      packagingId: "pkg_insert",
      packagingCode: "PK-INSERT",
      packagingName: "內襯",
      packagingType: "accessory",
      unit: "個",
      currentStock: 30,
      reservedStock: 0,
      safeStock: 8,
      isComposite: false,
      isActive: true
    },
    {
      packagingId: "pkg_paper_bag",
      packagingCode: "PK-PAPER",
      packagingName: "提袋",
      packagingType: "bag",
      unit: "個",
      currentStock: 0,
      reservedStock: 0,
      safeStock: 8,
      isComposite: false,
      isActive: true,
      remark: "故意設為 0，用於缺料案例"
    }
  ],
  packagingBomItems: [
    { id: "kbom_12_1", parentPackagingId: "pkg_mid_12", childPackagingId: "pkg_lid", qty: 1, sortOrder: 1 },
    { id: "kbom_12_2", parentPackagingId: "pkg_mid_12", childPackagingId: "pkg_bottom", qty: 1, sortOrder: 2 },
    { id: "kbom_12_3", parentPackagingId: "pkg_mid_12", childPackagingId: "pkg_insert", qty: 1, sortOrder: 3 },
    { id: "kbom_12_4", parentPackagingId: "pkg_mid_12", childPackagingId: "pkg_paper_bag", qty: 1, sortOrder: 4 }
  ],
  inventoryProducts: [
    { id: "invp_pineapple", productId: "p_pineapple", currentStock: 10, reservedStock: 0, availableStock: 10, updatedAt: now },
    { id: "invp_yolk", productId: "p_yolk", currentStock: 40, reservedStock: 0, availableStock: 40, updatedAt: now },
    { id: "invp_taro", productId: "p_taro", currentStock: 20, reservedStock: 0, availableStock: 20, updatedAt: now },
    { id: "invp_combo_a", productId: "p_combo_a", currentStock: 0, reservedStock: 0, availableStock: 0, updatedAt: now },
    { id: "invp_custom_12", productId: "p_custom_12", currentStock: 0, reservedStock: 0, availableStock: 0, updatedAt: now }
  ],
  inventoryPackagings: [
    { id: "invk_cookie_bag", packagingId: "pkg_cookie_bag", currentStock: 60, reservedStock: 0, availableStock: 60, updatedAt: now },
    { id: "invk_lid", packagingId: "pkg_lid", currentStock: 30, reservedStock: 0, availableStock: 30, updatedAt: now },
    { id: "invk_bottom", packagingId: "pkg_bottom", currentStock: 30, reservedStock: 0, availableStock: 30, updatedAt: now },
    { id: "invk_insert", packagingId: "pkg_insert", currentStock: 30, reservedStock: 0, availableStock: 30, updatedAt: now },
    { id: "invk_paper_bag", packagingId: "pkg_paper_bag", currentStock: 0, reservedStock: 0, availableStock: 0, updatedAt: now }
  ],
  orders: [
    {
      orderId: "o_multiday",
      orderNo: "ORD-20260422-001",
      customerName: "王小美",
      customerPhone: "0912-111-222",
      orderStatus: "confirmed",
      subtotalBeforeDiscount: 570,
      discountType: "percentage",
      discountRate: 0.95,
      discountAmount: 29,
      totalAmount: 541,
      paidAmount: 200,
      confirmedShortagePackagings: [],
      packagingCheckedAt: now,
      note: "案例 1~5 使用",
      createdAt: now,
      createdBy: "u_admin"
    },
    {
      orderId: "o_shortage",
      orderNo: "ORD-20260422-002",
      customerName: "陳先生",
      customerPhone: "0922-333-444",
      orderStatus: "draft",
      subtotalBeforeDiscount: 720,
      discountType: "none",
      discountRate: 1,
      discountAmount: 0,
      totalAmount: 720,
      paidAmount: 0,
      confirmedShortagePackagings: [],
      note: "確認時應只顯示 shortagePackagings",
      createdAt: now,
      createdBy: "u_admin"
    }
  ],
  orderItems: [
    {
      id: "oi_multiday_1",
      orderId: "o_multiday",
      productId: "p_yolk",
      productNameSnapshot: "蛋黃酥",
      qty: 4,
      unit: "顆",
      unitPriceSnapshot: 55,
      subtotal: 220,
      packagingId: "pkg_cookie_bag",
      packagingNameSnapshot: "單顆包裝袋",
      plannedFulfillDate: "2026-04-30",
      itemStatus: "fulfilled",
      fulfilledAt: "2026-04-23T03:00:00.000Z",
      remark: "第一批先交付"
    },
    {
      id: "oi_multiday_2",
      orderId: "o_multiday",
      productId: "p_pineapple",
      productNameSnapshot: "鳳梨酥",
      qty: 7,
      unit: "顆",
      unitPriceSnapshot: 50,
      subtotal: 350,
      packagingId: "pkg_cookie_bag",
      packagingNameSnapshot: "單顆包裝袋",
      plannedFulfillDate: "2026-05-02",
      itemStatus: "pending",
      remark: "第二批再交付"
    },
    {
      id: "oi_shortage_1",
      orderId: "o_shortage",
      productId: "p_custom_12",
      productNameSnapshot: "自選 12 入",
      qty: 1,
      unit: "盒",
      unitPriceSnapshot: 720,
      subtotal: 720,
      packagingId: "pkg_mid_12",
      packagingNameSnapshot: "12 入禮盒",
      plannedFulfillDate: "2026-04-30",
      itemStatus: "pending",
      remark: "需要禮盒與提袋"
    }
  ],
  orderMixItems: [
    { id: "mix_shortage_1", orderItemId: "oi_shortage_1", productId: "p_yolk", productNameSnapshot: "蛋黃酥", qty: 3, unit: "顆", sortOrder: 1 },
    { id: "mix_shortage_2", orderItemId: "oi_shortage_1", productId: "p_pineapple", productNameSnapshot: "鳳梨酥", qty: 5, unit: "顆", sortOrder: 2 },
    { id: "mix_shortage_3", orderItemId: "oi_shortage_1", productId: "p_taro", productNameSnapshot: "芋頭酥", qty: 4, unit: "顆", sortOrder: 3 }
  ],
  orderItemComponents: [
    {
      id: "oic_multiday_1",
      orderItemId: "oi_multiday_1",
      itemType: "packaging",
      itemId: "pkg_cookie_bag",
      itemNameSnapshot: "單顆包裝袋",
      qty: 4,
      sourceType: "single"
    },
    {
      id: "oic_multiday_2",
      orderItemId: "oi_multiday_2",
      itemType: "packaging",
      itemId: "pkg_cookie_bag",
      itemNameSnapshot: "單顆包裝袋",
      qty: 7,
      sourceType: "single"
    },
    {
      id: "oic_multiday_p1",
      orderItemId: "oi_multiday_1",
      itemType: "product",
      itemId: "p_yolk",
      itemNameSnapshot: "蛋黃酥",
      qty: 4,
      sourceType: "single"
    },
    {
      id: "oic_multiday_p2",
      orderItemId: "oi_multiday_2",
      itemType: "product",
      itemId: "p_pineapple",
      itemNameSnapshot: "鳳梨酥",
      qty: 7,
      sourceType: "single"
    }
  ],
  transactions: [
    {
      txnId: "txn_multiday_reserve_1",
      itemType: "packaging",
      itemId: "pkg_cookie_bag",
      txnType: "reserve",
      qty: 11,
      refType: "order",
      refId: "o_multiday",
      note: "Reserve for ORD-20260422-001",
      createdAt: now,
      createdBy: "u_admin"
    },
    {
      txnId: "txn_multiday_deduct_1",
      itemType: "packaging",
      itemId: "pkg_cookie_bag",
      txnType: "deduct",
      qty: 4,
      refType: "order",
      refId: "o_multiday",
      note: "Fulfill item oi_multiday_1",
      createdAt: "2026-04-23T03:00:00.000Z",
      createdBy: "u_admin"
    }
  ]
};

initialMockDb.inventoryPackagings = initialMockDb.inventoryPackagings.map((inventory) =>
  inventory.packagingId === "pkg_cookie_bag"
    ? {
        ...inventory,
        currentStock: 56,
        reservedStock: 7,
        availableStock: 49
      }
    : inventory
);

const globalForMockDb = globalThis as typeof globalThis & {
  __homeOrderMockDb?: MockDb;
};

export const mockDb: MockDb = globalForMockDb.__homeOrderMockDb ?? initialMockDb;
globalForMockDb.__homeOrderMockDb = mockDb;
