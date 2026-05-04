import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { unconfirmOrder } from "@/services/orderService";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const repos = getRepositories();
    const result = await unconfirmOrder(repos, id);
    return NextResponse.json(
      { success: result.success, message: result.message, data: result },
      { status: result.success ? 200 : 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unconfirm failed", data: null },
      { status: 500 }
    );
  }
}
