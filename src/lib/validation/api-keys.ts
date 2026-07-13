import "server-only";
import { z } from "zod";

export const apiKeyScopeSchema = z.enum([
  "read:posts",
  "write:posts",
  "read:analytics",
  "read:inbox",
  "write:inbox",
  "read:webhooks",
  "write:webhooks",
  "all",
]);

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(80),
  scopes: z.array(apiKeyScopeSchema).min(1).max(20),
});

export type ApiKeyScope = z.infer<typeof apiKeyScopeSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
