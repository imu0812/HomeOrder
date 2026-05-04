import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { replaceProductBom } from "@/services/productService";

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

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const repos = getRepositories();
    const bomItems = await replaceProductBom(repos, id, await request.json());
    if (!bomItems) {
      return NextResponse.json({ success: false, message: "Product not found", data: null }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "BOM updated", data: { bomItems } });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Update BOM failed", data: null },
      { status: 400 }
    );
  }
}
