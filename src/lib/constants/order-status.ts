export const ORDER_STATUSES = ["draft", "confirmed", "cancelled"] as const;
export const ORDER_ITEM_STATUSES = ["pending", "fulfilled", "cancelled"] as const;
export const ORDER_PROGRESS_STATUSES = ["not_started", "partial", "completed"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderItemStatus = (typeof ORDER_ITEM_STATUSES)[number];
export type OrderProgress = (typeof ORDER_PROGRESS_STATUSES)[number];
