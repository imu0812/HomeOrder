import { notFound } from "next/navigation";
import { getRepositories } from "@/repositories/provider";
import { PackagingBomClient } from "./packaging-bom-client";

export default async function PackagingBomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repos = getRepositories();
  const [packaging, bomItems, packagings] = await Promise.all([
    repos.packagings.findById(id),
    repos.bom.listPackagingBom(id),
    repos.packagings.list()
  ]);

  if (!packaging) notFound();
  return <PackagingBomClient packaging={packaging} bomItems={bomItems} packagings={packagings} />;
}
