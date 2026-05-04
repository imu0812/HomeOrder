"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product, ProductType } from "@/domain/types";

type ProductForm = {
  productCode: string;
  productName: string;
  productType: ProductType;
  unit: string;
  price: string;
  safeStock: string;
  isActive: boolean;
  remark: string;
};

const emptyForm: ProductForm = {
  productCode: "",
  productName: "",
  productType: "single",
  unit: "個",
  price: "0",
  safeStock: "0",
  isActive: true,
  remark: ""
};

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch("/api/products");
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "讀取商品失敗");
  return json;
}

function toForm(product?: Product): ProductForm {
  if (!product) return emptyForm;
  return {
    productCode: product.productCode,
    productName: product.productName,
    productType: product.productType,
    unit: product.unit,
    price: String(product.price),
    safeStock: String(product.safeStock),
    isActive: product.isActive,
    remark: product.remark ?? ""
  };
}

function toPayload(form: ProductForm) {
  return {
    productCode: form.productCode,
    productName: form.productName,
    productType: form.productType,
    unit: form.unit,
    price: Number(form.price),
    safeStock: Number(form.safeStock),
    isActive: form.isActive,
    remark: form.remark || undefined
  };
}

async function saveProduct(input: { productId?: string; form: ProductForm }) {
  const response = await fetch(input.productId ? `/api/products/${input.productId}` : "/api/products", {
    method: input.productId ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toPayload(input.form))
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "儲存商品失敗");
  return json.data as Product;
}

async function deleteProduct(productId: string) {
  const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "刪除商品失敗");
  return json;
}

export function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const { data: products = initialProducts } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    initialData: initialProducts,
    staleTime: 30_000
  });

  const mutation = useMutation({
    mutationFn: saveProduct,
    onSuccess: () => {
      toast.success("商品已儲存");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success("商品已刪除");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => toast.error(error.message)
  });

  function openCreate() {
    setEditingProduct(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setForm(toForm(product));
    setIsDialogOpen(true);
  }

  function handleDelete(product: Product) {
    if (!window.confirm(`確定要刪除「${product.productName}」嗎？`)) return;
    deleteMutation.mutate(product.productId);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>商品管理</CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新增商品
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>編號</TableHead>
              <TableHead>名稱</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>售價</TableHead>
              <TableHead>安全庫存</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.productId}>
                <TableCell>{product.productCode}</TableCell>
                <TableCell className="font-medium">{product.productName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{product.productType}</Badge>
                </TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell>{product.safeStock}</TableCell>
                <TableCell>{product.isActive ? "啟用" : "停用"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(product)} title="編輯商品">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(product)}
                      title="刪除商品"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/products/${product.productId}/bom`}>BOM</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "編輯商品" : "新增商品"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>編號</Label>
              <Input value={form.productCode} onChange={(event) => setForm((value) => ({ ...value, productCode: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>名稱</Label>
              <Input value={form.productName} onChange={(event) => setForm((value) => ({ ...value, productName: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>類型</Label>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.productType}
                onChange={(event) => setForm((value) => ({ ...value, productType: event.target.value as ProductType }))}
              >
                <option value="single">單品</option>
                <option value="bundle">固定組合</option>
                <option value="custom_bundle_template">自訂組合模板</option>
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>單位</Label>
                <Input value={form.unit} onChange={(event) => setForm((value) => ({ ...value, unit: event.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>售價</Label>
                <Input type="number" min="0" value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>安全庫存</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.safeStock}
                  onChange={(event) => setForm((value) => ({ ...value, safeStock: event.target.value }))}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))}
              />
              啟用
            </label>
            <div className="grid gap-2">
              <Label>備註</Label>
              <Input value={form.remark} onChange={(event) => setForm((value) => ({ ...value, remark: event.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button
                disabled={mutation.isPending || !form.productCode || !form.productName || !form.unit}
                onClick={() => mutation.mutate({ productId: editingProduct?.productId, form })}
              >
                儲存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
