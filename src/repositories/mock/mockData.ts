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

export const mockDb: MockDb = {
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
      productId: "p_phoenix",
      productCode: "P-002",
      productName: "鳳凰酥",
      productType: "single",
      unit: "顆",
      price: 55,
      safeStock: 12,
      isCompositeProduct: false,
      isActive: true
    },
    {
      productId: "p_yolk",
      productCode: "P-003",
      productName: "蛋黃酥",
      productType: "single",
      unit: "顆",
      price: 65,
      safeStock: 12,
      isCompositeProduct: false,
      isActive: true
    },
    {
      productId: "p_taro",
      productCode: "P-004",
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
      productName: "綜合A",
      productType: "bundle",
      unit: "盒",
      price: 690,
      safeStock: 0,
      isCompositeProduct: true,
      isActive: true,
      remark: "蛋黃酥6 + 鳳梨酥6"
    },
    {
      productId: "p_combo_b",
      productCode: "B-B12",
      productName: "綜合B",
      productType: "bundle",
      unit: "盒",
      price: 710,
      safeStock: 0,
      isCompositeProduct: true,
      isActive: true,
      remark: "蛋黃酥4 + 鳳梨酥4 + 芋頭酥4"
    },
    {
      productId: "p_custom_12",
      productCode: "C-012",
      productName: "客製12入盒",
      productType: "custom_bundle_template",
      unit: "盒",
      price: 720,
      safeStock: 0,
      isCompositeProduct: true,
      isActive: true,
      remark: "由訂單內 OrderMixItems 決定內容"
    }
  ],
  productBomItems: [
    { id: "pbom_a_1", parentProductId: "p_combo_a", childProductId: "p_yolk", qty: 6, sortOrder: 1 },
    { id: "pbom_a_2", parentProductId: "p_combo_a", childProductId: "p_pineapple", qty: 6, sortOrder: 2 },
    { id: "pbom_b_1", parentProductId: "p_combo_b", childProductId: "p_yolk", qty: 4, sortOrder: 1 },
    { id: "pbom_b_2", parentProductId: "p_combo_b", childProductId: "p_pineapple", qty: 4, sortOrder: 2 },
    { id: "pbom_b_3", parentProductId: "p_combo_b", childProductId: "p_taro", qty: 4, sortOrder: 3 }
  ],
  packagings: [
    {
      packagingId: "pkg_pineapple_bag",
      packagingCode: "PK-PINE",
      packagingName: "鳳梨酥包裝袋",
      packagingType: "single_packaging",
      unit: "個",
      currentStock: 40,
      reservedStock: 0,
      safeStock: 10,
      isComposite: false,
      isActive: true
    },
    {
      packagingId: "pkg_yolk_bag",
      packagingCode: "PK-YOLK",
      packagingName: "蛋黃酥包裝袋",
      packagingType: "single_packaging",
      unit: "個",
      currentStock: 50,
      reservedStock: 0,
      safeStock: 10,
      isComposite: false,
      isActive: true
    },
    {
      packagingId: "pkg_mid_6",
      packagingCode: "PK-M6",
      packagingName: "中秋6入禮盒",
      packagingType: "gift_box",
      unit: "組",
      currentStock: 0,
      reservedStock: 0,
      safeStock: 0,
      isComposite: true,
      isActive: true
    },
    {
      packagingId: "pkg_mid_12",
      packagingCode: "PK-M12",
      packagingName: "中秋12入禮盒",
      packagingType: "gift_box",
      unit: "組",
      currentStock: 0,
      reservedStock: 0,
      safeStock: 0,
      isComposite: true,
      isActive: true
    },
    {
      packagingId: "pkg_lid",
      packagingCode: "PK-LID",
      packagingName: "紙蓋",
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
      packagingName: "底盒",
      packagingType: "accessory",
      unit: "個",
      currentStock: 30,
      reservedStock: 0,
      safeStock: 8,
      isComposite: false,
      isActive: true
    },
    {
      packagingId: "pkg_insert_lid",
      packagingCode: "PK-ILID",
      packagingName: "內襯蓋",
      packagingType: "accessory",
      unit: "個",
      currentStock: 30,
      reservedStock: 0,
      safeStock: 8,
      isComposite: false,
      isActive: true
    },
    {
      packagingId: "pkg_insert_bottom",
      packagingCode: "PK-IBOT",
      packagingName: "內襯底",
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
      packagingCode: "PK-BAG",
      packagingName: "紙袋",
      packagingType: "bag",
      unit: "個",
      currentStock: 0,
      reservedStock: 0,
      safeStock: 8,
      isComposite: false,
      isActive: true,
      remark: "刻意設為 0，用來測試客製混搭包材缺料"
    }
  ],
  packagingBomItems: [
    { id: "kbom_6_1", parentPackagingId: "pkg_mid_6", childPackagingId: "pkg_lid", qty: 1, sortOrder: 1 },
    { id: "kbom_6_2", parentPackagingId: "pkg_mid_6", childPackagingId: "pkg_bottom", qty: 1, sortOrder: 2 },
    { id: "kbom_6_3", parentPackagingId: "pkg_mid_6", childPackagingId: "pkg_insert_lid", qty: 1, sortOrder: 3 },
    { id: "kbom_6_4", parentPackagingId: "pkg_mid_6", childPackagingId: "pkg_insert_bottom", qty: 1, sortOrder: 4 },
    { id: "kbom_6_5", parentPackagingId: "pkg_mid_6", childPackagingId: "pkg_paper_bag", qty: 1, sortOrder: 5 },
    { id: "kbom_12_1", parentPackagingId: "pkg_mid_12", childPackagingId: "pkg_lid", qty: 1, sortOrder: 1 },
    { id: "kbom_12_2", parentPackagingId: "pkg_mid_12", childPackagingId: "pkg_bottom", qty: 1, sortOrder: 2 },
    { id: "kbom_12_3", parentPackagingId: "pkg_mid_12", childPackagingId: "pkg_insert_lid", qty: 1, sortOrder: 3 },
    { id: "kbom_12_4", parentPackagingId: "pkg_mid_12", childPackagingId: "pkg_insert_bottom", qty: 1, sortOrder: 4 },
    { id: "kbom_12_5", parentPackagingId: "pkg_mid_12", childPackagingId: "pkg_paper_bag", qty: 1, sortOrder: 5 }
  ],
  inventoryProducts: [
    { id: "invp_pineapple", productId: "p_pineapple", currentStock: 10, reservedStock: 0, availableStock: 10, updatedAt: now },
    { id: "invp_phoenix", productId: "p_phoenix", currentStock: 25, reservedStock: 0, availableStock: 25, updatedAt: now },
    { id: "invp_yolk", productId: "p_yolk", currentStock: 40, reservedStock: 0, availableStock: 40, updatedAt: now },
    { id: "invp_taro", productId: "p_taro", currentStock: 20, reservedStock: 0, availableStock: 20, updatedAt: now }
  ],
  inventoryPackagings: [
    { id: "invk_pineapple_bag", packagingId: "pkg_pineapple_bag", currentStock: 40, reservedStock: 0, availableStock: 40, updatedAt: now },
    { id: "invk_yolk_bag", packagingId: "pkg_yolk_bag", currentStock: 50, reservedStock: 0, availableStock: 50, updatedAt: now },
    { id: "invk_lid", packagingId: "pkg_lid", currentStock: 30, reservedStock: 0, availableStock: 30, updatedAt: now },
    { id: "invk_bottom", packagingId: "pkg_bottom", currentStock: 30, reservedStock: 0, availableStock: 30, updatedAt: now },
    { id: "invk_insert_lid", packagingId: "pkg_insert_lid", currentStock: 30, reservedStock: 0, availableStock: 30, updatedAt: now },
    { id: "invk_insert_bottom", packagingId: "pkg_insert_bottom", currentStock: 30, reservedStock: 0, availableStock: 30, updatedAt: now },
    { id: "invk_paper_bag", packagingId: "pkg_paper_bag", currentStock: 0, reservedStock: 0, availableStock: 0, updatedAt: now }
  ],
  orders: [
    {
      orderId: "o_single",
      orderNo: "ORD-20260422-001",
      customerName: "案例1 單品正常",
      customerPhone: "0912-111-222",
      pickupDate: "2026-04-25",
      orderStatus: "draft",
      paymentStatus: "unpaid",
      totalAmount: 500,
      orderMode: "normal",
      note: "鳳梨酥 x 10，鳳梨酥包裝袋 x 10，預期無缺料。",
      createdAt: now,
      createdBy: "u_admin"
    },
    {
      orderId: "o_bundle",
      orderNo: "ORD-20260422-002",
      customerName: "案例2 固定組合缺商品",
      customerPhone: "0922-333-444",
      pickupDate: "2026-04-26",
      orderStatus: "draft",
      paymentStatus: "unpaid",
      totalAmount: 1380,
      orderMode: "fixed_bundle",
      note: "綜合A x 2，商品會展開為製作參考；缺料判斷只看包材。",
      createdAt: now,
      createdBy: "u_admin"
    },
    {
      orderId: "o_custom",
      orderNo: "ORD-20260422-003",
      customerName: "案例3 客製混搭缺包材",
      customerPhone: "0933-555-666",
      pickupDate: "2026-04-27",
      orderStatus: "draft",
      paymentStatus: "unpaid",
      totalAmount: 720,
      orderMode: "custom_mix",
      note: "客製12入盒，紙袋庫存0，預期包材缺料。",
      createdAt: now,
      createdBy: "u_admin"
    }
  ],
  orderItems: [
    {
      id: "oi_single_1",
      orderId: "o_single",
      productId: "p_pineapple",
      productNameSnapshot: "鳳梨酥",
      qty: 10,
      unitPrice: 50,
      subtotal: 500,
      packagingId: "pkg_pineapple_bag",
      packagingNameSnapshot: "鳳梨酥包裝袋"
    },
    {
      id: "oi_bundle_1",
      orderId: "o_bundle",
      productId: "p_combo_a",
      productNameSnapshot: "綜合A",
      qty: 2,
      unitPrice: 690,
      subtotal: 1380,
      packagingId: "pkg_mid_12",
      packagingNameSnapshot: "中秋12入禮盒"
    },
    {
      id: "oi_custom_1",
      orderId: "o_custom",
      productId: "p_custom_12",
      productNameSnapshot: "客製12入盒",
      qty: 1,
      unitPrice: 720,
      subtotal: 720,
      packagingId: "pkg_mid_12",
      packagingNameSnapshot: "中秋12入禮盒"
    }
  ],
  orderMixItems: [
    { id: "mix_1", orderItemId: "oi_custom_1", productId: "p_yolk", productNameSnapshot: "蛋黃酥", qty: 3, unit: "顆", sortOrder: 1 },
    { id: "mix_2", orderItemId: "oi_custom_1", productId: "p_pineapple", productNameSnapshot: "鳳梨酥", qty: 5, unit: "顆", sortOrder: 2 },
    { id: "mix_3", orderItemId: "oi_custom_1", productId: "p_taro", productNameSnapshot: "芋頭酥", qty: 4, unit: "顆", sortOrder: 3 }
  ],
  orderItemComponents: [],
  transactions: []
};
