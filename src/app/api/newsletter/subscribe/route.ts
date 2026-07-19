import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/db";

const subscribeSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = subscribeSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    const { email } = parsed.data;
    if (!adminDb) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    const ref = adminDb.collection("newsletter").doc();
    await ref.set({ email, subscribedAt: new Date(), source: "website" });
    return NextResponse.json({ success: true, id: ref.id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
