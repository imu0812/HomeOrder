import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "舊版 cancel 路由已停用，請改用 void 或 unconfirm。",
      data: null
    },
    { status: 410 }
  );
}
