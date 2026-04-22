"use client";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmOrderDialog({
  disabled,
  isPending,
  onConfirm
}: {
  disabled?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={disabled}>{isPending ? "預留中..." : "Confirm"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>確認預留此訂單？</DialogTitle>
          <DialogDescription>系統會展開商品與包裝需求，寫入快照並增加 reservedStock。</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
          <DialogClose asChild><Button onClick={onConfirm}>確認預留</Button></DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
