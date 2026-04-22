import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";

export async function GET() {
  const repos = getRepositories();
  const [inventory, products] = await Promise.all([repos.inventory.listProductInventory(), repos.products.list()]);
  return NextResponse.json(
    inventory.map((item) => ({
      ...item,
      product: products.find((product) => product.productId === item.productId)
    }))
  );
}
