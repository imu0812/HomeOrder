import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { getOrderDetail } from "@/services/orderService";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const repos = getRepositories();
  const detail = await getOrderDetail(repos, id);
  if (!detail) return NextResponse.json({ success: false, message: "Order not found", data: null }, { status: 404 });
  return NextResponse.json({ success: true, message: "OK", data: detail });
}
