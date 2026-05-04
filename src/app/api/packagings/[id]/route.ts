import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { deletePackaging, updatePackaging } from "@/services/packagingService";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const repos = getRepositories();
    const packaging = await updatePackaging(repos, id, await request.json());
    if (!packaging) {
      return NextResponse.json({ success: false, message: "Packaging not found", data: null }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Packaging updated", data: packaging });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Update packaging failed", data: null },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const repos = getRepositories();
    const deleted = await deletePackaging(repos, id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Packaging not found", data: null }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Packaging deleted", data: null });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Delete packaging failed", data: null },
      { status: 400 }
    );
  }
}
