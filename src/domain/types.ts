import type {
  COMPONENT_SOURCE_TYPES,
  ITEM_TYPES,
  ORDER_DISCOUNT_TYPES,
  ORDER_ITEM_STATUSES,
  ORDER_PROGRESS_STATUSES,
  ORDER_STATUSES,
  PACKAGING_TYPES,
  PRODUCT_TYPES,
  REF_TYPES,
  TXN_TYPES,
  USER_ROLES
} from "./constants";

export type UserRole = (typeof USER_ROLES)[number];
export type ProductType = (typeof PRODUCT_TYPES)[number];
export type PackagingType = (typeof PACKAGING_TYPES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderItemStatus = (typeof ORDER_ITEM_STATUSES)[number];
export type OrderProgress = (typeof ORDER_PROGRESS_STATUSES)[number];
export type OrderDiscountType = (typeof ORDER_DISCOUNT_TYPES)[number];
export type ItemType = (typeof ITEM_TYPES)[number];
export type ComponentSourceType = (typeof COMPONENT_SOURCE_TYPES)[number];
export type InventoryTxnType = (typeof TXN_TYPES)[number];
export type RefType = (typeof REF_TYPES)[number];

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type Product = {
  productId: string;
  productCode: string;
  productName: string;
  productType: ProductType;
  unit: string;
  price: number;
  safeStock: number;
  isCompositeProduct: boolean;
  isActive: boolean;
  remark?: string;
};

export type ProductBOMItem = {
  id: string;
  parentProductId: string;
  childProductId: string;
  qty: number;
  sortOrder: number;
};

export type Packaging = {
  packagingId: string;
  packagingCode: string;
  packagingName: string;
  packagingType: PackagingType;
  unit: string;
  currentStock: number;
  reservedStock: number;
  safeStock: number;
  isComposite: boolean;
  isActive: boolean;
  remark?: string;
};

export type PackagingBOMItem = {
  id: string;
  parentPackagingId: string;
  childPackagingId: string;
  qty: number;
  sortOrder: number;
};

export type InventoryProduct = {
  id: string;
  productId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  updatedAt: string;
};

export type InventoryPackaging = {
  id: string;
  packagingId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  updatedAt: string;
};

export type Order = {
  orderId: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  orderStatus: OrderStatus;
  subtotalBeforeDiscount: number;
  discountType: OrderDiscountType;
  discountRate: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  confirmedShortagePackagings?: ShortageRequirement[];
  packagingCheckedAt?: string;
  note?: string;
  createdAt: string;
  createdBy: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productNameSnapshot: string;
  qty: number;
  unit: string;
  unitPriceSnapshot: number;
  subtotal: number;
  packagingId?: string;
  packagingNameSnapshot?: string;
  plannedFulfillDate: string;
  itemStatus: OrderItemStatus;
  fulfilledAt?: string;
  remark?: string;
};

export type OrderMixItem = {
  id: string;
  orderItemId: string;
  productId: string;
  productNameSnapshot: string;
  qty: number;
  unit: string;
  sortOrder: number;
};

export type OrderItemComponent = {
  id: string;
  orderItemId: string;
  itemType: ItemType;
  itemId: string;
  itemNameSnapshot: string;
  qty: number;
  sourceType: ComponentSourceType;
};

export type InventoryTransaction = {
  txnId: string;
  itemType: ItemType;
  itemId: string;
  txnType: InventoryTxnType;
  qty: number;
  refType: RefType;
  refId: string;
  note?: string;
  createdAt: string;
  createdBy: string;
};

export type ExpandedRequirement = {
  itemId: string;
  itemName: string;
  qty: number;
  availableStock: number;
  safeStock: number;
};

export type ShortageRequirement = ExpandedRequirement & {
  shortageQty: number;
};

export type ConfirmOrderResult = {
  success: boolean;
  message: string;
  orderId: string;
  expandedProducts: ExpandedRequirement[];
  expandedPackagings: ExpandedRequirement[];
  shortagePackagings: ShortageRequirement[];
  snapshots: OrderItemComponent[];
};

export type UpdateOrderItemResult = ConfirmOrderResult & {
  item?: OrderItem;
  order?: Order;
};

export type OrderActionResult = {
  success: boolean;
  message: string;
  orderId: string;
  snapshots: OrderItemComponent[];
};

export type OrderDetail = {
  order: Order;
  items: OrderItem[];
  mixItems: { orderItemId: string; items: OrderMixItem[] }[];
  components: OrderItemComponent[];
  orderProgress: OrderProgress;
  hasFulfilledItems: boolean;
};

export type OrderListItem = {
  order: Order;
  orderProgress: OrderProgress;
  itemCount: number;
  pendingItemCount: number;
  fulfilledItemCount: number;
  nextPlannedFulfillDate?: string;
};

export type ScheduleItem = {
  orderId: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  orderStatus: OrderStatus;
  orderProgress: OrderProgress;
  item: OrderItem;
};
