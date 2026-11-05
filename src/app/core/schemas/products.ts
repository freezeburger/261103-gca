import * as z from 'zod';

export const productSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  price: z.number(),
  thumbnail: z.string(),
  category: z.string().optional(),
  brand: z.string().optional(),
  stock: z.number().int().optional(),
});

export const productListSchema = z.array(productSchema);

/** Champs modifiables depuis l'écran de modification (maquette 04). */
export const productChangesSchema = productSchema.pick({
  title: true,
  description: true,
  price: true,
  thumbnail: true,
});

export type ProductSchema = z.infer<typeof productSchema>;
export type ProductChanges = z.infer<typeof productChangesSchema>;
