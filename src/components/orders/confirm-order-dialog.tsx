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
        <Button disabled={disabled}>{isPending ? "確認中..." : "Confirm"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>確認訂單並預留包材</DialogTitle>
          <DialogDescription>
            Confirm 後，訂單主狀態會變成 confirmed，並依全部明細建立快照與預留包材。
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={onConfirm}>確認</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
