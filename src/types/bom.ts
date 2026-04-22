export type ProductBOMItem = {
  id: string;
  parentProductId: string;
  childProductId: string;
  qty: number;
  sortOrder: number;
};

export type PackagingBOMItem = {
  id: string;
  parentPackagingId: string;
  childPackagingId: string;
  qty: number;
  sortOrder: number;
};
