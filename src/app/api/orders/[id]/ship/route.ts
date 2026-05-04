import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "整張訂單 shipped 流程已停用，請改用 OrderItem fulfill。",
      data: null
    },
    { status: 410 }
  );
}
