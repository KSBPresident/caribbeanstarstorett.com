import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "alive",
    service: "caribbeanstarstore-marketplace",
    layers: ["top", "middle", "back", "kernel", "front"],
  });
}
