import { NextResponse } from "next/server";

// デバッグ用の簡単なAPI
export async function GET() {
  console.log("[DEBUG_API] デバッグAPI呼び出し");

  return NextResponse.json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
    path: "/api/debug",
  });
}
