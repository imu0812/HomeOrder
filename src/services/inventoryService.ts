import type { ExpandedRequirement, ShortageRequirement } from "@/domain/types";

export function calcAvailableStock(currentStock: number, reservedStock: number) {
  return currentStock - reservedStock;
}

export function findShortages(requirements: ExpandedRequirement[]): ShortageRequirement[] {
  return requirements
    .filter((item) => item.qty > item.availableStock)
    .map((item) => ({
      ...item,
      shortageQty: item.qty - item.availableStock
    }));
}
