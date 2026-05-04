import { z } from "zod";
import { PACKAGING_TYPES } from "@/domain/constants";
import type { Packaging, PackagingBOMItem } from "@/domain/types";
import { createId } from "@/lib/utils";
import type { Repositories } from "@/repositories/interfaces";

export const packagingInputSchema = z.object({
  packagingCode: z.string().min(1),
  packagingName: z.string().min(1),
  packagingType: z.enum(PACKAGING_TYPES),
  unit: z.string().min(1),
  currentStock: z.number().nonnegative(),
  reservedStock: z.number().nonnegative().optional(),
  safeStock: z.number().nonnegative(),
  isComposite: z.boolean().optional(),
  isActive: z.boolean().optional(),
  remark: z.string().optional().nullable()
});

export const replacePackagingBomInputSchema = z.object({
  items: z.array(
    z.object({
      childPackagingId: z.string().min(1),
      qty: z.number().positive(),
      sortOrder: z.number().int().positive()
    })
  )
});

export async function createPackaging(repos: Repositories, rawInput: unknown): Promise<Packaging> {
  const input = packagingInputSchema.parse(rawInput);
  const packaging: Packaging = {
    packagingId: createId("pkg"),
    packagingCode: input.packagingCode,
    packagingName: input.packagingName,
    packagingType: input.packagingType,
    unit: input.unit,
    currentStock: input.currentStock,
    reservedStock: input.reservedStock ?? 0,
    safeStock: input.safeStock,
    isComposite: input.isComposite ?? false,
    isActive: input.isActive ?? true,
    remark: input.remark ?? undefined
  };
  return repos.packagings.create(packaging);
}

export async function updatePackaging(
  repos: Repositories,
  packagingId: string,
  rawInput: unknown
): Promise<Packaging | undefined> {
  const existing = await repos.packagings.findById(packagingId);
  if (!existing) return undefined;
  const input = packagingInputSchema.parse(rawInput);
  return repos.packagings.update({
    ...existing,
    packagingCode: input.packagingCode,
    packagingName: input.packagingName,
    packagingType: input.packagingType,
    unit: input.unit,
    currentStock: input.currentStock,
    reservedStock: input.reservedStock ?? existing.reservedStock,
    safeStock: input.safeStock,
    isComposite: input.isComposite ?? existing.isComposite,
    isActive: input.isActive ?? true,
    remark: input.remark ?? undefined
  });
}

export async function deletePackaging(repos: Repositories, packagingId: string): Promise<boolean> {
  const existing = await repos.packagings.findById(packagingId);
  if (!existing) return false;

  const orders = await repos.orders.listOrders();
  for (const order of orders) {
    const orderItems = await repos.orders.listOrderItems(order.orderId);
    if (orderItems.some((item) => item.packagingId === packagingId)) {
      throw new Error("包材已被訂單明細使用，不能刪除");
    }

    const components = await repos.orders.listComponents(order.orderId);
    if (components.some((item) => item.itemType === "packaging" && item.itemId === packagingId)) {
      throw new Error("包材已被訂單快照使用，不能刪除");
    }
  }

  const packagings = await repos.packagings.list();
  for (const packaging of packagings) {
    if (packaging.packagingId === packagingId) continue;
    const bomItems = await repos.bom.listPackagingBom(packaging.packagingId);
    if (bomItems.some((item) => item.childPackagingId === packagingId)) {
      throw new Error("包材已被其他包材 BOM 使用，不能刪除");
    }
  }

  await repos.packagings.delete(packagingId);
  return true;
}

export async function replacePackagingBom(
  repos: Repositories,
  parentPackagingId: string,
  rawInput: unknown
): Promise<PackagingBOMItem[] | undefined> {
  const parent = await repos.packagings.findById(parentPackagingId);
  if (!parent) return undefined;
  const input = replacePackagingBomInputSchema.parse(rawInput);
  const items: PackagingBOMItem[] = [];

  for (const item of input.items) {
    if (item.childPackagingId === parentPackagingId) {
      throw new Error("BOM cannot include the parent packaging itself");
    }
    const child = await repos.packagings.findById(item.childPackagingId);
    if (!child) throw new Error(`Packaging not found: ${item.childPackagingId}`);
    items.push({
      id: createId("kbom"),
      parentPackagingId,
      childPackagingId: item.childPackagingId,
      qty: item.qty,
      sortOrder: item.sortOrder
    });
  }

  await repos.bom.replacePackagingBom(parentPackagingId, items);
  return items;
}
