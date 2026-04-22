import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { createMockOrderFromTemplate } from "@/services/orderService";

export async function GET() {
  const repos = getRepositories();
  const orders = await repos.orders.listOrders();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const repos = getRepositories();
  const body = await request.json();
  const order = await createMockOrderFromTemplate(repos, body);
  return NextResponse.json(order, { status: 201 });
}
