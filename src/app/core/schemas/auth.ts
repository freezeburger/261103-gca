import * as z from 'zod';

export const authUserSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string(),
});

export const loginResponseSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.iso.datetime(),
  user: authUserSchema,
});

/** Session conservée dans le stockage du navigateur ; relue et validée au démarrage. */
export const authSessionSchema = loginResponseSchema;

export type AuthUser = z.infer<typeof authUserSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
