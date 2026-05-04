import { NextResponse } from "next/server";
import { getRepositories } from "@/repositories/provider";
import { createPackaging } from "@/services/packagingService";

export async function GET() {
  const repos = getRepositories();
  return NextResponse.json(await repos.packagings.list());
}

export async function POST(request: Request) {
  try {
    const repos = getRepositories();
    const packaging = await createPackaging(repos, await request.json());
    return NextResponse.json({ success: true, message: "Packaging created", data: packaging });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Create packaging failed", data: null },
      { status: 400 }
    );
  }
}
