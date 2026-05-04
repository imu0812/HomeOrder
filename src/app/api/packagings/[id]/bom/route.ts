import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { replacePackagingBom } from "@/services/packagingService";

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

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const repos = getRepositories();
    const bomItems = await replacePackagingBom(repos, id, await request.json());
    if (!bomItems) {
      return NextResponse.json({ success: false, message: "Packaging not found", data: null }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Packaging BOM updated", data: { bomItems } });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Update packaging BOM failed", data: null },
      { status: 400 }
    );
  }
}
