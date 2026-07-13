import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listForUser, saveBio, deleteBio } from "@/lib/db/link-in-bio";
import { saveLinkInBioSchema, updateLinkInBioSchema } from "@/lib/validation/link-in-bio";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const items = await listForUser(session.uid);
  return jsonOk({ bios: items });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = await parseBody(request, saveLinkInBioSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  const data = saveLinkInBioSchema.parse(parsed.data);
  await saveBio(session.uid, data);
  return jsonOk({ username: data.username }, 201);
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = await parseBody(request, updateLinkInBioSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }
  if (!parsed.data.username) {
    return jsonError(400, "username is required for update");
  }
  const { username, ...rest } = parsed.data;
  await saveBio(session.uid, {
    username,
    bio: rest.bio ?? "",
    blocks: (rest.blocks ?? []) as Array<{ type: string; data: Record<string, unknown> }>,
    theme: rest.theme ?? "default",
    socials: (rest.socials ?? {}) as Record<string, string>,
    avatarUrl: rest.avatarUrl,
  });
  return jsonOk({ username });
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const username = url.searchParams.get("username");
  if (!username) return jsonError(400, "username is required");
  await deleteBio(session.uid, username);
  return jsonOk({ username });
}
