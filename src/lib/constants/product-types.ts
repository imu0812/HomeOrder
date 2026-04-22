export const PRODUCT_TYPES = ["single", "bundle", "custom_bundle_template"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];
