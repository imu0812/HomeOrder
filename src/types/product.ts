import type { ProductType } from "@/lib/constants/product-types";

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
