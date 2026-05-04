import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { fulfillOrderItem } from "@/services/orderService";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await context.params;
    const repos = getRepositories();
    const result = await fulfillOrderItem(repos, id, itemId);
    return NextResponse.json(
      { success: result.success, message: result.message, data: result },
      { status: result.success ? 200 : 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Fulfill failed", data: null },
      { status: 500 }
    );
  }
}
