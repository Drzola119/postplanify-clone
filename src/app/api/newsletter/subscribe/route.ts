import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json() as { email?: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
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
