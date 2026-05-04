import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { voidOrder } from "@/services/orderService";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const repos = getRepositories();
    const result = await voidOrder(repos, id);
    return NextResponse.json(
      { success: result.success, message: result.message, data: result },
      { status: result.success ? 200 : 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Void failed", data: null },
      { status: 500 }
    );
  }
}
