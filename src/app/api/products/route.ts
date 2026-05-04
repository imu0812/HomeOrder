import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { createProduct } from "@/services/productService";

export async function GET() {
  const repos = getRepositories();
  return NextResponse.json(await repos.products.list());
}

export async function POST(request: Request) {
  try {
    const repos = getRepositories();
    const product = await createProduct(repos, await request.json());
    return NextResponse.json({ success: true, message: "Product created", data: product });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Create product failed", data: null },
      { status: 400 }
    );
  }
}
