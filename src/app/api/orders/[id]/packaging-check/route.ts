import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { recheckOrderPackaging } from "@/services/orderService";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const repos = getRepositories();
  const result = await recheckOrderPackaging(repos, id);
  return NextResponse.json(
    { success: result.success, message: result.message, data: result },
    { status: result.success ? 200 : 400 }
  );
}
