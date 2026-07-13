import "server-only";
import { z } from "zod";

export const workspacePlanSchema = z.enum(["free", "pro", "team", "enterprise"]);

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(120),
  plan: workspacePlanSchema.optional().default("free"),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  plan: workspacePlanSchema.optional(),
  settings: z.record(z.unknown()).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]).default("editor"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["owner", "admin", "editor", "viewer"]),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
