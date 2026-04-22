import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";

export async function GET() {
  const repos = getRepositories();
  const [inventory, packagings] = await Promise.all([repos.inventory.listPackagingInventory(), repos.packagings.list()]);
  return NextResponse.json(
    inventory.map((item) => ({
      ...item,
      packaging: packagings.find((packaging) => packaging.packagingId === item.packagingId)
    }))
  );
}
