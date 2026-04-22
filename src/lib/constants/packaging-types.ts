export const PACKAGING_TYPES = ["single_packaging", "gift_box", "bag", "accessory"] as const;
export type PackagingType = (typeof PACKAGING_TYPES)[number];
