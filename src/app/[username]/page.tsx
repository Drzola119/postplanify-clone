import LinkInBioPublicClient from "./client";

export default async function LinkInBioPublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  // Strip leading @ if present (handles both /hola and /@hola via rewrite)
  const handle = username.startsWith("@") ? username.slice(1) : username;
  return <LinkInBioPublicClient username={handle} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const handle = username.startsWith("@") ? username.slice(1) : username;
  return {
    title: `@${handle} | PostPlanify`,
    description: `Check out @${handle} on PostPlanify`,
  };
}