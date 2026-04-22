export const ITEM_TYPES = ["product", "packaging"] as const;
export const COMPONENT_SOURCE_TYPES = ["single", "product_bom", "packaging_bom", "custom_mix"] as const;
export const TXN_TYPES = ["in", "reserve", "release", "deduct", "adjust"] as const;
export const REF_TYPES = ["order", "manual", "init"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];
export type ComponentSourceType = (typeof COMPONENT_SOURCE_TYPES)[number];
export type InventoryTxnType = (typeof TXN_TYPES)[number];
export type RefType = (typeof REF_TYPES)[number];
