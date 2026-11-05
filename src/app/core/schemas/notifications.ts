import * as z from 'zod';

export const notificationLevelSchema = z.enum(['info', 'success', 'warning', 'error']);

export const notificationSchema = z.object({
  id: z.string(),
  level: notificationLevelSchema,
  title: z.string(),
  message: z.string(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
  action: z.object({ label: z.string(), link: z.string() }).optional(),
});

export const notificationListSchema = z.array(notificationSchema);

export type NotificationLevel = z.infer<typeof notificationLevelSchema>;
export type AppNotification = Readonly<z.infer<typeof notificationSchema>>;
export type NewNotification = Pick<AppNotification, 'level' | 'title' | 'message' | 'action'>;
