import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { createMockOrderFromTemplate, listOrderItemsSummary } from "@/services/orderService";

export async function GET() {
  const repos = getRepositories();
  const orders = await listOrderItemsSummary(repos);
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const repos = getRepositories();
  const body = await request.json();
  const order = await createMockOrderFromTemplate(repos, body);
  return NextResponse.json({ success: true, message: "Order created", data: order }, { status: 201 });
}
