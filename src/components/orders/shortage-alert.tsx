"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDateTime } from "@/lib/utils";
import type { ShortageRequirement } from "@/domain/types";

export function ShortageAlert({
  shortagePackagings,
  checkedAt,
  title = "包材提醒"
}: {
  shortagePackagings: ShortageRequirement[];
  checkedAt?: string;
  title?: string;
}) {
  const checkedText = checkedAt ? `檢查時間：${formatDateTime(checkedAt)}` : undefined;

  if (shortagePackagings.length === 0) {
    return (
      <Alert>
        <AlertTitle>{title}：包材足夠</AlertTitle>
        <AlertDescription>{checkedText ?? "目前尚未發現包材不足。"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-destructive/40">
      <AlertTitle>{title}：包材不足</AlertTitle>
      <AlertDescription>
        <div className="grid gap-2">
          {checkedText ? <p>{checkedText}</p> : null}
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
