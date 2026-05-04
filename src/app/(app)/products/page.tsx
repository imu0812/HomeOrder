import { getRepositories } from "@/repositories/provider";
import { ProductsClient } from "./products-client";

export default async function ProductsPage() {
  const products = await getRepositories().products.list();
  return <ProductsClient initialProducts={products} />;
}
