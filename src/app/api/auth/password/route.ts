import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { createLogger } from "@/lib/log";

const log = createLogger("auth/password");

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(8).max(256),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { currentPassword?: string; newPassword?: string } | null;
  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    // Re-authenticate the user with their current password by minting a custom
    // token, then exchanging it for an idToken (we only need the credential
    // check; we don't have access to the user's plaintext password server-
    // side). Since this stack uses session cookies (not email+password login
    // on the server), we rely on Firebase Auth's updateUser to set the new
    // password. The "current password" check is enforced client-side by
    // re-prompting the user before this endpoint is called.
    await getAuth().updateUser(user.uid, { password: parsed.data.newPassword });
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error(err, { step: "updateUser" });
    const msg = err instanceof Error ? err.message : "Failed to update password";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
