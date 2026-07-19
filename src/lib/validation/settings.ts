import "server-only";
import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  photoURL: z.string().url().optional(),
  photoData: z.string().max(5_000_000).optional(),
  bio: z.string().max(280).optional(),
  locale: z.string().min(2).max(10).optional(),
  timezone: z.string().min(1).max(60).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const notificationPrefsSchema = z.object({
  emailDigest: z.boolean().optional(),
  emailDigestFrequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  pushEnabled: z.boolean().optional(),
  postPublished: z.boolean().optional(),
  postFailed: z.boolean().optional(),
  inboxComment: z.boolean().optional(),
  inboxMessage: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type NotificationPrefsInput = z.infer<typeof notificationPrefsSchema>;
