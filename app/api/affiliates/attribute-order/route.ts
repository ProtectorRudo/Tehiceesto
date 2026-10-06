import { NextRequest, NextResponse } from "next/server";
import { attributeOrderFromCurrentRequest } from "@/lib/affiliates/core";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { orderId?: string; paymentToken?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const orderId = String(body.orderId || "").trim();
  const paymentToken = String(body.paymentToken || "").trim();

  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !/^[a-f0-9]{48}$/i.test(paymentToken)) {
    return NextResponse.json({ ok: false, error: "invalid_order" }, { status: 400 });
  }

  const supabase = createAdminSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id,status")
    .eq("id", orderId)
    .eq("payment_token", paymentToken)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
  }

  if (order.status !== "pending") {
    return NextResponse.json({ ok: false, error: "order_not_pending" }, { status: 409 });
  }

  const attribution = await attributeOrderFromCurrentRequest(order.id);

  return NextResponse.json(
    { ok: true, attributed: Boolean(attribution) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
