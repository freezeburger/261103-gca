import { z } from "zod"

export const productApiEndpoint = "http://dummyjson.com/products";

export const productSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number(),
  thumbnail: z.string()
})

export const productApiResponseSchema = z.object({
  products: z.array(productSchema)
})


export type ProductSchema = z.infer<typeof productSchema>;
export type ProductApiResponseSchema = z.infer<typeof productApiResponseSchema>;