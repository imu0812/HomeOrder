import type { InventoryTxnType, ItemType, RefType } from "@/lib/constants/inventory-transaction-types";

export type InventoryTransaction = {
  txnId: string;
  itemType: ItemType;
  itemId: string;
  txnType: InventoryTxnType;
  qty: number;
  refType: RefType;
  refId: string;
  note?: string;
  createdAt: string;
  createdBy: string;
};
