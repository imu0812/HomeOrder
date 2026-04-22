import type { ExpandedRequirement } from "@/domain/types";
import { findShortages } from "./inventoryService";

export function buildPackagingShortageSummary(packagings: ExpandedRequirement[]) {
  const packagingShortages = findShortages(packagings);

  if (packagingShortages.length === 0) {
    return "包材庫存足夠，已完成訂單預留。";
  }

  return `已完成訂單預留，但有 ${packagingShortages.length} 項包材不足，請安排補包材。`;
}
