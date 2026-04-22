import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const repos = getRepositories();
  const bomItems = await repos.bom.listPackagingBom(id);
  const packagings = await repos.packagings.list();
  return NextResponse.json({
    bomItems: bomItems.map((item) => ({
      ...item,
      childPackaging: packagings.find((packaging) => packaging.packagingId === item.childPackagingId)
    }))
  });
}
