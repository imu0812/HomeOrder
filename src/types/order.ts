import type { ComponentSourceType, ItemType } from "@/lib/constants/inventory-transaction-types";
import type { OrderMode, OrderStatus } from "@/lib/constants/order-status";
import type { PaymentStatus } from "@/lib/constants/payment-status";

export type Order = {
  orderId: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  pickupDate: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  orderMode: OrderMode;
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
  unitPrice: number;
  subtotal: number;
  packagingId?: string;
  packagingNameSnapshot?: string;
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
