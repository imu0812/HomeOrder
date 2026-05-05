import { z } from "zod";
import {
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

export const userSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  passwordHash: z.string().min(1),
  role: z.enum(USER_ROLES),
  isActive: z.boolean(),
  createdAt: z.string().min(1)
});

export const productSchema = z.object({
  productId: z.string().min(1),
  productCode: z.string().min(1),
  productName: z.string().min(1),
  productType: z.enum(PRODUCT_TYPES),
  unit: z.string().min(1),
  price: z.number().nonnegative(),
  safeStock: z.number().nonnegative(),
  isCompositeProduct: z.boolean(),
  isActive: z.boolean(),
  remark: z.string().optional()
});

export const productBOMItemSchema = z.object({
  id: z.string().min(1),
  parentProductId: z.string().min(1),
  childProductId: z.string().min(1),
  qty: z.number().positive(),
  sortOrder: z.number().int().nonnegative()
});

export const packagingSchema = z.object({
  packagingId: z.string().min(1),
  packagingCode: z.string().min(1),
  packagingName: z.string().min(1),
  packagingType: z.enum(PACKAGING_TYPES),
  unit: z.string().min(1),
  currentStock: z.number().nonnegative(),
  reservedStock: z.number().nonnegative(),
  safeStock: z.number().nonnegative(),
  isComposite: z.boolean(),
  isActive: z.boolean(),
  remark: z.string().optional()
});

export const packagingBOMItemSchema = z.object({
  id: z.string().min(1),
  parentPackagingId: z.string().min(1),
  childPackagingId: z.string().min(1),
  qty: z.number().positive(),
  sortOrder: z.number().int().nonnegative()
});

export const inventoryProductSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  currentStock: z.number().nonnegative(),
  reservedStock: z.number().nonnegative(),
  availableStock: z.number(),
  updatedAt: z.string().min(1)
});

export const inventoryPackagingSchema = z.object({
  id: z.string().min(1),
  packagingId: z.string().min(1),
  currentStock: z.number().nonnegative(),
  reservedStock: z.number().nonnegative(),
  availableStock: z.number(),
  updatedAt: z.string().min(1)
});

export const orderSchema = z.object({
  orderId: z.string().min(1),
  orderNo: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  orderStatus: z.enum(ORDER_STATUSES),
  subtotalBeforeDiscount: z.number().nonnegative(),
  discountType: z.enum(ORDER_DISCOUNT_TYPES),
  discountRate: z.number().nonnegative(),
  discountAmount: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),
  paidAmount: z.number().nonnegative().default(0),
  confirmedShortagePackagings: z
    .array(
      z.object({
        itemId: z.string().min(1),
        itemName: z.string().min(1),
        qty: z.number().nonnegative(),
        availableStock: z.number(),
        safeStock: z.number().nonnegative(),
        shortageQty: z.number().nonnegative()
      })
    )
    .optional(),
  packagingCheckedAt: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.string().min(1),
  createdBy: z.string().min(1)
});

export const orderItemSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  productId: z.string().min(1),
  productNameSnapshot: z.string().min(1),
  qty: z.number().positive(),
  unit: z.string().min(1),
  unitPriceSnapshot: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  packagingId: z.string().optional(),
  packagingNameSnapshot: z.string().optional(),
  plannedFulfillDate: z.string().min(1),
  itemStatus: z.enum(ORDER_ITEM_STATUSES),
  fulfilledAt: z.string().optional(),
  remark: z.string().optional()
});

export const orderMixItemSchema = z.object({
  id: z.string().min(1),
  orderItemId: z.string().min(1),
  productId: z.string().min(1),
  productNameSnapshot: z.string().min(1),
  qty: z.number().positive(),
  unit: z.string().min(1),
  sortOrder: z.number().int().nonnegative()
});

export const orderItemComponentSchema = z.object({
  id: z.string().min(1),
  orderItemId: z.string().min(1),
  itemType: z.enum(ITEM_TYPES),
  itemId: z.string().min(1),
  itemNameSnapshot: z.string().min(1),
  qty: z.number().positive(),
  sourceType: z.enum(COMPONENT_SOURCE_TYPES)
});

export const inventoryTransactionSchema = z.object({
  txnId: z.string().min(1),
  itemType: z.enum(ITEM_TYPES),
  itemId: z.string().min(1),
  txnType: z.enum(TXN_TYPES),
  qty: z.number().positive(),
  refType: z.enum(REF_TYPES),
  refId: z.string().min(1),
  note: z.string().optional(),
  createdAt: z.string().min(1),
  createdBy: z.string().min(1)
});

export const createOrderItemInputSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().positive(),
  packagingId: z.string().optional(),
  plannedFulfillDate: z.string().min(1, "請選擇出貨日期"),
  remark: z.string().optional(),
  mixItems: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().positive()
      })
    )
    .optional()
});

export const createOrderRequestSchema = z.object({
  template: z.enum(["single", "bundle", "custom_mix"]).optional(),
  customerName: z.string().min(1, "請輸入客戶姓名"),
  customerPhone: z.string().min(1, "請輸入客戶電話"),
  note: z.string().optional(),
  discountType: z.enum(ORDER_DISCOUNT_TYPES).default("none"),
  discountRate: z.number().nonnegative().default(1),
  paidAmount: z.number().nonnegative().default(0),
  items: z.array(createOrderItemInputSchema).min(1)
});

export const updateOrderInputSchema = z.object({
  discountType: z.enum(ORDER_DISCOUNT_TYPES).optional(),
  discountRate: z.number().nonnegative().optional(),
  paidAmount: z.number().nonnegative().optional(),
  note: z.string().optional().nullable()
});

export const updateOrderItemInputSchema = z.object({
  qty: z.number().positive().optional(),
  packagingId: z.string().optional().nullable(),
  plannedFulfillDate: z.string().min(1).optional(),
  remark: z.string().optional().nullable(),
  mixItems: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().positive()
      })
    )
    .optional(),
  cancel: z.boolean().optional()
});

export const orderProgressSchema = z.enum(ORDER_PROGRESS_STATUSES);
