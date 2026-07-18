import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { stripe, createPortalSession } from "@/lib/stripe";
import { jsonError, jsonOk } from "@/lib/validation/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  if (!process.env.STRIPE_SECRET_KEY) {
    return jsonError(503, "Billing not configured");
  }

  const { returnUrl } = await request.json() as { returnUrl?: string };
  const customers = await stripe.customers.list({ email: session.email ?? "", limit: 1 });
  if (customers.data.length === 0) {
    return jsonError(404, "No billing account found");
  }

  const portal = await createPortalSession(customers.data[0].id, returnUrl ?? "/dashboard/settings");
  return jsonOk({ url: portal.url });
}
