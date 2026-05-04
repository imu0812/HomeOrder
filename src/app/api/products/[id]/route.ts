import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { deleteProduct, updateProduct } from "@/services/productService";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const repos = getRepositories();
    const product = await updateProduct(repos, id, await request.json());
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found", data: null }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Product updated", data: product });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Update product failed", data: null },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const repos = getRepositories();
    const deleted = await deleteProduct(repos, id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Product not found", data: null }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Product deleted", data: null });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Delete product failed", data: null },
      { status: 400 }
    );
  }
}
