"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product, ProductBOMItem } from "@/domain/types";

type EditableBomItem = {
  id: string;
  childProductId: string;
  qty: string;
  sortOrder: string;
};

function toEditableBomItem(item: ProductBOMItem): EditableBomItem {
  return {
    id: item.id,
    childProductId: item.childProductId,
    qty: String(item.qty),
    sortOrder: String(item.sortOrder)
  };
}

async function saveBom(productId: string, items: EditableBomItem[]) {
  const response = await fetch(`/api/products/${productId}/bom`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: items
        .filter((item) => item.childProductId && Number(item.qty) > 0)
        .map((item, index) => ({
          childProductId: item.childProductId,
          qty: Number(item.qty),
          sortOrder: Number(item.sortOrder) || index + 1
        }))
    })
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "儲存 BOM 失敗");
  return json.data;
}

export function ProductBomClient({
  product,
  products,
  bomItems
}: {
  product: Product;
  products: Product[];
  bomItems: ProductBOMItem[];
}) {
  const queryClient = useQueryClient();
  const childOptions = products.filter((item) => item.productId !== product.productId);
  const [items, setItems] = useState<EditableBomItem[]>(bomItems.map(toEditableBomItem));

  const mutation = useMutation({
    mutationFn: () => saveBom(product.productId, items),
    onSuccess: () => {
      toast.success("BOM 已儲存");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => toast.error(error.message)
  });

  function patchItem(id: string, patch: Partial<EditableBomItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: `draft-${Date.now()}`,
        childProductId: childOptions[0]?.productId ?? "",
        qty: "1",
        sortOrder: String(current.length + 1)
      }
    ]);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{product.productName} BOM</CardTitle>
          <CardDescription>固定組合與配方型商品會在訂單確認時依 BOM 展開需求。</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" />
          新增項目
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">排序</TableHead>
              <TableHead>子商品</TableHead>
              <TableHead className="w-32">數量</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={item.sortOrder}
                    onChange={(event) => patchItem(item.id, { sortOrder: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={item.childProductId}
                    onChange={(event) => patchItem(item.id, { childProductId: event.target.value })}
                  >
                    {childOptions.map((option) => (
                      <option key={option.productId} value={option.productId}>
                        {option.productName}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.qty}
                    onChange={(event) => patchItem(item.id, { qty: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))}
                    title="移除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>尚未設定 BOM。</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <div className="flex flex-wrap gap-2">
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            儲存 BOM
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">返回商品</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
