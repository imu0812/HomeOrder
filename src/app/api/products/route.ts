import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";

export async function GET() {
  const repos = getRepositories();
  return NextResponse.json(await repos.products.list());
}
