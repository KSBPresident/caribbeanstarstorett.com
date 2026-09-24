import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    ok:true,
    service:"caribbeanstarstorett-kernel",
    layers:["top","middle","back","kernel","front"],
    integrations:{wordpress:Boolean(process.env.WORDPRESS_BASE_URL),supabase:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),supabaseAuth:Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)}
  });
}
