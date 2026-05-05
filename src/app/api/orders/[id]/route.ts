import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { getOrderDetail, updateOrderSummary } from "@/services/orderService";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const repos = getRepositories();
  const detail = await getOrderDetail(repos, id);
  if (!detail) return NextResponse.json({ success: false, message: "Order not found", data: null }, { status: 404 });
  return NextResponse.json({ success: true, message: "OK", data: detail });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const repos = getRepositories();
    const order = await updateOrderSummary(repos, id, await request.json());
    return NextResponse.json({ success: true, message: "Order updated", data: order });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Order update failed", data: null },
      { status: 400 }
    );
  }
}
