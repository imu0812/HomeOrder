import { getRepositories } from "@/repositories/provider";
import { PackagingsClient } from "./packagings-client";

export default async function PackagingsPage() {
  const packagings = await getRepositories().packagings.list();
  return <PackagingsClient initialPackagings={packagings} />;
}
