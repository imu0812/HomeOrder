"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Packaging, Product } from "@/domain/types";

type DraftMixItem = {
  productId: string;
  qty: number;
};

type DraftOrderItem = {
  productId: string;
  qty: number;
  packagingId?: string;
  mixItems: DraftMixItem[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return response.json();
}

async function createOrder(payload: {
  customerName: string;
  customerPhone: string;
  pickupDate: string;
  note?: string;
  items: DraftOrderItem[];
}) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const json = await response.json().catch(() => null);
    throw new Error(json?.message ?? "建立訂單失敗");
  }
  return response.json() as Promise<{ orderId: string }>;
}

export function NewOrderClient() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [packagings, setPackagings] = useState<Packaging[]>([]);
  const [items, setItems] = useState<DraftOrderItem[]>([
    { productId: "p_combo_a", qty: 2, packagingId: "pkg_mid_12", mixItems: [] }
  ]);

  useEffect(() => {
    Promise.all([fetchJson<Product[]>("/api/products"), fetchJson<Packaging[]>("/api/packagings")])
      .then(([productRows, packagingRows]) => {
        setProducts(productRows);
        setPackagings(packagingRows);
      })
      .catch((error) => toast.error(error.message));
  }, []);

  const singleProducts = useMemo(() => products.filter((product) => product.productType === "single"), [products]);

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      toast.success("訂單已建立");
      router.push(`/orders/${order.orderId}`);
    },
    onError: (error) => toast.error(error.message)
  });

  function updateItem(index: number, patch: Partial<DraftOrderItem>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function updateMixItem(itemIndex: number, mixIndex: number, patch: Partial<DraftMixItem>) {
    setItems((current) =>
      current.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              mixItems: item.mixItems.map((mixItem, currentMixIndex) =>
                currentMixIndex === mixIndex ? { ...mixItem, ...patch } : mixItem
              )
            }
          : item
      )
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>新增訂單</CardTitle>
        <CardDescription>可新增多筆商品明細；選擇客製12入盒時，可直接填混搭內容。</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const validItems = items.filter((item) => item.productId && item.qty > 0);
            if (validItems.length === 0) {
              toast.error("請至少新增一筆訂單明細");
              return;
            }
            mutation.mutate({
              customerName: String(formData.get("customerName") ?? ""),
              customerPhone: String(formData.get("customerPhone") ?? ""),
              pickupDate: String(formData.get("pickupDate") ?? ""),
              note: String(formData.get("note") ?? ""),
              items: validItems
            });
          }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="customerName">客戶姓名</Label>
              <Input id="customerName" name="customerName" required defaultValue="測試客戶" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerPhone">聯絡電話</Label>
              <Input id="customerPhone" name="customerPhone" required defaultValue="0912-345-678" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pickupDate">取貨日</Label>
              <Input id="pickupDate" name="pickupDate" type="date" required defaultValue="2026-04-30" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">備註</Label>
            <Input id="note" name="note" placeholder="可留空" />
          </div>

          <div className="grid gap-4">
            {items.map((item, index) => {
              const product = products.find((entry) => entry.productId === item.productId);
              const isCustom = product?.productType === "custom_bundle_template";
              return (
                <div key={index} className="grid gap-4 rounded-lg border bg-card p-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_120px_1fr_auto]">
                    <div className="grid gap-2">
                      <Label>商品</Label>
                      <select
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                        value={item.productId}
                        onChange={(event) => {
                          const nextProduct = products.find((entry) => entry.productId === event.target.value);
                          updateItem(index, {
                            productId: event.target.value,
                            mixItems:
                              nextProduct?.productType === "custom_bundle_template"
                                ? [
                                    { productId: "p_yolk", qty: 3 },
                                    { productId: "p_pineapple", qty: 5 },
                                    { productId: "p_taro", qty: 4 }
                                  ]
                                : []
                          });
                        }}
                      >
                        {products.map((productOption) => (
                          <option key={productOption.productId} value={productOption.productId}>
                            {productOption.productName} / {productOption.productType}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label>數量</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(event) => updateItem(index, { qty: Number(event.target.value) })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>包裝</Label>
                      <select
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                        value={item.packagingId ?? ""}
                        onChange={(event) => updateItem(index, { packagingId: event.target.value || undefined })}
                      >
                        <option value="">不指定</option>
                        {packagings.map((packaging) => (
                          <option key={packaging.packagingId} value={packaging.packagingId}>
                            {packaging.packagingName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="self-end"
                      onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {isCustom && (
                    <div className="grid gap-3 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label>客製混搭內容</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateItem(index, {
                              mixItems: [...item.mixItems, { productId: singleProducts[0]?.productId ?? "p_pineapple", qty: 1 }]
                            })
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />新增混搭
                        </Button>
                      </div>
                      {item.mixItems.map((mixItem, mixIndex) => (
                        <div key={mixIndex} className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
                          <select
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                            value={mixItem.productId}
                            onChange={(event) => updateMixItem(index, mixIndex, { productId: event.target.value })}
                          >
                            {singleProducts.map((productOption) => (
                              <option key={productOption.productId} value={productOption.productId}>
                                {productOption.productName}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="number"
                            min={1}
                            value={mixItem.qty}
                            onChange={(event) => updateMixItem(index, mixIndex, { qty: Number(event.target.value) })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updateItem(index, {
                                mixItems: item.mixItems.filter((_, currentMixIndex) => currentMixIndex !== mixIndex)
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setItems((current) => [...current, { productId: "p_pineapple", qty: 1, packagingId: "pkg_pineapple_bag", mixItems: [] }])}
            >
              <Plus className="mr-2 h-4 w-4" />新增明細
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "建立中..." : "建立訂單"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
