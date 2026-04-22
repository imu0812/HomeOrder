import type { Order, OrderItem, OrderItemComponent, OrderMixItem } from "./order";

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
};
