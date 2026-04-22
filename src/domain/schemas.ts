import { z } from "zod";
import {
  COMPONENT_SOURCE_TYPES,
  ITEM_TYPES,
  ORDER_MODES,
  ORDER_STATUSES,
  PACKAGING_TYPES,
  PAYMENT_STATUSES,
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
  pickupDate: z.string().min(1),
  orderStatus: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  totalAmount: z.number().nonnegative(),
  orderMode: z.enum(ORDER_MODES),
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
  unitPrice: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  packagingId: z.string().optional(),
  packagingNameSnapshot: z.string().optional(),
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
  customerPhone: z.string().min(1, "請輸入聯絡電話"),
  pickupDate: z.string().min(1, "請選擇取貨日"),
  note: z.string().optional(),
  items: z.array(createOrderItemInputSchema).min(1).optional()
});
