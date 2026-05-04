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
import type { Packaging, PackagingType } from "@/domain/types";

type PackagingForm = {
  packagingCode: string;
  packagingName: string;
  packagingType: PackagingType;
  unit: string;
  currentStock: string;
  reservedStock: string;
  safeStock: string;
  isComposite: boolean;
  isActive: boolean;
  remark: string;
};

const emptyForm: PackagingForm = {
  packagingCode: "",
  packagingName: "",
  packagingType: "single_packaging",
  unit: "個",
  currentStock: "0",
  reservedStock: "0",
  safeStock: "0",
  isComposite: false,
  isActive: true,
  remark: ""
};

async function fetchPackagings(): Promise<Packaging[]> {
  const response = await fetch("/api/packagings");
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "讀取包材失敗");
  return json;
}

function toForm(packaging?: Packaging): PackagingForm {
  if (!packaging) return emptyForm;
  return {
    packagingCode: packaging.packagingCode,
    packagingName: packaging.packagingName,
    packagingType: packaging.packagingType,
    unit: packaging.unit,
    currentStock: String(packaging.currentStock),
    reservedStock: String(packaging.reservedStock),
    safeStock: String(packaging.safeStock),
    isComposite: packaging.isComposite,
    isActive: packaging.isActive,
    remark: packaging.remark ?? ""
  };
}

function toPayload(form: PackagingForm) {
  return {
    packagingCode: form.packagingCode,
    packagingName: form.packagingName,
    packagingType: form.packagingType,
    unit: form.unit,
    currentStock: Number(form.currentStock),
    reservedStock: Number(form.reservedStock),
    safeStock: Number(form.safeStock),
    isComposite: form.isComposite,
    isActive: form.isActive,
    remark: form.remark || undefined
  };
}

async function savePackaging(input: { packagingId?: string; form: PackagingForm }) {
  const response = await fetch(input.packagingId ? `/api/packagings/${input.packagingId}` : "/api/packagings", {
    method: input.packagingId ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toPayload(input.form))
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "儲存包材失敗");
  return json.data as Packaging;
}

async function deletePackaging(packagingId: string) {
  const response = await fetch(`/api/packagings/${packagingId}`, { method: "DELETE" });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "刪除包材失敗");
  return json;
}

export function PackagingsClient({ initialPackagings }: { initialPackagings: Packaging[] }) {
  const queryClient = useQueryClient();
  const [editingPackaging, setEditingPackaging] = useState<Packaging | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<PackagingForm>(emptyForm);

  const { data: packagings = initialPackagings } = useQuery({
    queryKey: ["packagings"],
    queryFn: fetchPackagings,
    initialData: initialPackagings,
    staleTime: 30_000
  });

  const saveMutation = useMutation({
    mutationFn: savePackaging,
    onSuccess: () => {
      toast.success("包材已儲存");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["packagings"] });
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: deletePackaging,
    onSuccess: () => {
      toast.success("包材已刪除");
      queryClient.invalidateQueries({ queryKey: ["packagings"] });
    },
    onError: (error) => toast.error(error.message)
  });

  function openCreate() {
    setEditingPackaging(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  }

  function openEdit(packaging: Packaging) {
    setEditingPackaging(packaging);
    setForm(toForm(packaging));
    setIsDialogOpen(true);
  }

  function handleDelete(packaging: Packaging) {
    if (!window.confirm(`確定要刪除「${packaging.packagingName}」嗎？`)) return;
    deleteMutation.mutate(packaging.packagingId);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>包材管理</CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新增包材
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>編號</TableHead>
              <TableHead>名稱</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>組合</TableHead>
              <TableHead>庫存</TableHead>
              <TableHead>預留</TableHead>
              <TableHead>安全庫存</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packagings.map((packaging) => (
              <TableRow key={packaging.packagingId}>
                <TableCell>{packaging.packagingCode}</TableCell>
                <TableCell className="font-medium">{packaging.packagingName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{packaging.packagingType}</Badge>
                </TableCell>
                <TableCell>{packaging.isComposite ? "是" : "否"}</TableCell>
                <TableCell>{packaging.currentStock}</TableCell>
                <TableCell>{packaging.reservedStock}</TableCell>
                <TableCell>{packaging.safeStock}</TableCell>
                <TableCell>{packaging.isActive ? "啟用" : "停用"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(packaging)} title="編輯包材">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(packaging)}
                      title="刪除包材"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/packagings/${packaging.packagingId}/bom`}>BOM</Link>
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
            <DialogTitle>{editingPackaging ? "編輯包材" : "新增包材"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>編號</Label>
              <Input value={form.packagingCode} onChange={(event) => setForm((value) => ({ ...value, packagingCode: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>名稱</Label>
              <Input value={form.packagingName} onChange={(event) => setForm((value) => ({ ...value, packagingName: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>類型</Label>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.packagingType}
                onChange={(event) => setForm((value) => ({ ...value, packagingType: event.target.value as PackagingType }))}
              >
                <option value="single_packaging">單一包材</option>
                <option value="gift_box">禮盒</option>
                <option value="bag">提袋</option>
                <option value="accessory">配件</option>
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="grid gap-2">
                <Label>單位</Label>
                <Input value={form.unit} onChange={(event) => setForm((value) => ({ ...value, unit: event.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>庫存</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.currentStock}
                  onChange={(event) => setForm((value) => ({ ...value, currentStock: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>預留</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.reservedStock}
                  onChange={(event) => setForm((value) => ({ ...value, reservedStock: event.target.value }))}
                />
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
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isComposite}
                  onChange={(event) => setForm((value) => ({ ...value, isComposite: event.target.checked }))}
                />
                組合包材
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))}
                />
                啟用
              </label>
            </div>
            <div className="grid gap-2">
              <Label>備註</Label>
              <Input value={form.remark} onChange={(event) => setForm((value) => ({ ...value, remark: event.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button
                disabled={saveMutation.isPending || !form.packagingCode || !form.packagingName || !form.unit}
                onClick={() => saveMutation.mutate({ packagingId: editingPackaging?.packagingId, form })}
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
