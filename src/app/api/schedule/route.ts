import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { listScheduleItems } from "@/services/orderService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json({ success: false, message: "date is required", data: [] }, { status: 400 });
  }

  const repos = getRepositories();
  const items = await listScheduleItems(repos, date);
  return NextResponse.json({ success: true, message: "OK", data: items });
}
