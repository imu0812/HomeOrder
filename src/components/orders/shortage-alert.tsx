"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ShortageRequirement } from "@/domain/types";

export function ShortageAlert({ shortagePackagings }: { shortagePackagings: ShortageRequirement[] }) {
  if (shortagePackagings.length === 0) {
    return (
      <Alert>
        <AlertTitle>包材足夠</AlertTitle>
        <AlertDescription>商品已展開為製作參考；缺料判斷只檢查包材，目前沒有包材缺料。</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-destructive/40">
      <AlertTitle>包材缺料提醒</AlertTitle>
      <AlertDescription>有 {shortagePackagings.length} 項包材不足。訂單仍已成立，請依缺料清單安排補包材。</AlertDescription>
    </Alert>
  );
}
