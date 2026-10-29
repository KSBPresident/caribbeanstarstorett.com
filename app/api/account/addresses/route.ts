import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { isSupabaseConfigured } from "../../../../lib/supabase/configured";

export const runtime = "nodejs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AddressInput = {
  label?: unknown;
  recipient?: unknown;
  phone?: unknown;
  country_code?: unknown;
  address_line1?: unknown;
  address_line2?: unknown;
  city?: unknown;
  parish_or_county?: unknown;
  landmarks?: unknown;
  postal_code?: unknown;
  is_default?: unknown;
};

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function addressFields(input: AddressInput) {
  const fields = {
    label: clean(input.label, 60),
    recipient: clean(input.recipient, 100),
    phone: clean(input.phone, 30),
    country_code: clean(input.country_code, 2).toUpperCase(),
    address_line1: clean(input.address_line1, 160),
    address_line2: clean(input.address_line2, 160),
    city: clean(input.city, 100),
    parish_or_county: clean(input.parish_or_county, 100),
    landmarks: clean(input.landmarks, 240),
    postal_code: clean(input.postal_code, 24),
    is_default: input.is_default === true,
  };
  if (fields.label.length < 1 || fields.recipient.length < 2 || !fields.phone ||
      !/^[A-Z]{2}$/.test(fields.country_code) || !fields.address_line1 ||
      !fields.city || !fields.parish_or_county) return null;
  return {
    ...fields,
    address_line2: fields.address_line2 || null,
    landmarks: fields.landmarks || null,
    postal_code: fields.postal_code || null,
  };
}

async function signedInClient() {
  if (!isSupabaseConfigured()) return { response: NextResponse.json({ error: "Address book is temporarily unavailable." }, { status: 503 }) };
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { response: NextResponse.json({ error: "Sign in to manage delivery addresses." }, { status: 401 }) };
  return { supabase, user };
}

export async function GET() {
  const auth = await signedInClient();
  if ("response" in auth) return auth.response;
  const { data, error } = await auth.supabase.from("checkout_saved_addresses")
    .select("id, label, recipient, phone, country_code, address_line1, address_line2, city, parish_or_county, landmarks, postal_code, is_default, updated_at")
    .eq("user_id", auth.user.id)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load saved addresses." }, { status: 500 });
  return NextResponse.json({ addresses: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const auth = await signedInClient();
  if ("response" in auth) return auth.response;
  let input: AddressInput;
  try { input = await request.json() as AddressInput; }
  catch { return NextResponse.json({ error: "Enter a valid delivery address." }, { status: 400 }); }
  const fields = addressFields(input);
  if (!fields) return NextResponse.json({ error: "Complete the required address fields." }, { status: 400 });

  const { count, error: countError } = await auth.supabase.from("checkout_saved_addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id);
  if (countError) return NextResponse.json({ error: "Could not save this address." }, { status: 500 });
  const makeDefault = fields.is_default || count === 0;
  if (makeDefault) {
    const { error } = await auth.supabase.from("checkout_saved_addresses")
      .update({ is_default: false })
      .eq("user_id", auth.user.id);
    if (error) return NextResponse.json({ error: "Could not update your default address." }, { status: 500 });
  }
  const { data, error } = await auth.supabase.from("checkout_saved_addresses")
    .insert({ ...fields, is_default: makeDefault, user_id: auth.user.id })
    .select("id, label, recipient, phone, country_code, address_line1, address_line2, city, parish_or_county, landmarks, postal_code, is_default, updated_at")
    .single();
  if (error) return NextResponse.json({ error: "Could not save this address." }, { status: 500 });
  return NextResponse.json({ address: data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request: Request) {
  const auth = await signedInClient();
  if ("response" in auth) return auth.response;
  let payload: AddressInput & { id?: unknown };
  try { payload = await request.json() as AddressInput & { id?: unknown }; }
  catch { return NextResponse.json({ error: "Enter a valid delivery address." }, { status: 400 }); }
  const id = clean(payload.id, 36);
  const fields = addressFields(payload);
  if (!uuidPattern.test(id) || !fields) return NextResponse.json({ error: "Check the address details and try again." }, { status: 400 });

  if (fields.is_default) {
    const { error } = await auth.supabase.from("checkout_saved_addresses")
      .update({ is_default: false })
      .eq("user_id", auth.user.id)
      .neq("id", id);
    if (error) return NextResponse.json({ error: "Could not update your default address." }, { status: 500 });
  }
  const { data, error } = await auth.supabase.from("checkout_saved_addresses")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select("id, label, recipient, phone, country_code, address_line1, address_line2, city, parish_or_county, landmarks, postal_code, is_default, updated_at")
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Could not update this address." }, { status: error ? 500 : 404 });
  return NextResponse.json({ address: data }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(request: Request) {
  const auth = await signedInClient();
  if ("response" in auth) return auth.response;
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!uuidPattern.test(id)) return NextResponse.json({ error: "Select a valid saved address." }, { status: 400 });
  const { data, error } = await auth.supabase.from("checkout_saved_addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Could not remove this address." }, { status: error ? 500 : 404 });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
