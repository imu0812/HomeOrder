"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ShortageRequirement } from "@/domain/types";

export function ShortageAlert({ shortagePackagings }: { shortagePackagings: ShortageRequirement[] }) {
  if (shortagePackagings.length === 0) {
    return (
      <Alert>
        <AlertTitle>包材足量</AlertTitle>
        <AlertDescription>這張訂單目前沒有包材缺料，confirm 後可以正常預留。</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-destructive/40">
      <AlertTitle>包材缺料提醒</AlertTitle>
      <AlertDescription>
        <div className="grid gap-2">
          <p>系統只顯示 shortagePackagings，不會把商品展開結果當成缺料警示。</p>
          <ul className="grid gap-1">
            {shortagePackagings.map((item) => (
              <li key={item.itemId} className="text-destructive">
                {item.itemName} 缺 {item.shortageQty}
              </li>
            ))}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}
