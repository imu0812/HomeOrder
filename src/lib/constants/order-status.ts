export const ORDER_STATUSES = ["draft", "confirmed", "shipped", "cancelled"] as const;
export const ORDER_MODES = ["normal", "fixed_bundle", "custom_mix"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderMode = (typeof ORDER_MODES)[number];
