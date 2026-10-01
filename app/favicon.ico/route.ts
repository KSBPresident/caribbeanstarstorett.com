import { NextResponse, type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/caribbean-star-store-logo.svg", request.url), 307);
}
