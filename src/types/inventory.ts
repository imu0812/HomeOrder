export type InventoryProduct = {
  id: string;
  productId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  updatedAt: string;
};

export type InventoryPackaging = {
  id: string;
  packagingId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  updatedAt: string;
};
