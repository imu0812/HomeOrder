import type { PackagingType } from "@/lib/constants/packaging-types";

export type Packaging = {
  packagingId: string;
  packagingCode: string;
  packagingName: string;
  packagingType: PackagingType;
  unit: string;
  currentStock: number;
  reservedStock: number;
  safeStock: number;
  isComposite: boolean;
  isActive: boolean;
  remark?: string;
};
