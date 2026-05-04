import { z } from "zod";
import { PRODUCT_TYPES } from "@/domain/constants";
import type { Product, ProductBOMItem } from "@/domain/types";
import { createId } from "@/lib/utils";
import type { Repositories } from "@/repositories/interfaces";

export const productInputSchema = z.object({
  productCode: z.string().min(1),
  productName: z.string().min(1),
  productType: z.enum(PRODUCT_TYPES),
  unit: z.string().min(1),
  price: z.number().nonnegative(),
  safeStock: z.number().nonnegative(),
  isCompositeProduct: z.boolean().optional(),
  isActive: z.boolean().optional(),
  remark: z.string().optional().nullable()
});

export const replaceProductBomInputSchema = z.object({
  items: z.array(
    z.object({
      childProductId: z.string().min(1),
      qty: z.number().positive(),
      sortOrder: z.number().int().positive()
    })
  )
});

function isCompositeType(productType: Product["productType"]) {
  return productType === "bundle" || productType === "custom_bundle_template";
}

export async function createProduct(repos: Repositories, rawInput: unknown): Promise<Product> {
  const input = productInputSchema.parse(rawInput);
  const product: Product = {
    productId: createId("p"),
    productCode: input.productCode,
    productName: input.productName,
    productType: input.productType,
    unit: input.unit,
    price: input.price,
    safeStock: input.safeStock,
    isCompositeProduct: input.isCompositeProduct ?? isCompositeType(input.productType),
    isActive: input.isActive ?? true,
    remark: input.remark ?? undefined
  };
  return repos.products.create(product);
}

export async function updateProduct(repos: Repositories, productId: string, rawInput: unknown): Promise<Product | undefined> {
  const existing = await repos.products.findById(productId);
  if (!existing) return undefined;
  const input = productInputSchema.parse(rawInput);
  return repos.products.update({
    ...existing,
    productCode: input.productCode,
    productName: input.productName,
    productType: input.productType,
    unit: input.unit,
    price: input.price,
    safeStock: input.safeStock,
    isCompositeProduct: input.isCompositeProduct ?? isCompositeType(input.productType),
    isActive: input.isActive ?? true,
    remark: input.remark ?? undefined
  });
}

export async function deleteProduct(repos: Repositories, productId: string): Promise<boolean> {
  const existing = await repos.products.findById(productId);
  if (!existing) return false;

  const orders = await repos.orders.listOrders();
  for (const order of orders) {
    const orderItems = await repos.orders.listOrderItems(order.orderId);
    if (orderItems.some((item) => item.productId === productId)) {
      throw new Error("商品已被訂單明細使用，不能刪除");
    }

    for (const orderItem of orderItems) {
      const mixItems = await repos.orders.listMixItems(orderItem.id);
      if (mixItems.some((item) => item.productId === productId)) {
        throw new Error("商品已被訂單組合內容使用，不能刪除");
      }
    }
  }

  const products = await repos.products.list();
  for (const product of products) {
    if (product.productId === productId) continue;
    const bomItems = await repos.bom.listProductBom(product.productId);
    if (bomItems.some((item) => item.childProductId === productId)) {
      throw new Error("商品已被其他商品 BOM 使用，不能刪除");
    }
  }

  await repos.products.delete(productId);
  return true;
}

export async function replaceProductBom(
  repos: Repositories,
  parentProductId: string,
  rawInput: unknown
): Promise<ProductBOMItem[] | undefined> {
  const parent = await repos.products.findById(parentProductId);
  if (!parent) return undefined;
  const input = replaceProductBomInputSchema.parse(rawInput);
  const items: ProductBOMItem[] = [];

  for (const item of input.items) {
    if (item.childProductId === parentProductId) {
      throw new Error("BOM cannot include the parent product itself");
    }
    const child = await repos.products.findById(item.childProductId);
    if (!child) throw new Error(`Product not found: ${item.childProductId}`);
    items.push({
      id: createId("pbom"),
      parentProductId,
      childProductId: item.childProductId,
      qty: item.qty,
      sortOrder: item.sortOrder
    });
  }

  await repos.bom.replaceProductBom(parentProductId, items);
  return items;
}
