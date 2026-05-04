import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { updatePendingOrderItem } from "@/services/orderService";

export async function PATCH(request: Request, context: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const { id, itemId } = await context.params;
    const repos = getRepositories();
    const result = await updatePendingOrderItem(repos, id, itemId, await request.json());
    return NextResponse.json(
      { success: result.success, message: result.message, data: result },
      { status: result.success ? 200 : 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Update item failed", data: null },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const { id, itemId } = await context.params;
    const repos = getRepositories();
    const result = await updatePendingOrderItem(repos, id, itemId, { cancel: true });
    return NextResponse.json(
      { success: result.success, message: result.message, data: result },
      { status: result.success ? 200 : 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Cancel item failed", data: null },
      { status: 500 }
    );
  }
}
