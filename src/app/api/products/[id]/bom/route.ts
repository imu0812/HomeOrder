import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const repos = getRepositories();
  const bomItems = await repos.bom.listProductBom(id);
  const products = await repos.products.list();
  return NextResponse.json({
    bomItems: bomItems.map((item) => ({
      ...item,
      childProduct: products.find((product) => product.productId === item.childProductId)
    }))
  });
}
