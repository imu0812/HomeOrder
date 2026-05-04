import { notFound } from "next/navigation";
import { getRepositories } from "@/repositories/provider";
import { ProductBomClient } from "./product-bom-client";

export default async function ProductBomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repos = getRepositories();
  const [product, bomItems, products] = await Promise.all([
    repos.products.findById(id),
    repos.bom.listProductBom(id),
    repos.products.list()
  ]);

  if (!product) notFound();
  return <ProductBomClient product={product} bomItems={bomItems} products={products} />;
}
